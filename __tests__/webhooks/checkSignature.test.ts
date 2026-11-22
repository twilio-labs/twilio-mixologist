// @vitest-environment node
import { afterEach, describe, expect, test, vi } from "vitest";
import { getExpectedTwilioSignature } from "twilio/lib/webhooks/webhooks";

const config = vi.hoisted(() => ({
  TWILIO_AUTH_TOKEN: "test-auth-token",
  PUBLIC_BASE_URL: "https://mixologist.example.com",
}));
vi.mock("@/lib/twilio/client", () => config);

import { checkSignature } from "@/lib/twilio/utils";

const publicUrl = "https://mixologist.example.com/webhooks/messaging";
const params = {
  From: "whatsapp:+15555550123",
  To: "whatsapp:+15555550100",
  Body: "hi",
};

function form(values: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.append(key, value);
  return data;
}

const sign = (url: string, values = params, token = config.TWILIO_AUTH_TOKEN) =>
  getExpectedTwilioSignature(token, url, values);

afterEach(() => {
  config.TWILIO_AUTH_TOKEN = "test-auth-token";
  config.PUBLIC_BASE_URL = "https://mixologist.example.com";
  vi.restoreAllMocks();
});

describe("checkSignature", () => {
  test("accepts a request Twilio signed for the public URL", async () => {
    expect(await checkSignature(sign(publicUrl), publicUrl, form(params))).toBe(
      true,
    );
  });

  test("accepts it when the server sees an internal URL behind a proxy", async () => {
    const internal = "http://10.0.0.4:3000/webhooks/messaging";
    expect(await checkSignature(sign(publicUrl), internal, form(params))).toBe(
      true,
    );
  });

  test("checks the URL as received when PUBLIC_BASE_URL is not set", async () => {
    config.PUBLIC_BASE_URL = "";
    const url = "https://abc.ngrok.app/webhooks/messaging";
    expect(await checkSignature(sign(url), url, form(params))).toBe(true);
  });

  test("rejects a missing signature", async () => {
    expect(await checkSignature(null, publicUrl, form(params))).toBe(false);
    expect(await checkSignature("", publicUrl, form(params))).toBe(false);
  });

  test("rejects a signature made with another token", async () => {
    const forged = sign(publicUrl, params, "someone-elses-token");
    expect(await checkSignature(forged, publicUrl, form(params))).toBe(false);
  });

  test("rejects a signed request whose fields were changed", async () => {
    const tampered = form({ ...params, Body: "something else" });
    expect(await checkSignature(sign(publicUrl), publicUrl, tampered)).toBe(
      false,
    );
  });

  test("fails closed when TWILIO_AUTH_TOKEN is not set", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    config.TWILIO_AUTH_TOKEN = "";
    expect(
      await checkSignature(
        sign(publicUrl, params, ""),
        publicUrl,
        form(params),
      ),
    ).toBe(false);
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining("TWILIO_AUTH_TOKEN"),
    );
  });
});
