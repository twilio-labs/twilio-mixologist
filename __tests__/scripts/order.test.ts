import { describe, test, expect, beforeAll, afterAll } from "vitest";
import axios from "axios";

const {
  PUBLIC_BASE_URL = "http://localhost:3000",
  ADMIN_LOGIN = ":",
} = process.env;

const adminAuth = { Authorization: `Basic ${btoa(ADMIN_LOGIN)}` };
const TEST_SLUG = "test-closed-event";

async function createEvent(state: "OPEN" | "CLOSED") {
  return axios.post(
    `${PUBLIC_BASE_URL}/api/event`,
    {
      name: "Closed Event Test",
      slug: TEST_SLUG,
      state,
      senders: ["+1234567890"],
      selection: {
        items: [{ title: "Espresso", shortTitle: "Espresso", description: "" }],
        modifiers: [],
        mode: "barista",
      },
      pickupLocation: "Test",
      maxOrders: 100,
      welcomeMessage: "Welcome",
    },
    { headers: { "Content-Type": "application/json", ...adminAuth } },
  );
}

async function deleteEvent() {
  try {
    await axios.delete(`${PUBLIC_BASE_URL}/api/event/${TEST_SLUG}`, {
      headers: adminAuth,
    });
  } catch {}
}

async function submitOrder() {
  return axios.post(
    `${PUBLIC_BASE_URL}/api/order`,
    {
      event: TEST_SLUG,
      order: { key: "+1234567890", item: "Espresso", status: "queued" },
    },
    {
      headers: { "Content-Type": "application/json", ...adminAuth },
      validateStatus: () => true,
    },
  );
}

describe("POST /api/order", () => {
  beforeAll(deleteEvent);
  afterAll(deleteEvent);

  test("rejects orders for a closed event with 403", async () => {
    await createEvent("CLOSED");
    const res = await submitOrder();
    expect(res.status).toBe(403);
  });

  test("accepts orders for an open event", async () => {
    await deleteEvent();
    await createEvent("OPEN");
    const res = await submitOrder();
    expect(res.status).toBe(201);
  });
});
