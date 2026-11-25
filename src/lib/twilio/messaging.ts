
import { throttledQueue } from "throttled-queue";
import { twilioClient, TWILIO_API_KEY, TWILIO_API_SECRET } from "./client";
import { createSyncMapItemIfNotExists } from "./sync";

const {
  TWILIO_MESSAGING_SERVICE_SID = "",
  SEGMENT_SPACE_ID = "",
  SEGMENT_PROFILE_KEY = "",
} = process.env;

const throttle = throttledQueue({ maxPerInterval: 25, interval: 1000 });

const axios = require("axios");

export async function getMessagingService() {
  if (!TWILIO_MESSAGING_SERVICE_SID) {
    throw new Error("Missing sid for for messaging service");
  }
  const messagingClient = twilioClient.messaging.v1.services(
    TWILIO_MESSAGING_SERVICE_SID,
  );
  return messagingClient.fetch();
}

export async function getPossibleSenders() {
  const messagingService = await getMessagingService();
  const senders = await messagingService.phoneNumbers().list();
  const channelSenders = await messagingService.channelSenders().list();
  return [
    senders.map((s) => s.phoneNumber),
    channelSenders.map((cs) => cs.sender),
  ].flat();
}

function createMessage(
  to: string,
  body: string,
  contentSid: string,
  contentVariables: string,
  from: string,
) {
  return throttle(() =>
    twilioClient.messages.create({
      to,
      // Pin the exact sender the recipient last messaged in on — otherwise
      // the Messaging Service can auto-select a different sender (e.g. RCS
      // vs WhatsApp) that may be outside that channel's 24h session window.
      ...(from
        ? { from }
        : TWILIO_MESSAGING_SERVICE_SID
          ? { messagingServiceSid: TWILIO_MESSAGING_SERVICE_SID }
          : { from: TWILIO_MESSAGING_SERVICE_SID }),
      ...(body ? { body } : {}),
      ...(contentSid ? { contentSid } : {}),
      ...(contentVariables ? { contentVariables } : {}),
    } as any),
  );
}

/**
 * Fire-and-forget send used by the webhook flows and scripts: returns at once
 * and only logs a failure.
 */
export async function sendMessage(
  to: string,
  body: string = "",
  contentSid: string = "",
  contentVariables: string = "",
  from: string = "",
) {
  if (to === "test-order") {
    return;
  }
  createMessage(to, body, contentSid, contentVariables, from).catch((err) =>
    console.error("Sending message failed", err),
  );
}

/**
 * Waits until Twilio has accepted the message and throws if it didn't.
 * Accepted is not delivered: later delivery failures only show up in
 * Twilio's status callbacks.
 */
export async function sendMessageAndWait(
  to: string,
  body: string = "",
  contentSid: string = "",
  contentVariables: string = "",
  from: string = "",
): Promise<void> {
  if (to === "test-order") {
    return;
  }
  // Return nothing: the Twilio message instance isn't serializable for
  // Server Actions.
  await createMessage(to, body, contentSid, contentVariables, from);
}

// Returns just the plain pinned-sender string — Client Components can't
// receive the raw Twilio SDK instance createSyncMapItemIfNotExists resolves
// to (Server Action return values must be plain-serializable).
export async function getPinnedSender(
  attendeesMap: string,
  phone: string,
): Promise<string> {
  const { data } = await createSyncMapItemIfNotExists(attendeesMap, phone);
  return (data as any)?.from || "";
}

export async function fetchSegmentTraits(
  email: string,
  specificTrait?: string,
) {
  let url = `https://profiles.segment.com/v1/spaces/${SEGMENT_SPACE_ID}/collections/users/profiles/email:${email.toLowerCase()}/traits`;
  if (specificTrait) {
    url += `?include=${specificTrait}`;
  }
  try {
    const response = await axios.get(url, {
      headers: {
        Authorization: `Basic ${btoa(SEGMENT_PROFILE_KEY + ":")}`,
      },
    });
    return response.data.traits;
  } catch (e: any) {
    if (e.response?.status === 404) {
      return null;
    } else {
      throw e;
    }
  }
}
