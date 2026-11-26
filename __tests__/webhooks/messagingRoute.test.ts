// @vitest-environment node
import { beforeEach, describe, expect, test, vi } from "vitest";

const twilio = vi.hoisted(() => ({
  checkSignature: vi.fn(),
  createSyncMapItemIfNotExists: vi.fn(),
  updateOrCreateSyncMapItem: vi.fn(),
  removeSyncMapItem: vi.fn(),
  findSyncMapItems: vi.fn(),
  sendMessage: vi.fn(),
}));
vi.mock("@/lib/twilio", () => twilio);
vi.mock("@/app/webhooks/mixologist-helper", () => ({ getEvent: vi.fn() }));
vi.mock("@/scripts/fetchContentTemplates", () => ({
  getEventRegistrationMessage: vi.fn(),
  getReadyToOrderMessage: vi.fn(),
}));
vi.mock("@/app/webhooks/messaging/qr-mode", () => ({
  handleQrMode: vi.fn(),
  createQrModeMemoryClient: vi.fn(),
}));
vi.mock("@/app/webhooks/messaging/profile-mode", () => ({
  handleProfileMode: vi.fn(),
}));
vi.mock("@/app/webhooks/messaging/memory", () => ({
  deleteMemoryProfile: vi.fn(),
}));

import { POST } from "@/app/webhooks/messaging/route";

function inbound(headers: Record<string, string> = {}) {
  return new Request("https://mixologist.example.com/webhooks/messaging", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      ...headers,
    },
    body: new URLSearchParams({
      From: "whatsapp:+15555550123",
      Body: "hi",
      NumMedia: "0",
    }),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /webhooks/messaging", () => {
  test("refuses a request without a valid Twilio signature before touching any data", async () => {
    twilio.checkSignature.mockResolvedValue(false);

    const res = await POST(inbound());

    expect(res.status).toBe(403);
    expect(twilio.checkSignature).toHaveBeenCalledWith(
      null,
      "https://mixologist.example.com/webhooks/messaging",
      expect.any(FormData),
    );
    expect(twilio.createSyncMapItemIfNotExists).not.toHaveBeenCalled();
    expect(twilio.sendMessage).not.toHaveBeenCalled();
  });

  test("passes the signature header and the form fields to the check", async () => {
    twilio.checkSignature.mockResolvedValue(false);

    await POST(inbound({ "X-Twilio-Signature": "abc=" }));

    const [signature, , data] = twilio.checkSignature.mock.calls[0];
    expect(signature).toBe("abc=");
    expect((data as FormData).get("From")).toBe("whatsapp:+15555550123");
  });

  test("goes on to handle a request whose signature is valid", async () => {
    twilio.checkSignature.mockResolvedValue(true);
    twilio.createSyncMapItemIfNotExists.mockRejectedValue(
      new Error("stop here"),
    );

    await expect(
      POST(inbound({ "X-Twilio-Signature": "valid=" })),
    ).rejects.toThrow("stop here");
    expect(twilio.createSyncMapItemIfNotExists).toHaveBeenCalledWith(
      expect.anything(),
      "+15555550123",
    );
  });
});
