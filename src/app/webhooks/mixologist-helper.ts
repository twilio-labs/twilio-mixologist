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

function shortenStringToMax(string: string, maxLength: number) {
  return string.length > maxLength
    ? string.slice(0, maxLength - 1) + "…"
    : string;
}

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

export function filterRealMenuItems(
  message: string,
  menu: MenuItem[],
): [string, MenuItem[], string] {
  const lines = message.split("\n");
  const intro = lines.shift() || "";
  const outro = lines.pop() || "";

  if (lines.length < 2) {
    return [intro, [], outro];
  }
  const cleanedItems = lines
    .map((line) => {
      // remove everything after a line break, remove first - with regex -- only if it's the first non-whitespace character
      const cleanedItem = line
        .split("\n")[0]
        .replace(/^\s*-\s*/, "")
        // remove all * asteriks
        .replace(/\*/g, "");

      //sort menu by longest title first
      const match = menu
        .sort((a, b) => b.title.length - a.title.length)
        .find((i) => cleanedItem.includes(i.title));
      // For now we assume the AI won't make up new modifiers, if this happens, we also need to filter here
      if (!match) {
        return null;
      }

      if (match.title != cleanedItem) {
        return {
          title: cleanedItem, // visible in message
          shortTitle: shortenStringToMax(match.title, 24), // visible in title of the list popover
          description: shortenStringToMax(cleanedItem, 72), // is desc in list popover
        };
      }
      return { ...match };
    })
    .filter((i) => i !== null);

  return [intro, cleanedItems, outro];
}

export function filterRealModifiers(
  message: string,
  modifiers: string[],
): [string, string[], string] {
  const lines = message.split("\n");
  const intro = lines[0];
  const outro = lines[lines.length - 1];

  if (lines.length < 4) {
    return [intro, [], outro];
  }
  const cleanedModifiers = lines
    .map((line) => {
      const cleanedModifier = line
        .split("\n")[0]
        .replace(/^\s*-\s*/, "")
        .replace(/[^\w\sè]/gi, "");

      const match = modifiers
        .sort((a, b) => b.length - a.length)
        .find((i) => cleanedModifier.includes(i));
      if (!match) {
        return null;
      }
      return match;
    })
    .filter((i) => i !== null);

  return [intro, cleanedModifiers, outro];
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
  debugger
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
