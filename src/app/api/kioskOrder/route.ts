import { headers } from "next/headers";

import {
  addMessageToConversation,
  createConversationWithParticipant,
  getConversationsOfSender,
  getLookupService,
  getSyncService,
  pushToSyncList,
  updateOrCreateSyncMapItem,
} from "@/lib/twilio";
import { Privilege, getAuthenticatedRole } from "@/middleware";
import {
  getCountryFromPhone,
  redact,
  Stages,
  TwoWeeksInSeconds,
} from "@/lib/utils";
import { Order } from "@/config/menus";
import { getOrderCreatedMessage } from "@/scripts/fetchContentTemplates";

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

  // 1. Validate user input
  const lookupService = await getLookupService();
  const lookupResult = await lookupService
    .phoneNumbers(data.phone)
    .fetch({ fields: "sms_pumping_risk" });
  if (!data.phone || !data?.item?.title || !data.event) {
    return new Response("Missing required fields", {
      status: 400,
      statusText: "Missing required fields",
    });
  }

  if (!lookupResult.valid) {
    return new Response("Phone number is invalid", {
      status: 400,
      statusText: "Phone number is invalid",
    });
  }
  if (lookupResult?.smsPumpingRisk?.sms_pumping_risk_score >= 60) {
    return new Response(
      "Phone number is at high risk of SMS pumping. Please try again later.",
      {
        status: 400,
        statusText:
          "Phone number is at high risk of SMS pumping. Please try again later.",
      },
    );
  }

  // 2. Fetch event data
  const syncService = await getSyncService();
  const events = await syncService
    .syncMaps()(process.env.NEXT_PUBLIC_EVENTS_MAP)
    .fetch();
  const items = await events.syncMapItems().list();
  const event = items.find((item: any) => item.data.slug === data.event);

  if (!event) {
    return new Response("Event not found", {
      status: 404,
      statusText: "Event not found",
    });
  }

  // 3. Create new conversation
  const sender = data.whatsapp
    ? `whatsapp:${lookupResult.phoneNumber}`
    : lookupResult.phoneNumber;
  const participantConversations = await getConversationsOfSender(sender);
  const activeConversations = participantConversations.filter(
    (conv) => conv.conversationState === "active",
  );
  let conversationSid;
  if (activeConversations.length === 0) {
    // create a new conversation
    const senders = event?.data?.senders;
    const phoneNumber = senders?.find((s: string) => !s.startsWith("whatsapp")); // assuming here that this sender is also whatsapp-enabled
    try {
      const c = await createConversationWithParticipant(sender, phoneNumber);
      conversationSid = c.sid;
    } catch (e) {
      console.error(e);
      return new Response("Failed to create conversation", {
        status: 500,
        statusText: "Failed to create conversation",
      });
    }
  } else {
    // add message to existing conversation
    conversationSid = activeConversations[0].conversationSid;
  }

  // 4. Add attendee to sync list
  // incorrect but doesn't matter for this single-use event, should check if attendee is already in list
  try {
    const country = getCountryFromPhone(lookupResult.phoneNumber);
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
  } catch (e) {
    console.error(e);
    return new Response("Failed to add attendee to sync list", {
      status: 500,
      statusText: "Failed to add attendee to sync list",
    });
  }

  // 5. Add order to sync list
  let orderNumber;
  try {
    const order: Order = {
      key: conversationSid,
      address: await redact(sender),
      item: data.item,
      ...(data?.modifiers?.length >= 1 && { modifiers: data.modifiers }),
      status: "queued",
      originalText: "Ordered via Kiosk",
    };
    const receipt = await pushToSyncList(data.event, order);
    orderNumber = receipt.index;
  } catch (e) {
    console.error(e);
    return new Response("Failed to add order to sync list", {
      status: 500,
      statusText: "Failed to add order to sync list",
    });
  }

  // 6. Send order confirmation message
  try {
    const message = await getOrderCreatedMessage(
      data.item.shortTitle,
      orderNumber,
      event?.data?.selection?.mode,
    );

    await addMessageToConversation(
      conversationSid,
      undefined,
      message.contentSid,
      message.contentVariables,
    );
  } catch (e) {
    console.error(e);
    return new Response("Failed to send order confirmation message", {
      status: 500,
      statusText: "Failed to send order confirmation message",
    });
  }
  return new Response(null, { status: 201 });
}
