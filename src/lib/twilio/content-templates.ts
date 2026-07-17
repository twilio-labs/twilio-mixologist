"use server";

import axios from "axios";
import {
  WhatsAppTemplate,
  WhatsAppTemplateConfig,
} from "@/scripts/buildContentTemplates";
import { TWILIO_API_KEY, TWILIO_API_SECRET } from "./client";

const contentApiAuth = () => ({
  headers: { "Content-Type": "application/json" },
  auth: { username: TWILIO_API_KEY, password: TWILIO_API_SECRET },
});

export async function getAllWhatsAppTemplates(): Promise<WhatsAppTemplate[]> {
  const { data } = await axios.get(
    "https://content.twilio.com/v1/Content?PageSize=200",
    contentApiAuth(),
  );
  return data.contents;
}

export async function deleteWhatsAppTemplate(
  sid: string,
): Promise<WhatsAppTemplate> {
  const { data } = await axios.delete(
    `https://content.twilio.com/v1/Content/${sid}`,
    contentApiAuth(),
  );
  return data;
}

// WhatsApp never approves a template whose richest content type is
// twilio/list-picker — list-picker/interactive-list messages are only
// usable within an already-open session, never as a pre-approved
// outbound template. Submitting these always fails, so skip it.
const RICHEST_TYPES_INELIGIBLE_FOR_APPROVAL = ["twilio/list-picker"];

export async function createWhatsAppTemplate(
  template: WhatsAppTemplateConfig,
): Promise<WhatsAppTemplate> {
  const { data } = await axios.post(
    "https://content.twilio.com/v1/Content",
    template,
    contentApiAuth(),
  );

  const ineligibleType = RICHEST_TYPES_INELIGIBLE_FOR_APPROVAL.find(
    (type) => type in template.types,
  );
  if (ineligibleType) {
    console.log(
      `Skipping WhatsApp approval request for "${data.friendly_name}" — ${ineligibleType} is not eligible for approval.`,
    );
    return data;
  }

  try {
    await axios.post(
      `https://content.twilio.com/v1/Content/${data.sid}/ApprovalRequests/whatsapp`,
      { name: data.friendly_name, category: "UTILITY" },
      contentApiAuth(),
    );
  } catch (e) {
    // @ts-ignore these parameters exist on the error object
    console.error(`Error creating WhatsApp Template Approval Request for ${data.friendly_name}`, e?.response?.statusText || e.message, e?.response?.data?.message || '');
  }

  return data;
}
