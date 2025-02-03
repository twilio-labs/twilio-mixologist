// Copyright (c) 2024 Twilio Inc.

"use server";

import {
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

const NEXT_PUBLIC_ACTIVE_CUSTOMERS_MAP =
    process.env.NEXT_PUBLIC_ACTIVE_CUSTOMERS_MAP || "",
  UNLIMTED_ORDERS = (process.env.UNLIMITED_ORDERS || "").split(",");

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

export async function POST(request: NextRequest) {
  const {
    item,
    modifiers,
    originalMessage,
  }: {
    item: string;
    modifiers: string[];
    originalMessage: string;
  } = await request.json();
  const searchParams = request.nextUrl.searchParams;
  const eventSlug = searchParams.get("event");
  const headerList = await headers();
  const conversationHeader = headerList.get("X-Session-Id") || "",
    identityHeader = headerList.get("X-Identity") || "";

  const conversationSid = conversationHeader.split(":").pop(),
    phoneNumber = identityHeader.split(":").pop();

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
    conversationRecord?.lastOrderNumber,
  );

  let event = await getEvent(conversationRecord.event);

  if (!verifyOrder(item, modifiers, event)) {
    return new Response(
      `The order for a ${item} with modifiers ${modifiers.join(", ")} is not valid.`,
      { status: 500 },
    );
  }
  if (lastOrder?.data.status === "queued") {
    return new Response(
      `Couldn't create order since the customer already has an active order for a ${lastOrder.data.item.shortTitle}, order # ${lastOrder.index}`,
      { status: 500 },
    );
  } else if (
    conversationRecord?.orderCount > event.maxOrders &&
    !UNLIMTED_ORDERS.includes(phoneNumber)
  ) {
    return new Response(
      `Couldn't create order since the customer already ordered the maximum number of drinks allowed.`,
      { status: 500 },
    );
  }

  const order: Order = {
    key: conversationSid,
    address: await redact(identityHeader),
    item: {
      //TODO refactor to have only the shortTitle here
      shortTitle: item,
      title: item,
      description: item,
    },
    ...(modifiers.length >= 1 && {
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
      `The order #${order.orderNumber} for a ${order.item.title} has been created successfully and fill be prepared now.`,
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
  const conversationSid = searchParams.get("conversationSid");

  if (!conversationSid || !eventSlug) {
    return new Response("Missing session ID or event slug", { status: 500 });
  }

  const { data: conversationRecord } = await createSyncMapItemIfNotExists(
    NEXT_PUBLIC_ACTIVE_CUSTOMERS_MAP,
    conversationSid,
  );

  try {
    const lastOrder = await fetchOrder(
      eventSlug,
      conversationRecord?.lastOrderNumber,
    );

    const queuePosition = await getQueuePosition(
      eventSlug,
      conversationRecord.lastOrderNumber,
    );
    const message =
      conversationRecord.lastOrderNumber && !isNaN(queuePosition)
        ? "No active orders found."
        : "The current queue position is " +
          queuePosition +
          " and the last order was for a " +
          lastOrder?.data?.item.title; //TODO change this
    return new Response(message, { status: 200 });
  } catch (e) {
    return new Response("No active orders found.", { status: 200 });
  }
}
