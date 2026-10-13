"use server";

import { twilioClient } from "./client";
import { env } from "@/config/env";
import { eventLang } from "@/lib/stringTemplates";
import type { Event, Language } from "@/types";

const { TWILIO_VERIFY_SERVICE_SID = "" } = process.env;

const templateIds: Record<Language, string> = {
  en: env.sendgridTemplateEn,
  "pt-BR": env.sendgridTemplatePtBr,
  fr: env.sendgridTemplateFr,
};

export async function getVerifyService() {
  if (!TWILIO_VERIFY_SERVICE_SID) {
    throw new Error("Missing sid for for verify service");
  }
  return twilioClient.verify.v2.services(TWILIO_VERIFY_SERVICE_SID);
}

export async function createVerification(to: string, event: Event) {
  const verifyService = await getVerifyService();
  const templateId = templateIds[eventLang(event)];
  const promoCode = event.emailPromoCode?.trim();
  const verification = await verifyService.verifications.create({
    to,
    channel: "email",
    channelConfiguration: {
      ...(templateId && { template_id: templateId }),
      // Handlebars treats any non-empty string as truthy, so "off" values
      // must be omitted rather than sent as "false".
      substitutions: {
        "event-name": event.name,
        ...(promoCode && { promo_code: promoCode }),
        ...(event.emailShowCodeSnippet !== false && { show_snippet: "true" }),
      },
    },
  });
  return verification;
}

export async function checkVerification(verificationSid: string, code: string) {
  const verifyService = await getVerifyService();
  const verificationCheck = await verifyService.verificationChecks.create({
    verificationSid,
    code,
  });
  return verificationCheck;
}
