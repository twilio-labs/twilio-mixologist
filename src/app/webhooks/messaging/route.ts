// Copyright (c) 2025 Twilio Inc.

"use server";

import {
  createSyncMapItemIfNotExists,
  updateOrCreateSyncMapItem,
  removeSyncMapItem,
  findSyncMapItems,
  sendMessage,
} from "@/lib/twilio";

import {
  Stages,
  getCountryFromPhone,
  EventState,
  sleep,
  TwoWeeksInSeconds,
} from "@/lib/utils";

import { getEvent } from "../mixologist-helper";
import {
  getEventRegistrationMessage,
  getReadyToOrderMessage,
} from "@/scripts/fetchContentTemplates";
import {
  eventLang,
  getDataPolicy,
  getModifiersMessage,
  getNoActiveEventsMessage,
  getPausedEventMessage,
  getWelcomeBackMessage,
  getWelcomeMessage,
} from "@/lib/stringTemplates";
import type { Event } from "@/types";
import { handleQrMode, createQrModeMemoryClient } from "./qr-mode";
import { handleProfileMode } from "./profile-mode";
import { deleteMemoryProfile } from "./memory";
import { runAiAgent } from "./ai-agent";
import type { ConversationWebhookPayload } from "twilio-agent-connect";

const NEXT_PUBLIC_EVENTS_MAP = process.env.NEXT_PUBLIC_EVENTS_MAP || "",
  NEXT_PUBLIC_ATTENDEES_MAP =
    process.env.NEXT_PUBLIC_ATTENDEES_MAP || "";

function emptyTwiml(): string {
  return `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`;
}

function twimlResponse(status = 200) {
  return new Response(emptyTwiml(), { status, headers: { "Content-Type": "text/xml" } });
}

async function getActiveEvents() {
  return findSyncMapItems(NEXT_PUBLIC_EVENTS_MAP, { state: EventState.OPEN });
}

/** Send the "ready to order" sequence: menu + data policy + optional modifiers note. */
async function sendReadyToOrderSequence(sender: string, event: Event) {
  const message = await getReadyToOrderMessage(
    event,
    event.selection.items,
    event.maxOrders,
    true,
    eventLang(event),
  );
  sendMessage(sender, "", message.contentSid, message.contentVariables);
  if (event.selection.modifiers.length > 1) {
    await sleep(500);
    sendMessage(sender, getModifiersMessage(event.selection.modifiers, eventLang(event)));
  }
}

/**
 * Handle the case where a customer has no assigned event (new) or their
 * stored event is no longer active (returning).
 *
 * Returns a Response if the request is fully handled (no further processing
 * needed), or null to continue into the main flow.
 */
