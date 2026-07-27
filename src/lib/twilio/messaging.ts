"use server";

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
  "use server";
  const messagingService = await getMessagingService();
  const senders = await messagingService.phoneNumbers().list();
  const channelSenders = await messagingService.channelSenders().list();
  return [
    senders.map((s) => s.phoneNumber),
    channelSenders.map((cs) => cs.sender),
  ].flat();
}

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

  const defaultFrom = TWILIO_MESSAGING_SERVICE_SID;

  try {
    throttle(() => {
      twilioClient.messages.create({
        to,
        // Pin the exact sender the recipient last messaged in on — otherwise
        // the Messaging Service can auto-select a different sender (e.g. RCS
        // vs WhatsApp) that may be outside that channel's 24h session window.
        ...(from
          ? { from }
          : TWILIO_MESSAGING_SERVICE_SID
            ? { messagingServiceSid: TWILIO_MESSAGING_SERVICE_SID }
            : { from: defaultFrom }),
        ...(body ? { body } : {}),
        ...(contentSid ? { contentSid } : {}),
        ...(contentVariables ? { contentVariables } : {}),
      } as any);
    });
    return;
  } catch (err) {
    console.log(err);
    return;
  }
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
