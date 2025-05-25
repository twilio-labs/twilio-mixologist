// Copyright (c) 2025 Twilio Inc.

"use server";

import { checkSignature, pushToSyncList } from "@/lib/twilio";
import { NextRequest } from "next/server";
import { headers } from "next/headers";

const NEXT_PUBLIC_FEEDBACK_LIST = process.env.NEXT_PUBLIC_FEEDBACK_LIST || "";

export async function POST(request: NextRequest) {
  const [{ attemptedAction }, headersList] = await Promise.all([
    request.json(),
    headers(),
  ]);
  const conversationHeader = headersList.get("X-Session-Id") || "";

  const signature = headersList.get("X-Twilio-Signature") || "";
  const isSignedCorrectly = await checkSignature(signature, request.url);

  if (!isSignedCorrectly) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (!attemptedAction) {
    return new Response("Missing attempted action", {
      status: 500,
    });
  }

  try {
    await pushToSyncList(NEXT_PUBLIC_FEEDBACK_LIST, {
      sender: conversationHeader,
      feedback: attemptedAction,
    });

    return new Response("The feedback was stored successfully", {
      status: 200,
    });
  } catch (error) {
    return new Response(`Something went wrong`, { status: 500 });
  }
}
