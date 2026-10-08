import { test as base, expect } from "@playwright/test";
import Axios from "axios";

// Unique per worker AND per run, across both local and CI invocations, so
// concurrent runs (two CI jobs, or a local run alongside CI) never share an
// event and race on the same Sync Map item. GITHUB_RUN_ATTEMPT is included
// because GITHUB_RUN_ID stays constant across retries of the same run.
const PLATFORM = process.env.CI ? "ci" : "local";
const RUN_TAG = process.env.GITHUB_RUN_ID
  ? `${process.env.GITHUB_RUN_ID}-${process.env.GITHUB_RUN_ATTEMPT || 1}`
  : Math.random().toString(36).slice(2, 8);

export async function deleteIfExists(baseURL: string, slug: string) {
  try {
    await Axios.delete(`${baseURL}/api/event/${slug}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${btoa(process.env.ADMIN_LOGIN || ":")}`,
      },
    });
  } catch (e) {}
}

export async function createEvent(baseURL: string, slug: string, name: string) {
  return Axios.post(
    `${baseURL}/api/event`,
    {
      name,
      slug,
      state: "OPEN",
      senders: ["+4915199999999", "whatsapp:+447700161860"],
      selection: {
        items: [
          {
            title: "Espresso",
            shortTitle: "Espresso",
            description: "Strong black coffee",
          },
        ],
        modifiers: [],
        mode: "barista",
      },
      pickupLocation: "Pickup location",
      maxOrders: 1860,
      welcomeMessage: "Custom Welcome",
    },
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${btoa(process.env.ADMIN_LOGIN || ":")}`,
      },
    },
  );
}

export async function createOrder(
  baseURL: string,
  slug: string,
  status: string,
  originalText: string,
) {
  // Retry on transient 5xx — with many parallel Playwright workers each
  // creating ~60 orders in setup, Twilio Sync's per-list write rate limit
  // (~10/sec) surfaces as an intermittent 500 from POST /api/order. A short
  // capped backoff smooths the burst instead of exploding the fixture.
  const MAX_ATTEMPTS = 5;
  let lastErr: unknown;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      return await Axios.post(
        `${baseURL}/api/order`,
        {
          event: slug,
          order: {
            status,
            item: "Espresso",
            key: "test-order",
            address: "+123***123",
            originalText,
          },
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${btoa(process.env.ADMIN_LOGIN || ":")}`,
          },
        },
      );
    } catch (e: any) {
      const status = e?.response?.status;
      const retriable = status === 429 || (status >= 500 && status < 600);
      if (!retriable || attempt === MAX_ATTEMPTS) throw e;
      lastErr = e;
      const backoffMs = 250 * 2 ** (attempt - 1) + Math.floor(Math.random() * 100);
      await new Promise((r) => setTimeout(r, backoffMs));
    }
  }
  throw lastErr;
}

export type TestEvent = { slug: string; name: string };

export const test = base.extend<{}, { testEvent: TestEvent }>({
  testEvent: [
    async ({}, use, workerInfo) => {
      const baseURL = workerInfo.project.use.baseURL || "http://localhost:3000";
      const slug = `test-event-${PLATFORM}-${RUN_TAG}-w${workerInfo.workerIndex}`;
      // Event names are capped at 20 chars by the API (src/app/api/event/route.ts).
      const name = `Ev-w${workerInfo.workerIndex}-${RUN_TAG.slice(-4)}`;

      await deleteIfExists(baseURL, slug);
      const response = await createEvent(baseURL, slug, name);
      if (response.status !== 201) {
        throw new Error(`Failed to create test event (status ${response.status})`);
      }

      await createOrder(baseURL, slug, "cancelled", "A Cancelled Order");
      await createOrder(baseURL, slug, "delivered", "A Delivered Order");
      for (let i = 0; i < 2; i++) {
        await createOrder(baseURL, slug, "queued", "firefox");
      }
      for (let i = 0; i < 4; i++) {
        await createOrder(baseURL, slug, "queued", "chromium");
      }
      for (let i = 0; i < 4; i++) {
        await createOrder(baseURL, slug, "queued", "webkit");
      }
      for (let i = 0; i < 50; i++) {
        await createOrder(baseURL, slug, "queued", "A test order");
      }

      await use({ slug, name });

      await deleteIfExists(baseURL, slug);
    },
    { scope: "worker" },
  ],
});

export { expect };
