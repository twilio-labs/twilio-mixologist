// Copyright (c) 2025 Twilio Inc.

"use server";

import {
  addMessageToConversation,
  createSyncMapItemIfNotExists,
} from "@/lib/twilio";
import { NextRequest } from "next/server";
import { filterRealMenuItems, getEvent } from "../../mixologist-helper";
import { getShowMenuMessage } from "@/scripts/fetchContentTemplates";

const NEXT_PUBLIC_ACTIVE_CUSTOMERS_MAP =
  process.env.NEXT_PUBLIC_ACTIVE_CUSTOMERS_MAP || "";

export async function POST(request: NextRequest) {
  const { Body, SessionId, Error, Status } = await request.json();
  const response = Status === "Success" ? Body : Error;
  const conversationSid = SessionId.split(":").pop();
  if (!conversationSid || !response) {
    return new Response(null, { status: 400 });
  }

  const { data: conversationRecord } = await createSyncMapItemIfNotExists(
    NEXT_PUBLIC_ACTIVE_CUSTOMERS_MAP,
    conversationSid,
  );

  let event = await getEvent(conversationRecord.event);

  const [intro, menuItems, outro] = filterRealMenuItems(response, event.selection.items); //TODO extract name of suggestion and intro/outro

  if (menuItems.length === 0) {
    addMessageToConversation(conversationSid, response);
    return new Response(null, { status: 200 });
  }

  const helpMessage = await getShowMenuMessage(intro, menuItems, outro);
  addMessageToConversation(
    conversationSid,
    undefined,
    helpMessage.contentSid,
    helpMessage.contentVariables,
  );

  return new Response(null, { status: 200 });
}
