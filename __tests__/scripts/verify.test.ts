import { describe, test, expect, vi, beforeEach } from "vitest";
import { EventState } from "@/lib/utils";
import { modes } from "@/types";
import type { Event } from "@/types";

const create = vi.fn().mockResolvedValue({ sid: "VE123" });

vi.mock("@/lib/twilio/client", () => ({
  twilioClient: {
    verify: { v2: { services: () => ({ verifications: { create } }) } },
  },
}));

vi.mock("@/config/env", () => ({
  env: {
    sendgridTemplateEn: "d-en",
    sendgridTemplatePtBr: "d-ptbr",
    sendgridTemplateFr: "",
  },
}));

process.env.TWILIO_VERIFY_SERVICE_SID = "VA123";

import { createVerification } from "@/lib/twilio/verify";

const EVENT: Event = {
  name: "Test Event",
  slug: "test-event",
  state: EventState.OPEN,
  leadCollection: "MANUAL",
  senders: [],
  selection: { items: [], modifiers: [], mode: modes.barista },
  pickupLocation: "",
  maxOrders: 100,
  welcomeMessage: "",
};

async function channelConfiguration(overrides: Partial<Event> = {}) {
  create.mockClear();
  await createVerification("a@b.com", { ...EVENT, ...overrides });
  expect(create).toHaveBeenCalledOnce();
  expect(create.mock.calls[0][0]).toMatchObject({ to: "a@b.com", channel: "email" });
  return create.mock.calls[0][0].channelConfiguration;
}

describe("createVerification", () => {
  beforeEach(() => create.mockClear());

  describe("template selection", () => {
    test("defaults to the English template", async () => {
      expect((await channelConfiguration()).template_id).toBe("d-en");
    });

    test("uses the template matching the event language", async () => {
      expect((await channelConfiguration({ language: "pt-BR" })).template_id).toBe("d-ptbr");
    });

    test("omits template_id when none is configured for the language", async () => {
      expect(await channelConfiguration({ language: "fr" })).not.toHaveProperty("template_id");
    });
  });

  describe("substitutions", () => {
    test("always includes the event name", async () => {
      expect((await channelConfiguration()).substitutions["event-name"]).toBe("Test Event");
    });

    test("omits promo values when no promo code is set", async () => {
      const { substitutions } = await channelConfiguration({ emailPromoAmount: "$50" });
      expect(substitutions).not.toHaveProperty("promo_code");
      expect(substitutions).not.toHaveProperty("promo_amount");
    });

    test("omits promo values when the promo code is only whitespace", async () => {
      const { substitutions } = await channelConfiguration({ emailPromoCode: "   " });
      expect(substitutions).not.toHaveProperty("promo_code");
    });

    test("trims the promo code and defaults the amount to $25", async () => {
      const { substitutions } = await channelConfiguration({ emailPromoCode: "  wearedevs-25 " });
      expect(substitutions.promo_code).toBe("wearedevs-25");
      expect(substitutions.promo_amount).toBe("$25");
    });

    test("uses a custom promo amount, trimmed", async () => {
      const { substitutions } = await channelConfiguration({
        emailPromoCode: "code",
        emailPromoAmount: " €20 ",
      });
      expect(substitutions.promo_amount).toBe("€20");
    });

    test("falls back to $25 when the promo amount is blank", async () => {
      const { substitutions } = await channelConfiguration({
        emailPromoCode: "code",
        emailPromoAmount: "  ",
      });
      expect(substitutions.promo_amount).toBe("$25");
    });

    test("shows the snippet by default and when enabled", async () => {
      expect((await channelConfiguration()).substitutions.show_snippet).toBe("true");
      expect(
        (await channelConfiguration({ emailShowCodeSnippet: true })).substitutions.show_snippet,
      ).toBe("true");
    });

    test("omits show_snippet entirely when disabled (never sends \"false\")", async () => {
      const { substitutions } = await channelConfiguration({ emailShowCodeSnippet: false });
      expect(substitutions).not.toHaveProperty("show_snippet");
    });
  });
});
