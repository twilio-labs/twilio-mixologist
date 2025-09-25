// Copyright (c) 2025 Twilio Inc.

"use server";

import {
  checkSignature,
  createSyncMapItemIfNotExists,
  fetchSyncListItems,
  updateSyncMapItem,
} from "@/lib/twilio";
import { NextRequest } from "next/server";
import {
  addOrder,
  verifyOrder,
  fetchOrder,
  getEvent,
} from "../../mixologist-helper";
import { Order } from "@/config/menus";
import { redact, Stages, TwoWeeksInSeconds } from "@/lib/utils";
import { headers } from "next/headers";
import { Event } from "@/app/(master-layout)/event/[slug]/page";

import { Analytics } from "@segment/analytics-node";

const NEXT_PUBLIC_ACTIVE_CUSTOMERS_MAP =
    process.env.NEXT_PUBLIC_ACTIVE_CUSTOMERS_MAP || "",
  UNLIMTED_ORDERS = (process.env.UNLIMITED_ORDERS || "").split(","),
  SEGMENT_WRITE_KEY = process.env.SEGMENT_WRITE_KEY || "";

const analytics = new Analytics({
  writeKey: SEGMENT_WRITE_KEY,
});

async function getQueuePosition(event: string, orderNumber: number) {
  const firstPageOrders = await fetchSyncListItems(event);
  const openOrders = firstPageOrders.filter(
    // @ts-ignore  thinks is a object but actually it's a string
    (item) => item.data.status === "queued",
  );
  const queuePosition = openOrders.findIndex(
    (item) => item.index === orderNumber,
  );
  return queuePosition >= 0 ? queuePosition : NaN;
}

export async function POST(request: NextRequest) {
  const [{ item, modifiers, originalMessage }, headerList] = await Promise.all([
    request.json(),
    headers(),
  ]);
  const searchParams = request.nextUrl.searchParams;
  const eventSlug = searchParams.get("event");
  const conversationHeader = headerList.get("X-Session-Id") || "",
    identityHeader = headerList.get("X-Identity") || "";

  const conversationSid = conversationHeader.split(":").pop(),
    phoneNumber = identityHeader.split(":").pop();

  const signature = headerList.get("X-Twilio-Signature") || "";

  const isSignedCorrectly = await checkSignature(signature, request.url);

  if (!isSignedCorrectly) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (!conversationSid || !eventSlug || !phoneNumber) {
    return new Response("Missing session ID, event slug, or phone number", {
      status: 500,
    });
  }

  const { data: conversationRecord } = await createSyncMapItemIfNotExists(
    NEXT_PUBLIC_ACTIVE_CUSTOMERS_MAP,
    conversationSid,
  );

  const lastOrder = await fetchOrder(
    eventSlug,
    // @ts-ignore  thinks is a object but actually it's a string
    conversationRecord?.lastOrderNumber,
  );

  // @ts-ignore  thinks is a object but actually it's a string
  let event = (await getEvent(conversationRecord.event)) as Event;

  if (!verifyOrder(item, event, modifiers)) {
    return new Response(
      `The order for a ${item} with modifiers ${modifiers.join(", ")} is not valid.`,
      { status: 500 },
    );
  }
  // @ts-ignore  thinks is a object but actually it's a string
  if (lastOrder?.data.status === "queued") {
    return new Response(
      `Couldn't create order since the customer already has an active order for a ${lastOrder.data.item}, order # ${lastOrder.index}`,
      { status: 500 },
    );
  } else if (
    // @ts-ignore  thinks is a object but actually it's a string
    conversationRecord?.orderCount > event.maxOrders &&
    !UNLIMTED_ORDERS.includes(phoneNumber)
  ) {
    return new Response(
      `Couldn't create order since the customer already ordered the maximum number of drinks allowed.`,
      { status: 500 },
    );
  }

  analytics.track({
    userId: conversationSid,
    event: "Barista Order Placed",
    properties: {
      item: item,
      modifiers: modifiers,
      event: eventSlug,
    },
  });

  const order: Order = {
    key: conversationSid,
    address: await redact(identityHeader),
    item,
    ...(modifiers &&
      modifiers.length >= 1 && {
        modifiers: modifiers.join(", "),
      }),
    originalText: originalMessage,
    status: "queued",
  };
  const orderCount = Number(conversationRecord?.orderCount) + 1;

  if (item !== "") {
    const orderNumber = await addOrder(event.slug, order);

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
    return new Response(
      `The order #${order.orderNumber} for a ${order.item} has been created successfully and fill be prepared now.`,
      { status: 200 },
    );
  } else {
    return new Response(
      `It seems this order is missing an item. Please try again.`,
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const eventSlug = searchParams.get("event");
  const headersList = await headers();

  const conversationHeader = headersList.get("X-Session-Id") || "";

  const conversationSid = conversationHeader.split(":").pop();

  const signature = headersList.get("X-Twilio-Signature") || "";
  const isSignedCorrectly = await checkSignature(signature, request.url);

  if (!isSignedCorrectly) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (!conversationSid || !eventSlug) {
    return new Response("Missing session ID or event slug", { status: 500 });
  }

  const { data: conversationRecord } = await createSyncMapItemIfNotExists(
    NEXT_PUBLIC_ACTIVE_CUSTOMERS_MAP,
    conversationSid,
  );
  // @ts-ignore  thinks is a object but actually it's a number
  const lastOrderNumber = conversationRecord?.lastOrderNumber as number;

  try {
    const lastOrder = await fetchOrder(eventSlug, lastOrderNumber);

    const queuePosition = await getQueuePosition(eventSlug, lastOrderNumber);
    if (isNaN(queuePosition)) {
      return new Response("No active orders found.", { status: 200 });
    }

    const message = `The current queue position is ${queuePosition} and the last order was for a ${lastOrder?.data?.item}`;
    return new Response(message, { status: 200 });
  } catch (e) {
    return new Response("No active orders found.", { status: 200 });
  }
}
