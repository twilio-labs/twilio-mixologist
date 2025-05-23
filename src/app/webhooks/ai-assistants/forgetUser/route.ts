// Copyright (c) 2025 Twilio Inc.

"use server";

import {
  addMessageToConversation,
  checkSignature,
  createSyncMapItemIfNotExists,
  deleteConversation,
  removeSyncMapItem,
} from "@/lib/twilio";
import { NextRequest } from "next/server";
import { cancelOrder, fetchOrder, getEvent } from "../../mixologist-helper";
import { headers } from "next/headers";
import { sleep } from "@/lib/utils";

const NEXT_PUBLIC_ACTIVE_CUSTOMERS_MAP =
  process.env.NEXT_PUBLIC_ACTIVE_CUSTOMERS_MAP || "";

export async function POST(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const eventSlug = searchParams.get("event");

  const headerList = await headers();
  const conversationHeader = headerList.get("X-Session-Id") || "";

  const conversationSid = conversationHeader.split(":").pop();

  const signature = headerList.get("X-Twilio-Signature") || "";
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

  const [lastOrder, event] = await Promise.all([
    // @ts-ignore  thinks is a object but actually it's a string
    fetchOrder(eventSlug, conversationRecord?.lastOrderNumber),
    // @ts-ignore  thinks is a object but actually it's a string
    getEvent(conversationRecord.event),
  ]);

  if (lastOrder?.index) {
    // @ts-ignore  thinks is a object but actually it's a string
    await cancelOrder(event, lastOrder?.index, lastOrder?.data);
  }

  
  try {
    await addMessageToConversation(
      conversationSid,
      "Your data has been removed. Send any message to start over again.",
    );

    await sleep(2000);

    await Promise.all([
      deleteConversation(conversationSid),
      removeSyncMapItem(NEXT_PUBLIC_ACTIVE_CUSTOMERS_MAP, conversationSid),
    ]);

    return new Response("The user and their order have been removed.", {
      status: 200,
    });
  } catch (error) {
    return new Response(`Something went wrong`, { status: 500 });
  }
}