async function selectEventForCustomer(
  phone: string,
  sender: string,
  incomingMessageBody: string,
  isReturning: boolean,
  LEAD_COLLECTION: string,
): Promise<Response | null> {
  const activeEvents = await getActiveEvents();

  if (activeEvents.length === 0) {
    sendMessage(sender, getNoActiveEventsMessage());
    return twimlResponse(200);
  }

  if (activeEvents.length === 1) {
    // @ts-ignore  data is typed as object but is actually an Event
    const newEvent = activeEvents[0].data as Event;
    const welcomeMsg = isReturning
      ? getWelcomeBackMessage(newEvent.selection.mode, newEvent.name, newEvent.welcomeMessage, eventLang(newEvent))
      : getWelcomeMessage(newEvent.selection.mode, newEvent.welcomeMessage, newEvent.enableLeadCollection, eventLang(newEvent), LEAD_COLLECTION);
    sendMessage(sender, welcomeMsg);

    const country = getCountryFromPhone(sender);
    await updateOrCreateSyncMapItem(
      NEXT_PUBLIC_ATTENDEES_MAP,
      phone,
      {
        event: newEvent.slug,
        orderCount: 0,
        stage: isReturning ? Stages.VERIFIED_USER : Stages.NEW_USER,
        ...(isReturning ? {} : { country: country?.name === "Canada" ? "United States" : country?.name }),
      },
      TwoWeeksInSeconds,
    );

    if (isReturning || !newEvent.enableLeadCollection) {
      await sleep(isReturning ? 500 : 2000);
      if (!isReturning) {
        sendMessage(sender, getDataPolicy(newEvent.selection.mode, eventLang(newEvent)));
      }
      await sendReadyToOrderSequence(sender, newEvent);
    }

    return twimlResponse(201);
  }

  // Two or more active events — let the customer pick
  const choice = incomingMessageBody.toLowerCase().trim();
  const matches = activeEvents.filter((e) => {
    // @ts-ignore  data is typed as object but is actually an Event
    return choice.includes((e.data as Event).name.toLowerCase().trim());
  });

  if (matches.length === 1) {
    // @ts-ignore  data is typed as object but is actually an Event
    const newEvent = matches[0].data as Event;
    const welcomeMsg = isReturning
      ? getWelcomeBackMessage(newEvent.selection.mode, newEvent.name, newEvent.welcomeMessage, eventLang(newEvent))
      : getWelcomeMessage(newEvent.selection.mode, newEvent.welcomeMessage, newEvent.enableLeadCollection, eventLang(newEvent));
    sendMessage(sender, welcomeMsg);

    const country = getCountryFromPhone(sender);
    await updateOrCreateSyncMapItem(
      NEXT_PUBLIC_ATTENDEES_MAP,
      phone,
      {
        event: newEvent.slug,
        orderCount: 0,
        stage: isReturning ? Stages.VERIFIED_USER : Stages.NEW_USER,
        ...(isReturning ? {} : { country: country?.name === "Canada" ? "United States" : country?.name }),
      },
      TwoWeeksInSeconds,
    );

    await sleep(500);
    if (!isReturning && newEvent.enableLeadCollection) {
      return twimlResponse(201);
    }
    await sendReadyToOrderSequence(sender, newEvent);
    return twimlResponse(201);
  }

  // No match — show the event picker
  const message = await getEventRegistrationMessage(activeEvents);
  sendMessage(sender, "", message.contentSid, message.contentVariables);
  return twimlResponse(200);
}

/**
 * Parse the incoming webhook — two formats:
 *
 * 1. Twilio Agent Connect (TAC) — JSON, Content-Type: application/json
 *    ConversationWebhookPayload: { eventType: "COMMUNICATION_CREATED", data: { author.address, content.text, content.url? } }
 *
 * 2. Raw Twilio Messaging Service — form data, Content-Type: application/x-www-form-urlencoded
 *    Fields: From, Body, NumMedia, MediaUrl0
 */
async function parseWebhook(request: Request): Promise<{
  sender: string;
  incomingMessageBody: string;
  mediaUrl: string | null;
} | null> {
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    // Conversation Orchestrator / TAC webhook format
    const payload = await request.json() as ConversationWebhookPayload;
    const eventType = payload.eventType;

    if (eventType && eventType !== "COMMUNICATION_CREATED") {
      return null; // signal: wrong event type, skip processing
    }

    const sender = (payload.data?.author?.address as string) ?? "";
    if (!sender) return null;

    const content = payload.data?.content as Record<string, unknown> | undefined;
    const incomingMessageBody = (content?.text as string) ?? "";
    const mediaUrl = (content?.url as string) ?? (content?.mediaUrl as string) ?? null;

    return { sender, incomingMessageBody, mediaUrl };
  } else {
    // Raw Twilio SMS / WhatsApp webhook (form-encoded)
    const data = await request.formData();
    const sender = data.get("From") as string;
    if (!sender) return null;

    const incomingMessageBody = (data.get("Body") as string) ?? "";
    const numMedia = Number(data.get("NumMedia") || "0");
    const mediaUrl = (data.get("MediaUrl0") as string | null) ?? (numMedia > 0 ? data.get("MediaUrl0") as string | null : null);

    return { sender, incomingMessageBody, mediaUrl };
  }
}

