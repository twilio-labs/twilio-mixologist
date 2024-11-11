import { headers } from "next/headers";

import {
  addMessageToConversation,
  createConversationWithParticipant,
  getConversationsOfSender,
  getLookupService,
  pushToSyncList,
  updateOrCreateSyncMapItem,
} from "@/lib/twilio";
import { Privilege, getAuthenticatedRole } from "@/middleware";
import { getOrderCreatedMessage } from "@/lib/templates";
import {
  getCountryFromPhone,
  redact,
  Stages,
  TwoWeeksInSeconds,
} from "@/lib/utils";
import { Order } from "@/config/menus";

const NEXT_PUBLIC_ACTIVE_CUSTOMERS_MAP =
  process.env.NEXT_PUBLIC_ACTIVE_CUSTOMERS_MAP || "";

export async function POST(request: Request) {
  const [headersList, data] = await Promise.all([headers(), request.json()]);
  const role = getAuthenticatedRole(headersList.get("Authorization") || "");

  const isPrivileged = [Privilege.ADMIN, Privilege.KIOSK].includes(role);

  if (!process.env.NEXT_PUBLIC_EVENTS_MAP) {
    console.error("No config doc specified");
    return new Response("No config doc specified", {
      status: 500,
      statusText: "No config doc specified",
    });
  }
  if (!isPrivileged) {
    console.error("Not authorized");
    return new Response(
      `Role ${role} is not authorized to perform this action`,
      {
        status: 500,
        statusText: `Role ${role} is not authorized to perform this action`,
      },
    );
  }

  try {
    // 1. Validate user input
    const lookupService = await getLookupService();
    const phoneNumber = await lookupService.phoneNumbers(data.phone).fetch();

    console.log(`phone number is valid: ${phoneNumber.valid}`); // TODO potentially check sms_pumping_risk here
    if (!phoneNumber.valid) {
      return new Response("Phone number is invalid", {
        status: 400,
        statusText: "Phone number is invalid",
      });
    }
    // await deleteConversation("CH3652bd9990b24adda9d9630ee290b935");

    // 2. Create new conversation
    const sender = data.whatsapp ? `whatsapp:${data.phone}` : data.phone;
    const participantConversations = await getConversationsOfSender(sender);
    const activeConversations = participantConversations.filter(
      (conv) => conv.conversationState === "active",
    );
    let conversationSid;
    if (activeConversations.length === 0) {
      // create a new conversation
      const c = await createConversationWithParticipant(sender);
      conversationSid = c.sid;
    } else if (activeConversations.length === 1) {
      // add message to existing conversation
      conversationSid = activeConversations[0].conversationSid;
    } else {
      return new Response("Multiple active conversations found", {
        status: 400,
        statusText: "Multiple active conversations found",
      });
    }

    // 3. Add attendee to sync list
    // incorrect but doesn't matter for this single-use event, should check if attendee is already in list
    const country = getCountryFromPhone(data.phone);
    await updateOrCreateSyncMapItem(
      NEXT_PUBLIC_ACTIVE_CUSTOMERS_MAP,
      conversationSid,
      {
        event: data.event,
        orderCount: 1,
        stage: Stages.FIRST_ORDER,
        country: country?.name === "Canada" ? "United States" : country?.name,
      },
      TwoWeeksInSeconds,
    );

    // 4. Add order to sync list
    const order: Order = {
      key: conversationSid,
      address: await redact(sender),
      item: data.item,
      ...(data?.modifiers?.length >= 1 && { modifiers: data.modifiers }),
      status: "queued",
      originalText: "Ordered via Kiosk",
    };
    const receipt = await pushToSyncList(data.event, order);

    // 5. Send order confirmation message
    const message = await getOrderCreatedMessage(
      data.item.shortTitle,
      receipt.index,
      "barista", // TODO look up event kind from slug
    );

    await addMessageToConversation(
      conversationSid,
      undefined,
      message.contentSid,
      message.contentVariables,
    );
  } catch (e: any) {
    console.error(e);
    return new Response(e.message, { status: 500, statusText: e.message });
  }
  return new Response(null, { status: 201 });
}
