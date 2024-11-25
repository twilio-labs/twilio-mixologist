// Copyright (c) 2024 Twilio Inc.

"use server";

import {
  addMessageToConversation,
  createSyncMapItemIfNotExists,
  updateOrCreateSyncMapItem,
  updateSyncMapItem,
  findSyncMapItems,
  createVerification,
  checkVerification,
  pushToSyncList,
  updateSyncListItem,
  fetchSyncListItem,
  fetchSyncListItems,
  removeSyncMapItem,
  deleteConversation,
  fetchSegmentTraits,
} from "@/lib/twilio";

import {
  Stages,
  getCountryFromPhone,
  getOrderItemFromMessage,
  EventState,
  sleep,
  TwoWeeksInSeconds,
  regexForEmail,
  regexFor6ConsecutiveDigits,
  redact,
} from "@/lib/utils";

import { Order } from "@/config/menus";
import { cancelOrder, updateOrder } from "./coffee-helper";
import {
  getEventRegistrationMessage,
  getHelpMessage,
  getOrderCreatedMessage,
  getReadyToOrderMessage,
  getWrongOrderMessage,
} from "@/scripts/fetchContentTemplates";
import {
  getChangedOrderMessage,
  getDataPolicy,
  getErrorDuringEmailVerificationMessage,
  getExistingOrderMessage,
  getForgotAttendeeMessage,
  getInvalidEmailMessage,
  getInvalidVerificationCodeMessage,
  getMaxOrdersMessage,
  getModifiersMessage,
  getNoActiveEventsMessage,
  getNoMediaHandlerMessage,
  getNoOpenOrderMessage,
  getOopsMessage,
  getPausedEventMessage,
  getPromptForEmail,
  getQueuePositionMessage,
  getSentEmailMessage,
  getWelcomeBackMessage,
  getWelcomeMessage,
} from "@/lib/stringTemplates";

const {
  SEGMENT_SPACE_ID = "",
  SEGMENT_PROFILE_KEY = "",
  SEGMENT_TRAIT_CHECK = "",
} = process.env;
const NEXT_PUBLIC_EVENTS_MAP = process.env.NEXT_PUBLIC_EVENTS_MAP || "",
  NEXT_PUBLIC_ACTIVE_CUSTOMERS_MAP =
    process.env.NEXT_PUBLIC_ACTIVE_CUSTOMERS_MAP || "",
  UNLIMTED_ORDERS = (process.env.UNLIMITED_ORDERS || "").split(",");