export async function POST(request: Request) {
  const parsed = await parseWebhook(request);

  if (parsed === null) {
    return new Response("Wrong event type", { status: 200 });
  }

  const { sender, incomingMessageBody, mediaUrl } = parsed;

  const { LEAD_COLLECTION = "MANUAL" } = process.env;

  if (!sender) {
    return new Response("Missing sender", { status: 400 });
  }

  // Use E.164 phone as the Sync key — strip channel prefixes
  const phone = sender.replace(/^(whatsapp:|rcs:|sms:)/, "");

  const { data: attendeeRecord } = await createSyncMapItemIfNotExists(
    NEXT_PUBLIC_ATTENDEES_MAP,
    phone,
  );

  // New customer — no event assigned yet
  if (!attendeeRecord.event) {
    const result = await selectEventForCustomer(phone, sender, incomingMessageBody, false, LEAD_COLLECTION);
    if (result) return result;
  }

  // @ts-ignore  data is typed as object but is actually an Event
  let event = (await getEvent(attendeeRecord.event)) as Event;

  // Returning customer whose stored event is no longer active
  if (!event) {
    const result = await selectEventForCustomer(phone, sender, incomingMessageBody, true, LEAD_COLLECTION);
    if (result) return result;
  }

  // "Forget me" — delete all stored data for this attendee
  if (incomingMessageBody.toLowerCase().includes("forget me")) {
    const profileId = LEAD_COLLECTION === "QR"
      ? (attendeeRecord as any).profileId as string | undefined
      : undefined;
    try {
      await removeSyncMapItem(NEXT_PUBLIC_ATTENDEES_MAP, phone);
    } catch (e) {
      console.error("Error removing sync map item during forget-me:", e);
    }
    if (profileId) {
      try {
        await deleteMemoryProfile(profileId);
      } catch (e) {
        console.error("Error deleting Memory profile during forget-me:", e);
      }
    }
    sendMessage(
      sender,
      "✅ Done! Your data has been deleted from our system.",
    );
    return new Response(emptyTwiml(), { status: 200, headers: { "Content-Type": "text/xml" } });
  }

  // Lead collection dispatch
  if (event.enableLeadCollection) {
    if (LEAD_COLLECTION === "QR") {
      const currentStage = (attendeeRecord as any).stage as Stages;
      const alreadyVerified =
        currentStage === Stages.VERIFIED_USER ||
        currentStage === Stages.FIRST_ORDER ||
        currentStage === Stages.REPEAT_CUSTOMER;

      if (!alreadyVerified) {
        const memoryClient = await createQrModeMemoryClient();
        if (memoryClient) {
          await handleQrMode(
            phone,
            attendeeRecord,
            memoryClient,
            event,
            incomingMessageBody,
            mediaUrl,
            sender,
          );
          return new Response(emptyTwiml(), { status: 200, headers: { "Content-Type": "text/xml" } });
        } else {
          sendMessage(
            sender,
            "Registration is temporarily unavailable. Please try again in a moment.",
          );
          return new Response(emptyTwiml(), { status: 200, headers: { "Content-Type": "text/xml" } });
        }
      }
    } else {
      const handled = await handleProfileMode(
        phone,
        sender,
        attendeeRecord,
        event,
        incomingMessageBody,
        LEAD_COLLECTION,
      );
      if (handled) {
        return new Response(emptyTwiml(), { status: 200, headers: { "Content-Type": "text/xml" } });
      }
    }
  }

  if (event.state === EventState.CLOSED) {
    const message = getPausedEventMessage(eventLang(event));
    sendMessage(sender, message);
    return new Response(emptyTwiml(), { status: 200, headers: { "Content-Type": "text/xml" } });
  }

  const reply = await runAiAgent(incomingMessageBody, event, phone, sender);
  if (reply) {
    sendMessage(sender, reply);
  }

  return new Response(emptyTwiml(), { status: 200, headers: { "Content-Type": "text/xml" } });
}

export async function GET() {
  return new Response(
    "This URL needs to be the webhook for the messaging service",
    { status: 200 },
  );
}

