// Copyright (c) 2025 Twilio Inc.

"use server";

import {
  addMessageToConversation,
  createSyncMapItemIfNotExists,
  updateOrCreateSyncMapItem,
  updateSyncMapItem,
  findSyncMapItems,
  createVerification,
  checkVerification,
  fetchSegmentTraits,
  askAiAssistant,
  checkSignature,
} from "@/lib/twilio";

import {
  Stages,
  getCountryFromPhone,
  EventState,
  sleep,
  TwoWeeksInSeconds,
  regexForEmail,
  regexFor6ConsecutiveDigits,
  redact,
} from "@/lib/utils";

import { fetchOrder, getEvent } from "../mixologist-helper";
import {
  getEventRegistrationMessage,
  getReadyToOrderMessage,
} from "@/scripts/fetchContentTemplates";
import {
  getDataPolicy,
  getErrorDuringEmailVerificationMessage,
  getInvalidEmailMessage,
  getInvalidVerificationCodeMessage,
  getModifiersMessage,
  getNoActiveEventsMessage,
  getNoMediaHandlerMessage,
  getPausedEventMessage,
  getPromptForEmail,
  getSentEmailMessage,
  getWelcomeBackMessage,
  getWelcomeMessage,
} from "@/lib/stringTemplates";
import { headers } from "next/headers";
import { Event } from "@/app/(master-layout)/event/[slug]/page";

const {
  SEGMENT_SPACE_ID = "",
  SEGMENT_PROFILE_KEY = "",
  SEGMENT_TRAIT_CHECK = "",
} = process.env;
const NEXT_PUBLIC_EVENTS_MAP = process.env.NEXT_PUBLIC_EVENTS_MAP || "",
  NEXT_PUBLIC_ACTIVE_CUSTOMERS_MAP =
    process.env.NEXT_PUBLIC_ACTIVE_CUSTOMERS_MAP || "";

