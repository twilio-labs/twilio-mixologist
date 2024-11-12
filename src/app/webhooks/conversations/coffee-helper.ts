import { Event } from "@/app/(master-layout)/event/[slug]/page";
import { Order } from "@/config/menus";
import { getCancelOrderMessage, getNoOpenOrderMessage, getOopsMessage } from "@/lib/stringTemplates";

import {
  addMessageToConversation,
  updateSyncListItem,
  updateSyncMapItem,
} from "@/lib/twilio";

const NEXT_PUBLIC_EVENTS_MAP = process.env.NEXT_PUBLIC_EVENTS_MAP || "";

export async function updateOrder(event: string, index: number, data: Order) {
  const item = await updateSyncListItem(event, index, data);
  return item;
}

export async function cancelOrder(
  event: Event,
  index: undefined | number,
  data: Order,
  conversationSid: string,
) {
  if (index && data?.status === "queued") {
    try {
      updateOrder(event.slug, index, { ...data, status: "cancelled" });

      await updateSyncMapItem(NEXT_PUBLIC_EVENTS_MAP, event.slug, {
        cancelledCount: Number(event.cancelledCount) + 1,
      });

      const message = getCancelOrderMessage(
        data.item.shortTitle,
        index,
      );
      addMessageToConversation(conversationSid, message);
    } catch (error) {
      const message = getOopsMessage(error);
      addMessageToConversation(conversationSid, message);
    }
  } else {
    const message = getNoOpenOrderMessage();
    addMessageToConversation(conversationSid, message);
  }
}
