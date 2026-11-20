"use server";

/**
 * The ONLY Server Actions in the app. Every export of a "use server" file is a
 * publicly callable HTTP endpoint, so this file must stay small and each action
 * must authorize the caller itself (Basic credentials are re-checked from the
 * Authorization header; the `privilege` cookie is client-settable and never
 * trusted). Keep all other Twilio helpers in plain server modules
 * (src/lib/twilio/*) that are not marked "use server".
 */

import { headers } from "next/headers";
import { getAuthenticatedRole, Privilege } from "@/proxy";
import {
  getOrderCancelledMessage as lookupOrderCancelledMessage,
  getOrderReadyMessage as lookupOrderReadyMessage,
  getOrderReadyReminderMessage as lookupOrderReadyReminderMessage,
} from "@/scripts/fetchContentTemplates";
import {
  createToken as mintSyncToken,
  getPinnedSender as lookupPinnedSender,
  sendMessage as sendTwilioMessage,
} from "@/lib/twilio";

async function getRole() {
  const headersList = await headers();
  return getAuthenticatedRole(headersList.get("Authorization") || "");
}

async function requireStaff() {
  const role = await getRole();
  if (role !== Privilege.ADMIN && role !== Privilege.MIXOLOGIST) {
    throw new Error("Not authorized");
  }
}

/**
 * Sync token for the caller's own role. Anonymous visitors get the `unknown`
 * role on purpose (the public menu page shows live queue data); what that role
 * may read is restricted via Sync permissions in lib/twilio/sync.ts.
 */
export async function createToken() {
  return mintSyncToken(await getRole());
}

/** Staff only: send a message to an attendee from the orders screen. */
export async function sendMessage(
  to: string,
  body: string = "",
  contentSid: string = "",
  contentVariables: string = "",
  from: string = "",
) {
  await requireStaff();
  return sendTwilioMessage(to, body, contentSid, contentVariables, from);
}

/** Staff only: which sender an attendee last messaged in on. */
export async function getPinnedSender(attendeesMap: string, phone: string) {
  await requireStaff();
  return lookupPinnedSender(attendeesMap, phone);
}

/**
 * Staff only: content template lookups used by the orders screen. They need
 * the Twilio API credentials, so they must run on the server; client
 * components may not import @/scripts/fetchContentTemplates directly.
 */
export async function getOrderReadyMessage(
  ...args: Parameters<typeof lookupOrderReadyMessage>
) {
  await requireStaff();
  return lookupOrderReadyMessage(...args);
}

export async function getOrderReadyReminderMessage(
  ...args: Parameters<typeof lookupOrderReadyReminderMessage>
) {
  await requireStaff();
  return lookupOrderReadyReminderMessage(...args);
}

export async function getOrderCancelledMessage(
  ...args: Parameters<typeof lookupOrderCancelledMessage>
) {
  await requireStaff();
  return lookupOrderCancelledMessage(...args);
}