export async function POST(request: Request) {
  const [data, headerList] = await Promise.all([request.formData(), headers()]);
  const signature = headerList.get("X-Twilio-Signature") || "";
  const isSignedCorrectly = await checkSignature(signature, request.url, data);

  if (!isSignedCorrectly) {
    return new Response("Unauthorized", { status: 401 });
  }

  const conversationSid = data.get("ConversationSid") as string;
  const incomingMessageBody = data.get("Body") as string;
  const webHookType = data.get("EventType");

  if (webHookType !== "onMessageAdded") {
    return new Response("Wrong event type", { status: 200 });
  }
  if (!incomingMessageBody && data.get("Media")) {
    const noMediaMessage = getNoMediaHandlerMessage();
    addMessageToConversation(conversationSid, noMediaMessage);
    return new Response("Send no media note", { status: 200 });
  }

  const author = data.get("Author") as string,
    address = await redact(author);

  const { data: conversationRecord } = await createSyncMapItemIfNotExists(
    NEXT_PUBLIC_ACTIVE_CUSTOMERS_MAP,
    conversationSid,
  );

  if (!conversationRecord.event) {
    const activeEvents = await getActiveEvents();
    if (activeEvents.length == 0) {
      addMessageToConversation(conversationSid, getNoActiveEventsMessage());
      return new Response("No active event available", { status: 200 });
    } else if (activeEvents.length == 1) {
      // @ts-ignore  thinks is a object but actually it's an Event
      let newEvent = activeEvents[0].data as Event;
      const welcomeMessage = getWelcomeMessage(
        newEvent.selection.mode,
        newEvent.welcomeMessage,
        newEvent.enableLeadCollection,
      );
      addMessageToConversation(conversationSid, welcomeMessage);

      const country = getCountryFromPhone(author);

      await updateOrCreateSyncMapItem(
        NEXT_PUBLIC_ACTIVE_CUSTOMERS_MAP,
        conversationSid,
        {
          event: newEvent.slug,
          orderCount: 0,
          stage: Stages.NEW_USER,
          country: country?.name === "Canada" ? "United States" : country?.name,
        },
        TwoWeeksInSeconds,
      );

      if (!newEvent.enableLeadCollection) {
        await sleep(2000);
        const dataPolicy = getDataPolicy(newEvent.selection.mode);
        addMessageToConversation(conversationSid, dataPolicy);
        const message = await getReadyToOrderMessage(
          newEvent,
          newEvent.selection.items,
          newEvent.maxOrders,
          true,
        );
        addMessageToConversation(
          conversationSid,
          "",
          message.contentSid,
          message.contentVariables,
        );

        if (newEvent.selection.modifiers.length > 1) {
          await sleep(1500);
          const modifiersNote = getModifiersMessage(
            newEvent.selection.modifiers,
          );
          addMessageToConversation(conversationSid, modifiersNote);
        }
      }

      return new Response("Assigned event to attendee", { status: 201 });
    } else if (activeEvents.length >= 2) {
      let choice = incomingMessageBody.toLowerCase().trim();
      let matches = activeEvents.filter((event) => {
        // @ts-ignore  thinks is a object but actually it's a string
        return choice.includes(event.data.name.toLowerCase().trim());
      });
      if (matches.length === 1) {
        // @ts-ignore  thinks is a object but actually it's an Event
        const newEvent = matches[0].data as Event;
        const welcomeMessage = getWelcomeMessage(
          newEvent.selection.mode,
          newEvent.welcomeMessage,
          newEvent.enableLeadCollection,
        );
        addMessageToConversation(conversationSid, welcomeMessage);

        const country = getCountryFromPhone(author);

        await updateOrCreateSyncMapItem(
          NEXT_PUBLIC_ACTIVE_CUSTOMERS_MAP,
          conversationSid,
          {
            event: newEvent.slug,
            orderCount: 0,
            stage: Stages.NEW_USER,
            country:
              country?.name === "Canada" ? "United States" : country?.name,
          },
          TwoWeeksInSeconds,
        );
        if (!newEvent.enableLeadCollection) {
          await sleep(2000);
          const dataPolicy = getDataPolicy(newEvent.selection.mode);
          addMessageToConversation(conversationSid, dataPolicy);
          const message = await getReadyToOrderMessage(
            newEvent,
            newEvent.selection.items,
            newEvent.maxOrders,
            true,
          );
          addMessageToConversation(
            conversationSid,
            "",
            message.contentSid,
            message.contentVariables,
          );

          if (newEvent.selection.modifiers.length > 1) {
            await sleep(1500);
            const modifiersNote = getModifiersMessage(
              newEvent.selection.modifiers,
            );
            addMessageToConversation(conversationSid, modifiersNote);
          }
        }
        return new Response("Assigned event to attendee", { status: 201 });
      }

      const message = await getEventRegistrationMessage(activeEvents);
      addMessageToConversation(
        conversationSid,
        "",
        message.contentSid,
        message.contentVariables,
      );
      return new Response("Requesting Event", { status: 200 });
    }
  }

  // Check if Event is Active

  // @ts-ignore  thinks is a object but actually it's an Event
  let event = (await getEvent(conversationRecord.event)) as Event;
  let lastOrder;

  if (!event) {
    const activeEvents = await getActiveEvents();
    if (activeEvents.length == 0) {
      addMessageToConversation(conversationSid, getNoActiveEventsMessage());
      return new Response("No active event available", { status: 200 });
    } else if (activeEvents.length == 1) {
      // @ts-ignore  thinks is a object but actually it's an Event
      let newEvent = activeEvents[0].data as Event;
      const welcomeBackMessage = getWelcomeBackMessage(
        newEvent.selection.mode,
        newEvent.name,
        newEvent.welcomeMessage,
      );
      addMessageToConversation(conversationSid, welcomeBackMessage);
      const message = await getReadyToOrderMessage(
        newEvent,
        newEvent.selection.items,
        newEvent.maxOrders,
        true,
      );

      if (newEvent.selection.modifiers.length > 1) {
        await sleep(500);
        const modifiersNote = getModifiersMessage(newEvent.selection.modifiers);
        addMessageToConversation(conversationSid, modifiersNote);
      }

      await updateOrCreateSyncMapItem(
        NEXT_PUBLIC_ACTIVE_CUSTOMERS_MAP,
        conversationSid,
        {
          event: newEvent.slug,
          orderCount: 0,
          stage: Stages.VERIFIED_USER,
        },
        TwoWeeksInSeconds,
      );
      await sleep(500);
      addMessageToConversation(
        conversationSid,
        "",
        message.contentSid,
        message.contentVariables,
      );
      return new Response("Assigned event to attendee", { status: 201 });
    } else if (activeEvents.length >= 2) {
      let choice = incomingMessageBody.toLowerCase().trim();
      let matches = activeEvents.filter((event) => {
        // @ts-ignore  thinks is a object but actually it's a string
        return choice.includes(event.data.name.toLowerCase().trim());
      });
      if (matches.length === 1) {
        // @ts-ignore  thinks is a object but actually it's an Event
        const newEvent = matches[0].data as Event;
        const welcomeMessage = getWelcomeBackMessage(
          newEvent.selection.mode,
          newEvent.name,
          newEvent.welcomeMessage,
        );
        addMessageToConversation(conversationSid, welcomeMessage);

        await updateOrCreateSyncMapItem(
          NEXT_PUBLIC_ACTIVE_CUSTOMERS_MAP,
          conversationSid,
          {
            event: newEvent.slug,
            orderCount: 0,
            stage: Stages.VERIFIED_USER,
          },
          TwoWeeksInSeconds,
        );

        await sleep(500);
        const message = await getReadyToOrderMessage(
          newEvent,
          newEvent.selection.items,
          newEvent.maxOrders,
          true,
        );
        addMessageToConversation(
          conversationSid,
          "",
          message.contentSid,
          message.contentVariables,
        );

        if (newEvent.selection.modifiers.length > 1) {
          await sleep(500);
          const modifiersNote = getModifiersMessage(
            newEvent.selection.modifiers,
          );
          addMessageToConversation(conversationSid, modifiersNote);
        }

        return new Response("Assigned event to attendee", { status: 201 });
      }

      const message = await getEventRegistrationMessage(activeEvents);
      addMessageToConversation(
        conversationSid,
        "",
        message.contentSid,
        message.contentVariables,
      );
      return new Response("Requesting Event", { status: 200 });
    }
  }
  if (
    event.enableLeadCollection &&
    // @ts-ignore  thinks is a object but actually it's a stage
    conversationRecord.stage === Stages.NEW_USER
  ) {
    const message = getPromptForEmail();
    addMessageToConversation(conversationSid, message);
    await updateSyncMapItem(
      NEXT_PUBLIC_ACTIVE_CUSTOMERS_MAP,
      conversationSid,
      {
        fullName: sanitizeFullName(incomingMessageBody),
        stage: Stages.NAME_CONFIRMED,
      },
      TwoWeeksInSeconds,
    );
    return new Response("Prompt for Email", { status: 200 });
  } else if (
    event.enableLeadCollection &&
    // @ts-ignore  thinks is a object but actually it's a stage
    conversationRecord.stage === Stages.NAME_CONFIRMED
  ) {
    if (!incomingMessageBody || !regexForEmail.test(incomingMessageBody)) {
      const message = getInvalidEmailMessage();
      addMessageToConversation(conversationSid, message);
      return new Response("Invalid Email", { status: 200 });
    } else {
      let check;
      // @ts-ignore cannot be null bc of if statement above
      const email = incomingMessageBody.match(regexForEmail)[0];
      try {
        check = await createVerification(email, event.name);
      } catch (error: any) {
        console.error(error);
        const message = getErrorDuringEmailVerificationMessage(error.message);
        addMessageToConversation(conversationSid, message);
        return new Response("Error During Verifiction", { status: 500 });
      }
      const message = getSentEmailMessage();
      addMessageToConversation(conversationSid, message);
      await updateSyncMapItem(
        NEXT_PUBLIC_ACTIVE_CUSTOMERS_MAP,
        conversationSid,
        {
          stage: Stages.VERIFYING,
          email,
          checkSid: check.sid,
        },
        TwoWeeksInSeconds,
      );
      return new Response("Verification Triggered", { status: 200 });
    }
  } else if (
    event.enableLeadCollection &&
    // @ts-ignore  thinks is a object but actually it's a stage
    conversationRecord.stage === Stages.VERIFYING
  ) {
    if (
      regexForEmail.test(incomingMessageBody) &&
      incomingMessageBody !== null
    ) {
      let check;
      // @ts-ignore cannot be null bc of if statement above
      const email = incomingMessageBody.match(regexForEmail)[0];
      try {
        check = await createVerification(email, event.name);
      } catch (error) {
        console.error(error);
        return new Response("Error During Verifiction", { status: 500 });
      }
      const message = getSentEmailMessage();
      addMessageToConversation(conversationSid, message);
      await updateSyncMapItem(
        NEXT_PUBLIC_ACTIVE_CUSTOMERS_MAP,
        conversationSid,
        {
          checkSid: check.sid,
          email,
        },
        TwoWeeksInSeconds,
      );
      return new Response("Verification Re-triggered", { status: 200 });
    } else if (
      !regexFor6ConsecutiveDigits.test(incomingMessageBody) ||
      incomingMessageBody === null
    ) {
      const message = getInvalidVerificationCodeMessage();
      addMessageToConversation(conversationSid, message);
      return new Response("No Verification Code Sent", { status: 200 });
    }
    try {
      // @ts-ignore cannot be null bc of if statement above
      const code = incomingMessageBody.match(regexFor6ConsecutiveDigits)[0];
      const verification = await checkVerification(
        // @ts-ignore  thinks is a object but actually it's a string
        conversationRecord.checkSid,
        code,
      );
      if (!verification.valid) {
        const message = getInvalidVerificationCodeMessage();
        addMessageToConversation(conversationSid, message);
        return new Response("Invalid Verification", { status: 200 });
      }
      let foundInSegment = false,
        checkedTrait;
      if (
        SEGMENT_SPACE_ID &&
        SEGMENT_PROFILE_KEY &&
        SEGMENT_TRAIT_CHECK &&
        verification.to // skip in the tests
      ) {
        const traits = await fetchSegmentTraits(
          verification.to,
          SEGMENT_TRAIT_CHECK,
        );
        if (traits) {
          foundInSegment = true;
          checkedTrait = traits[SEGMENT_TRAIT_CHECK];
        }
      }
      await updateSyncMapItem(
        NEXT_PUBLIC_ACTIVE_CUSTOMERS_MAP,
        conversationSid,
        {
          stage: Stages.VERIFIED_USER,
          [SEGMENT_TRAIT_CHECK]: checkedTrait,
          foundInSegment,
        },
        TwoWeeksInSeconds,
      );
      const message = await getReadyToOrderMessage(
        event,
        event.selection.items,
        event.maxOrders,
        false,
      );
      addMessageToConversation(
        conversationSid,
        "",
        message.contentSid,
        message.contentVariables,
      );

      if (event.selection.modifiers.length > 1) {
        await sleep(1500);
        const modifiersNote = getModifiersMessage(event.selection.modifiers);
        addMessageToConversation(conversationSid, modifiersNote);
      }

      await sleep(2000);
      const dataPolicy = getDataPolicy(event.selection.mode);
      addMessageToConversation(conversationSid, dataPolicy);

      return new Response("Email was verified", { status: 200 });
    } catch (error) {
      console.error(error);
      const message = getInvalidVerificationCodeMessage();
      addMessageToConversation(conversationSid, message);
      return new Response("Error During Verifiction", { status: 500 });
    }
  }

  const incomingMessage = incomingMessageBody.toLowerCase();

  // @ts-ignore  thinks is a object but actually it's a number
  if (conversationRecord?.lastOrderNumber >= 0) {
    lastOrder = await fetchOrder(
      event.slug,
      // @ts-ignore  thinks is a object but actually it's a number
      conversationRecord?.lastOrderNumber,
    );
  }

  if (event.state === EventState.CLOSED) {
    const message = getPausedEventMessage();
    addMessageToConversation(conversationSid, message);
    return new Response("Event Orders Paused", { status: 200 });
  }

  if (event.assistantId) {
    await askAiAssistant(
      event.assistantId,
      incomingMessage,
      author,
      event.slug,
      conversationSid,
    );
  }

  return new Response("Received", { status: 200 });
}

export async function GET() {
  return new Response(
    "This URL needs to be the webhook for the messaging service",
    { status: 200 },
  );
}

async function getActiveEvents() {
  const activeEvents = await findSyncMapItems(NEXT_PUBLIC_EVENTS_MAP, {
    state: EventState.OPEN,
  });
  return activeEvents;
}


function sanitizeFullName(fullName: string) {
  return fullName
    .replace(/[^a-zA-Z\s-]/g, "") // remove non-alphabetic characters, except dashes
    .replace(/\s/g, " ") // replace all whitespace characters with a single space
    .replace(/\s+/g, " ") // replace multiple spaces with a single space
    .trim(); // trim leading and trailing spaces
}
