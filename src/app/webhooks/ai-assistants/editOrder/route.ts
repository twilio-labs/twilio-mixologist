// Copyright (c) 2024 Twilio Inc.

"use server";

import { checkSignature, createSyncMapItemIfNotExists } from "@/lib/twilio";
import { NextRequest } from "next/server";
import {
  cancelOrder,
  fetchOrder,
  getEvent,
  updateOrder,
  verifyOrder,
} from "../../mixologist-helper";
import { headers } from "next/headers";
import { getAuthenticatedRole, Privilege } from "@/middleware";

const NEXT_PUBLIC_ACTIVE_CUSTOMERS_MAP =
  process.env.NEXT_PUBLIC_ACTIVE_CUSTOMERS_MAP || "";

export async function POST(request: NextRequest) {
  const {
    item,
    modifiers,
    originalMessage,
    action,
  }: {
    item: string;
    modifiers: string[];
    originalMessage: string;
    action: "edit" | "cancel";
  } = await request.json();
  const searchParams = request.nextUrl.searchParams;
  const eventSlug = searchParams.get("event");

  const headerList = await headers();
  const conversationHeader = headerList.get("X-Session-Id") || "";

  const conversationSid = conversationHeader.split(":").pop();

  const role = getAuthenticatedRole(headerList.get("Authorization") || "");
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

  const lastOrder = await fetchOrder(
    eventSlug,
    // @ts-ignore  thinks is a object but actually it's a string
    conversationRecord?.lastOrderNumber,
  );

  // @ts-ignore  thinks is a object but actually it's a string
  let event = await getEvent(conversationRecord.event);

  if (action === "edit") {
    // @ts-ignore  thinks is a object but actually it's a string
    if (lastOrder?.data?.status === "queued") {
      // @ts-ignore  thinks is a object but actually it's a string
      if (verifyOrder(item, event, modifiers)) {
        try {
          // @ts-ignore  thinks is a object but actually it's a string
          updateOrder(event.slug, lastOrder.index, {
            ...lastOrder.data,
            item,
            ...(modifiers &&
              modifiers.length >= 0 && {
                modifiers: modifiers.join(", "),
              }),
            originalText: originalMessage,
            status: "queued",
          });

          return new Response(
            `${item}${modifiers && modifiers.length > 1 ? ` with ${modifiers.join(", ")}` : ""}`,
            { status: 200 },
          );
        } catch (error) {
          return new Response("An error occurred while updating the order", {
            status: 500,
          });
        }
      } else {
        return new Response("The order is not valid", { status: 500 });
      }
    } else {
      return new Response("No open order to edit", { status: 500 });
    }
  } else if (action === "cancel" && lastOrder?.index) {
    // @ts-ignore  thinks is a object but actually it's a string
    await cancelOrder(event, lastOrder?.index, lastOrder?.data);
    // @ts-ignore  thinks is a object but actually it's a string
    return new Response(`Order #${lastOrder?.index} has been cancelled`, {
      status: 200,
    });
  } else {
    return new Response("No open order to cancel", { status: 500 });
  }
}
