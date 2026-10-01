import type { Event, Order } from "@/types";

import {
  fetchSyncListItem,
  findSyncMapItems,
  pushToSyncList,
  updateSyncListItem,
  updateSyncMapItem,
} from "@/lib/twilio";
import { EventState } from "@/lib/utils";

const NEXT_PUBLIC_EVENTS_MAP = process.env.NEXT_PUBLIC_EVENTS_MAP || "";

export function verifyOrder(item: string, event: Event, modifiers?: string[]) {
  if (item === "") {
    return false;
  }

  if (!event.selection.items.find((i) => i.title === item)) {
    return false;
  }

  if (modifiers && modifiers.length > 0) {
    for (const modifier of modifiers) {
      if (!event.selection.modifiers.includes(modifier)) {
        return false;
      }
    }
  }

  return true;
}

export async function updateOrder(event: string, index: number, data: Order) {
  const item = await updateSyncListItem(event, index, data);
  return item;
}

export async function cancelOrder(event: Event, index: number, data: Order) {
  updateOrder(event.slug, index, { ...data, status: "cancelled" });

  await updateSyncMapItem(NEXT_PUBLIC_EVENTS_MAP, event.slug, {
    cancelledCount: Number(event.cancelledCount) + 1,
  });
}

export async function addOrder(event: string, order: Order) {
  const { index } = await pushToSyncList(event, order);
  return index;
}

export async function fetchOrder(event: string, index: number) {
  try {
    const item = await fetchSyncListItem(event, index);
    return item;
  } catch (err: any) {
    if (err.status === 404) {
      return null;
    }
    return null;
  }
}

export async function getEvent(event: string) {
  const syncItems = await findSyncMapItems(NEXT_PUBLIC_EVENTS_MAP, {
    slug: event,
  });

  // @ts-ignore thinks is a object but actually it's an event
  const assignedEvent = syncItems[0]?.data as Event;
  if (
    assignedEvent?.state === EventState.OPEN ||
    assignedEvent?.state === EventState.CLOSED
  ) {
    // If assigned event is active
    return assignedEvent;
  } else {
    return null;
  }
}
