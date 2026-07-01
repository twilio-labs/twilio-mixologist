"use server";

import { fetchSyncListItems, findSyncMapItems } from "@/lib/twilio";
import type { Event, modes } from "@/types";
import { Stages } from "@/lib/utils";
import { headers } from "next/headers";
import { getAuthenticatedRole, Privilege } from "@/proxy";

const NEXT_PUBLIC_EVENTS_MAP = process.env.NEXT_PUBLIC_EVENTS_MAP || "";

export type MixologistStats = {
  orderItemCounter: Record<string, number>;
  orderStatusCounter: Record<string, number>;
  mostOrderedItem: string | undefined;
  mostOrderedItemCount: number;
  summedUpStages: { id: string; value: number; label: string }[];
  countries: Record<string, number>;
  channels: Record<string, number>;
  deliveredCount: number;
  cancelledCount: number;
  attendeeCount: number;
  mode: modes;
};

export async function calcStatsForEvent(
  slug: string,
): Promise<MixologistStats> {
  if (
    !process.env.NEXT_PUBLIC_CONFIG_DOC ||
    !process.env.NEXT_PUBLIC_EVENTS_MAP ||
    !process.env.NEXT_PUBLIC_ATTENDEES_MAP
  ) {
    throw new Error("No config doc specified");
  }
  const [orders, eventRes, attendees] = await Promise.all([
    fetchSyncListItems(slug),
    findSyncMapItems(process.env.NEXT_PUBLIC_EVENTS_MAP, {
      slug,
    }),
    findSyncMapItems(process.env.NEXT_PUBLIC_ATTENDEES_MAP, {
      event: slug,
    }),
  ]);

  // @ts-ignore  thinks is a object but actually it's an Event
  const event = eventRes[0].data as Event;

  const orderStatusCounter: Record<string, number> = {};
  const attendeeCountryCounter: Record<string, number> = {};
  const orderItemCounter: any = {};
  const channelCounter: Record<string, number> = {};

  orders.forEach((order: any) => {
    const { data } = order;
    if (!orderStatusCounter[data.status]) {
      orderStatusCounter[data.status] = 0;
    }
    orderStatusCounter[data.status]++;

    if (!orderItemCounter[data.item]) {
      orderItemCounter[data.item] = 0;
    }
    orderItemCounter[data.item]++;

    const channel: string = data.channel ?? "other";
    channelCounter[channel] = (channelCounter[channel] ?? 0) + 1;
  });

  attendees.forEach((attendee: any) => {
    const { data } = attendee;
    if (!attendeeCountryCounter[data.country]) {
      attendeeCountryCounter[data.country] = 0;
    }
    attendeeCountryCounter[data.country]++;
  });

  // @ts-ignore
  const mostOrderedItemCount = Math.max(...Object.values(orderItemCounter));
  const mostOrderedItem = Object.keys(orderItemCounter).find(
    (key) => orderItemCounter[key] === mostOrderedItemCount,
  );

  const attendeeStages = attendees.reduce((acc: any, attendee: any) => {
    const { data } = attendee;
    const attendeeStage = data.stage;
    if (!acc[attendeeStage]) {
      acc[attendeeStage] = 0;
    }
    if (!attendeeStage) {
      console.error("attendeeStage is undefined");
    }
    acc[attendeeStage]++;
    return acc;
  }, {});
  let previousSum = 0;
  const summedUpStages = Object.keys(Stages)
    // skip if lead collection is disabled and stage is one of the following: VERIFING, VERIFIED_USER
    .filter(
      (stage: any) =>
        event.enableLeadCollection ||
        ![
          Stages.VERIFYING,
          Stages.VERIFIED_USER,
          Stages.NAME_CONFIRMED,
        ].includes(stage),
    )
    .reverse()
    .map((stage) => {
      let sum = (attendeeStages[stage] || 0) + previousSum;
      previousSum = sum;
      return {
        id: stage,
        value: sum || 0,
        label: stage,
      };
    })
    .reverse();

  return {
    orderStatusCounter,
    orderItemCounter,
    mostOrderedItem,
    mostOrderedItemCount,
    summedUpStages,
    mode: event.selection.mode,
    cancelledCount: event.cancelledCount || 0,
    deliveredCount: event.deliveredCount || 0,
    attendeeCount: attendees.length,
    countries: attendeeCountryCounter,
    channels: channelCounter,
  };
}
