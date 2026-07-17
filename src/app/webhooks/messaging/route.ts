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
async function sendReadyToOrderSequence(sender: string, event: Event, from: string) {
  const message = await getReadyToOrderMessage(
    event,
    event.selection.items,
    event.maxOrders,
    true,
    eventLang(event),
  );
  sendMessage(sender, "", message.contentSid, message.contentVariables, from);
  if (event.selection.modifiers.length > 1) {
    await sleep(500);
    sendMessage(sender, getModifiersMessage(event.selection.modifiers, eventLang(event)), undefined, undefined, from);
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
  attendeeRecord?: any,
  from: string = "",
): Promise<Response | null> {
  const activeEvents = await getActiveEvents();

  if (activeEvents.length === 0) {
    sendMessage(sender, getNoActiveEventsMessage(), undefined, undefined, from);
    return twimlResponse(200);
  }

  if (activeEvents.length === 1) {
    // @ts-ignore  data is typed as object but is actually an Event
    const newEvent = activeEvents[0].data as Event;

    // For QR mode on first contact: assign the event silently so handleQrMode
    // runs immediately on this request and sends the correct greeting based on
    // whether the user is already known in Memory.
    if (!isReturning && newEvent.leadCollection === "WeAreDevs_QR") {
      const country = getCountryFromPhone(sender);
      await updateOrCreateSyncMapItem(
        NEXT_PUBLIC_ATTENDEES_MAP,
        phone,
        {
          event: newEvent.slug,
          orderCount: 0,
          stage: Stages.NEW_USER,
          country: country?.name === "Canada" ? "United States" : country?.name,
        },
        TwoWeeksInSeconds,
      );
      if (attendeeRecord) attendeeRecord.event = newEvent.slug;
      return null;
    }

    const welcomeMsg = isReturning
      ? getWelcomeBackMessage(newEvent.selection.mode, newEvent.name, newEvent.welcomeMessage, eventLang(newEvent))
      : getWelcomeMessage(newEvent.selection.mode, newEvent.welcomeMessage, newEvent.leadCollection, eventLang(newEvent));
    sendMessage(sender, welcomeMsg, undefined, undefined, from);

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

    if (isReturning || newEvent.leadCollection === "NONE") {
      await sleep(isReturning ? 500 : 2000);
      if (!isReturning) {
        sendMessage(sender, getDataPolicy(newEvent.selection.mode, eventLang(newEvent)), undefined, undefined, from);
      }
      await sendReadyToOrderSequence(sender, newEvent, from);
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
      : getWelcomeMessage(newEvent.selection.mode, newEvent.welcomeMessage, newEvent.leadCollection, eventLang(newEvent));
    sendMessage(sender, welcomeMsg, undefined, undefined, from);

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
    if (!isReturning && newEvent.leadCollection !== "NONE") {
      return twimlResponse(201);
    }
    await sendReadyToOrderSequence(sender, newEvent, from);
    return twimlResponse(201);
  }

  // No match — show the event picker
  const message = await getEventRegistrationMessage(activeEvents);
  sendMessage(sender, "", message.contentSid, message.contentVariables, from);
  return twimlResponse(200);
}

/**
 * Parse the incoming webhook — raw Twilio Messaging Service, form data,
 * Content-Type: application/x-www-form-urlencoded.
 * Fields: From, To, Body, NumMedia, MediaUrl0
 */
async function parseWebhook(request: Request): Promise<{
  sender: string;
  incomingMessageBody: string;
  mediaUrl: string | null;
  /** The exact Twilio-side sender address this message arrived on (pinned for replies). */
  from: string;
}> {
  const data = await request.formData();
  const sender = (data.get("From") as string) ?? "";
  const from = (data.get("To") as string) ?? "";
  const incomingMessageBody = (data.get("Body") as string) ?? "";
  const numMedia = Number(data.get("NumMedia") || "0");
  const mediaUrl = (data.get("MediaUrl0") as string | null) ?? (numMedia > 0 ? data.get("MediaUrl0") as string | null : null);

  return { sender, incomingMessageBody, mediaUrl, from };
}

export async function POST(request: Request) {
  const { sender, incomingMessageBody, mediaUrl, from: receivedOn } = await parseWebhook(request);

  if (!sender) {
    return new Response("Missing sender", { status: 400 });
  }

  // Use E.164 phone as the Sync key — strip channel prefixes
  const phone = sender.replace(/^(whatsapp:|rcs:|sms:)/, "");

  const { data: attendeeRecord } = await createSyncMapItemIfNotExists(
    NEXT_PUBLIC_ATTENDEES_MAP,
    phone,
  );

  // Pin the exact sender this message arrived on so replies (here and from
  // other flows like broadcasts) go out from the same sender, never a
  // different one auto-selected by the Messaging Service.
  const from = receivedOn || ((attendeeRecord as any).from as string | undefined) || "";
  if (receivedOn && receivedOn !== (attendeeRecord as any).from) {
    await updateOrCreateSyncMapItem(NEXT_PUBLIC_ATTENDEES_MAP, phone, { from: receivedOn }, TwoWeeksInSeconds);
    (attendeeRecord as any).from = receivedOn;
  }

  // New customer — no event assigned yet
  if (!attendeeRecord.event) {
    const result = await selectEventForCustomer(phone, sender, incomingMessageBody, false, attendeeRecord, from);
    if (result) return result;
  }

  // @ts-ignore  data is typed as object but is actually an Event
  let event = (await getEvent(attendeeRecord.event)) as Event;

  // Returning customer whose stored event is no longer active
  if (!event) {
    const result = await selectEventForCustomer(phone, sender, incomingMessageBody, true, undefined, from);
    if (result) return result;
  }

  // "Forget me" — delete all stored data for this attendee
  if (incomingMessageBody.toLowerCase().includes("forget me")) {
    const profileId = event?.leadCollection === "WeAreDevs_QR"
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
      undefined,
      undefined,
      from,
    );
    return new Response(emptyTwiml(), { status: 200, headers: { "Content-Type": "text/xml" } });
  }

  // Lead collection dispatch
  if (event.leadCollection === "WeAreDevs_QR") {
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
          from,
        );
        return new Response(emptyTwiml(), { status: 200, headers: { "Content-Type": "text/xml" } });
      } else {
        sendMessage(
          sender,
          "Registration is temporarily unavailable. Please try again in a moment.",
          undefined,
          undefined,
          from,
        );
        return new Response(emptyTwiml(), { status: 200, headers: { "Content-Type": "text/xml" } });
      }
    }
  } else if (event.leadCollection === "MANUAL") {
    const handled = await handleProfileMode(
      phone,
      sender,
      attendeeRecord,
      event,
      incomingMessageBody,
      event.leadCollection,
      from,
    );
    if (handled) {
      return new Response(emptyTwiml(), { status: 200, headers: { "Content-Type": "text/xml" } });
    }
  }

  if (event.state === EventState.CLOSED) {
    const message = getPausedEventMessage(eventLang(event));
    sendMessage(sender, message, undefined, undefined, from);
    return new Response(emptyTwiml(), { status: 200, headers: { "Content-Type": "text/xml" } });
  }

  const reply = await runAiAgent(incomingMessageBody, event, phone, sender, from);
  if (reply) {
    sendMessage(sender, reply, undefined, undefined, from);
  }

  return new Response(emptyTwiml(), { status: 200, headers: { "Content-Type": "text/xml" } });
}

export async function GET() {
  return new Response(
    "This URL needs to be the webhook for the messaging service",
    { status: 200 },
  );
}

