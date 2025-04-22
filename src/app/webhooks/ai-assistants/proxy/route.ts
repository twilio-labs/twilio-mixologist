// Copyright (c) 2025 Twilio Inc.

"use server";

import {
  addMessageToConversation,
  checkSignature,
  createSyncMapItemIfNotExists,
} from "@/lib/twilio";
import { NextRequest } from "next/server";
import {
  filterRealMenuItems,
  filterRealModifiers,
  getEvent,
} from "../../mixologist-helper";
import {
  getShowMenuMessage,
  getShowModifiersMessage,
} from "@/scripts/fetchContentTemplates";
import { headers } from "next/headers";

const NEXT_PUBLIC_ACTIVE_CUSTOMERS_MAP =
  process.env.NEXT_PUBLIC_ACTIVE_CUSTOMERS_MAP || "";

export async function POST(request: NextRequest) {
  const [{ Body, SessionId, Error, Status }, headersList] = await Promise.all([
    request.json(),
    headers(),
  ]);
  const signature = headersList.get("X-Twilio-Signature") || "";
  const isSignedCorrectly = await checkSignature(signature, request.url);

  if (!isSignedCorrectly) {
    return new Response("Unauthorized", { status: 401 });
  }
  const response = Status === "Success" ? Body : Error;
  const conversationSid = SessionId.split(":").pop();
  if (!conversationSid || !response) {
    return new Response(null, { status: 400 });
  }

  const { data: conversationRecord } = await createSyncMapItemIfNotExists(
    NEXT_PUBLIC_ACTIVE_CUSTOMERS_MAP,
    conversationSid,
  );

  // @ts-ignore  thinks is a object but actually it's a string
  let event = await getEvent(conversationRecord.event);

  if (!event) {
    console.error(
      `Event not found for conversation ${conversationSid}. Message was supposed to be: ${response}`,
    );
    return new Response("Event not found", { status: 500 });
  }

  const [intro, menuItems, outro] = filterRealMenuItems(
    response,

    // @ts-ignore  thinks is a object but actually it's an array
    event.selection.items,
  );

  if (menuItems.length > 1) {
    const helpMessage = await getShowMenuMessage(intro, menuItems, outro);
    addMessageToConversation(
      conversationSid,
      undefined,
      helpMessage.contentSid,
      helpMessage.contentVariables,
    );

    return new Response(null, { status: 200 });
  }

  const [_, modifers, __] = filterRealModifiers(
    response,

    // @ts-ignore  thinks is a object but actually it's a number
    event.selection.modifiers,
  );

  if (modifers.length > 1) {
    const helpMessage = await getShowModifiersMessage(intro, modifers, outro);
    addMessageToConversation(
      conversationSid,
      undefined,
      helpMessage.contentSid,
      helpMessage.contentVariables,
    );

    return new Response(null, { status: 200 });
  }

  addMessageToConversation(conversationSid, response);
  return new Response(null, { status: 200 });
}
