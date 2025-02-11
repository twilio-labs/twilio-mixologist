import { Event } from "@/app/(master-layout)/event/[slug]/page";
import { MenuItem, Order } from "@/config/menus";

import {
  fetchSyncListItem,
  findSyncMapItems,
  pushToSyncList,
  updateSyncListItem,
  updateSyncMapItem,
} from "@/lib/twilio";
import { EventState } from "@/lib/utils";

const NEXT_PUBLIC_EVENTS_MAP = process.env.NEXT_PUBLIC_EVENTS_MAP || "";

export function verifyOrder(item: string, modifiers: string[], event: Event) {
  if (item === "") {
    return false;
  }

  if (!event.selection.items.find((i) => i.title === item)) {
    return false;
  }

  if (modifiers.length > 0) {
    for (const modifier of modifiers) {
      if (!event.selection.modifiers.includes(modifier)) {
        return false;
      }
    }
  }

  return true;
}

export function filterRealMenuItems(
  message: string,
  menu: MenuItem[],
): [string, MenuItem[], string] {
  const lines = message.split("\n");
  const intro = lines[0];
  const outro = lines[lines.length - 1];

  if (lines.length < 4) {
    return [intro, [], outro];
  }
  const cleanedItems = lines
    .map((line) => {
      // remove everything after a line break, remove first - with regex -- only if it's the first non-whitespace character
      const cleanedItem = line
        .split("\n")[0]
        .replace(/^\s*-\s*/, "")
        // // , remove special characters but keep è
        // .replace(/[^\w\sè]/gi, "");

      //sort menu by longest title first
      const match = menu
        .sort((a, b) => b.title.length - a.title.length)
        .find((i) => cleanedItem.includes(i.title));
      // For now we assume the AI won't make up new modifiers, if this happens, we also need to filter here
      if (!match) {
        return null;
      }
      match.title = cleanedItem;
      // The WhatsApp spec doesn't allow for more than 72 characters in a description
      match.description = cleanedItem.length > 72 ? cleanedItem.slice(0, 72) : cleanedItem;
      return match;
    })
    .filter((i) => !!i);

  return [intro, cleanedItems, outro];
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
  const assignedEvent = await findSyncMapItems(NEXT_PUBLIC_EVENTS_MAP, {
    slug: event,
  });
  if (
    assignedEvent[0]?.data?.state === EventState.OPEN ||
    assignedEvent[0]?.data?.state === EventState.CLOSED
  ) {
    //If assigned event is active
    return assignedEvent[0].data;
  } else {
    return null;
  }
}