export async function POST(request: Request) {
  const data = await request.formData();
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
      let newEvent = activeEvents[0].data;
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
        return choice.includes(event.data.name.toLowerCase().trim());
      });
      if (matches.length === 1) {
        const newEvent = matches[0].data;
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

  //Check if Event is Active
  let event = await getEvent(conversationRecord.event);
  let lastOrder;

  if (!event) {
    const activeEvents = await getActiveEvents();
    if (activeEvents.length == 0) {
      addMessageToConversation(conversationSid, getNoActiveEventsMessage());
      return new Response("No active event available", { status: 200 });
    } else if (activeEvents.length == 1) {
      let newEvent = activeEvents[0].data;
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
        return choice.includes(event.data.name.toLowerCase().trim());
      });
      if (matches.length === 1) {
        const newEvent = matches[0].data;
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
    conversationRecord.stage === Stages.NEW_USER
  ) {
    const message = getPromptForEmail();
    addMessageToConversation(conversationSid, message);
    await updateSyncMapItem(
      NEXT_PUBLIC_ACTIVE_CUSTOMERS_MAP,
      conversationSid,
      {
        fullName: incomingMessageBody.trim(),
        stage: Stages.NAME_CONFIRMED,
      },
      TwoWeeksInSeconds,
    );
    return new Response("Prompt for Email", { status: 200 });
  } else if (
    event.enableLeadCollection &&
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
        check = await createVerification(email);
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
        check = await createVerification(email);
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
  if (conversationRecord?.lastOrderNumber >= 0) {
    lastOrder = await fetchOrder(
      event.slug,
      conversationRecord?.lastOrderNumber,
    );
  }

  if (incomingMessage.includes("forget me")) {
    await Promise.all([
      // cancel order
      cancelOrder(event, lastOrder?.index, lastOrder?.data, conversationSid),
      // remove the user from the active customers map
      removeSyncMapItem(NEXT_PUBLIC_ACTIVE_CUSTOMERS_MAP, conversationSid),
      addMessageToConversation(conversationSid, getForgotAttendeeMessage()),
    ]);

    sleep(500);
    //remove conversation from the conversations service
    await deleteConversation(conversationSid);

    return new Response("Forgot attendee", { status: 200 });
  } else if (incomingMessage.includes("queue")) {
    const queuePosition = await getQueuePosition(
      event.slug,
      conversationRecord.lastOrderNumber,
    );
    const message =
      conversationRecord.lastOrderNumber && !isNaN(queuePosition)
        ? getQueuePositionMessage(queuePosition)
        : getNoOpenOrderMessage();
    addMessageToConversation(conversationSid, message);
    return new Response(null, { status: 201 });
  }

  if (event.state === EventState.CLOSED) {
    const message = getPausedEventMessage();
    addMessageToConversation(conversationSid, message);
    return new Response("Event Orders Paused", { status: 200 });
  }

  if (incomingMessage.includes("help")) {
    const { contentSid, contentVariables } = await getHelpMessage(event);
    addMessageToConversation(conversationSid, "", contentSid, contentVariables);

    if (event.selection.modifiers.length > 1) {
      await sleep(1500);
      const modifiersNote = getModifiersMessage(event.selection.modifiers);
      addMessageToConversation(conversationSid, modifiersNote);
    }

    return new Response("", { status: 200 });
  } else if (incomingMessage.includes("change")) {
    if (lastOrder?.data?.status === "queued") {
      const { orderItem, orderModifier } = await getOrderItemFromMessage(
        event,
        incomingMessageBody,
      );
      if (orderItem.shortTitle !== "") {
        try {
          updateOrder(event.slug, lastOrder.index, {
            ...lastOrder.data,
            item: orderItem,
            ...(orderModifier.length >= 1 && { modifiers: orderModifier }),
            originalText: incomingMessageBody,
            status: "queued",
          });

          const message = getChangedOrderMessage(
            lastOrder.index,
            `${orderItem.shortTitle}${orderModifier.length > 1 ? ` with ${orderModifier}` : ""}`,
          );
          addMessageToConversation(conversationSid, message);
          return new Response(null, { status: 201 });
        } catch (error) {
          const message = getOopsMessage(error);
          addMessageToConversation(conversationSid, message);
          return new Response(null, { status: 201 });
        }
      } else if (orderItem.shortTitle === "") {
        const wrongOrderMessage = await getWrongOrderMessage(
          incomingMessageBody,
          event.selection.items,
        );
        addMessageToConversation(
          conversationSid,
          `I dont think I have that drink on the menu. Please try again with a drink I can order.`,
          wrongOrderMessage.contentSid,
          wrongOrderMessage.contentVariables,
        );
        return new Response(null, { status: 201 });
      }
    } else {
      const message = getNoOpenOrderMessage();
      addMessageToConversation(conversationSid, message);
      return new Response(null, { status: 201 });
    }
  } else if (incomingMessage.includes("cancel")) {
    await cancelOrder(
      event,
      lastOrder?.index,
      lastOrder?.data,
      conversationSid,
    );

    return new Response("", { status: 200 });
  } else {
    if (lastOrder?.data.status === "queued") {
      const message = getExistingOrderMessage(
        lastOrder.data.item.shortTitle,
        lastOrder.index,
      );
      addMessageToConversation(conversationSid, message);
      return new Response("", { status: 200 });
    } else if (
      conversationRecord?.orderCount > event.maxOrders &&
      !UNLIMTED_ORDERS.includes(author.replace("whatsapp:", ""))
    ) {
      const message = getMaxOrdersMessage();
      addMessageToConversation(conversationSid, message);
      return new Response("", { status: 200 });
    }

    const { orderItem, orderModifier } = await getOrderItemFromMessage(
      event,
      incomingMessageBody,
    );
    const order: Order = {
      key: conversationSid,
      address,
      item: orderItem,
      ...(orderModifier.length >= 1 && { modifiers: orderModifier }),
      originalText: incomingMessageBody,
      status: "queued",
    };
    const orderCount = Number(conversationRecord?.orderCount) + 1;

    //Step 3 Create Order
    if (orderItem.title !== "") {
      const orderNumber = await addOrder(event.slug, order);

      const orderName = `${orderItem.shortTitle}${orderModifier.length > 1 ? ` with ${orderModifier}` : ""}`;
      const orderCreatedMessage = await getOrderCreatedMessage(
        orderName,
        orderNumber,
        event.selection.mode,
      );
      addMessageToConversation(
        conversationSid,
        undefined,
        orderCreatedMessage.contentSid,
        orderCreatedMessage.contentVariables,
      );

      order.orderNumber = orderNumber;
      await updateSyncMapItem(
        NEXT_PUBLIC_ACTIVE_CUSTOMERS_MAP,
        conversationSid,
        {
          event: event.slug,
          lastOrderNumber: orderNumber,
          orderCount,
          stage: orderCount === 1 ? Stages.FIRST_ORDER : Stages.REPEAT_CUSTOMER,
        },
        TwoWeeksInSeconds,
      );
    } else {
      const wrongOrderMessage = await getWrongOrderMessage(
        incomingMessageBody,
        event.selection.items,
      );
      addMessageToConversation(
        conversationSid,
        `I don't think I have that drink on the menu. Please try again with a drink I can order.`,
        wrongOrderMessage.contentSid,
        wrongOrderMessage.contentVariables,
      );
    }

    return new Response("", { status: 200 });
  }
}

export async function GET() {
  return new Response(
    "This URL needs to be the webhook for the messaging service",
    { status: 200 },
  );
}

async function getEvent(event: string) {
  const assignedEvent = await findSyncMapItems(NEXT_PUBLIC_EVENTS_MAP, {
    slug: event,
  });
  if (
    assignedEvent[0]?.data?.state === EventState.OPEN ||
    assignedEvent[0]?.data?.state === EventState.CLOSED
  ) {
    //If assigned event is active
    return assignedEvent[0].data;
  } else {
    return null;
  }
}

async function getActiveEvents() {
  const activeEvents = await findSyncMapItems(NEXT_PUBLIC_EVENTS_MAP, {
    state: EventState.OPEN,
  });
  return activeEvents;
}

async function addOrder(event: string, order: Order) {
  const { index } = await pushToSyncList(event, order);
  return index;
}

async function fetchOrder(event: string, index: number) {
  try {
    const item = await fetchSyncListItem(event, index);
    return item;
  } catch (err: any) {
    if (err.status === 404) {
      return null;
    }
    return null;
  }
}

async function getQueuePosition(event: string, orderNumber: number) {
  const firstPageOrders = await fetchSyncListItems(event);
  const openOrders = firstPageOrders.filter(
    (item) => item.data.status === "queued",
  );
  const queuePosition = openOrders.findIndex(
    (item) => item.index === orderNumber,
  );
  return queuePosition >= 0 ? queuePosition : NaN;
}
