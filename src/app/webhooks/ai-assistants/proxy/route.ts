// Copyright (c) 2025 Twilio Inc.

"use server";

import { addMessageToConversation } from "@/lib/twilio";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const { Body, SessionId, Error, Status } = await request.json();
  const response = Status === "Success" ? Body : Error;
  const conversationSid = SessionId.split(":").pop();
  if (!conversationSid || !response) {
    return new Response(null, { status: 400 });
  }

  addMessageToConversation(conversationSid, response);
  return new Response(null, { status: 200 });
}
