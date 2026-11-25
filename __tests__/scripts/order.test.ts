import { describe, test, expect, vi, beforeEach } from "vitest";
import { EventState } from "@/lib/utils";
import { modes } from "@/types";
import type { Event } from "@/types";

// proxy.ts reads the *_LOGIN variables when it loads, so set a known kiosk
// login before the route (and with it proxy.ts) is imported. The test must not
// depend on CI providing KIOSK_LOGIN: an unset login can't be logged into.
const { KIOSK_LOGIN } = vi.hoisted(() => {
  const KIOSK_LOGIN = "kiosk-test:kiosk-test-password";
  vi.stubEnv("KIOSK_LOGIN", KIOSK_LOGIN);
  return { KIOSK_LOGIN };
});

// Mock next/headers before importing the route
vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue({
    get: () => "Basic " + btoa(KIOSK_LOGIN),
  }),
}));

vi.mock("@/app/webhooks/mixologist-helper", () => ({
  getEvent: vi.fn(),
}));

vi.mock("@/lib/twilio", () => ({
  pushToSyncList: vi.fn().mockResolvedValue({ index: 42 }),
}));

import { POST } from "@/app/api/order/route";
import { getEvent } from "@/app/webhooks/mixologist-helper";

const OPEN_EVENT: Event = {
  name: "Test Event",
  slug: "test-event",
  state: EventState.OPEN,
  leadCollection: "NONE",
  senders: [],
  selection: { items: [], modifiers: [], mode: modes.barista },
  pickupLocation: "",
  maxOrders: 100,
  welcomeMessage: "",
};

function makeRequest() {
  return new Request("http://localhost/api/order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      event: "test-event",
      order: { key: "+1234567890", item: "Espresso", status: "queued" },
    }),
  });
}

describe("POST /api/order", () => {
  beforeEach(() => vi.clearAllMocks());

  test("returns 403 when event is closed", async () => {
    vi.mocked(getEvent).mockResolvedValue({ ...OPEN_EVENT, state: EventState.CLOSED });
    const res = await POST(makeRequest());
    expect(res.status).toBe(403);
  });

  test("returns 404 when event does not exist", async () => {
    vi.mocked(getEvent).mockResolvedValue(null);
    const res = await POST(makeRequest());
    expect(res.status).toBe(404);
  });

  test("returns 201 when event is open", async () => {
    vi.mocked(getEvent).mockResolvedValue({ ...OPEN_EVENT, state: EventState.OPEN });
    const res = await POST(makeRequest());
    expect(res.status).toBe(201);
  });
});
