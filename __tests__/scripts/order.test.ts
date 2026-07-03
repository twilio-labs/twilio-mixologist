import { describe, test, expect, vi, beforeEach } from "vitest";
import { EventState } from "@/lib/utils";

// Mock next/headers before importing the route
vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue({
    get: () => "Basic " + btoa(process.env.KIOSK_LOGIN ?? ":"),
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

const OPEN_EVENT = {
  name: "Test Event",
  slug: "test-event",
  state: EventState.OPEN,
  enableLeadCollection: false,
  senders: [],
  selection: { items: [], modifiers: [], mode: "barista" },
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
