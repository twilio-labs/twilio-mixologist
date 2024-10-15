"use server";

import { fetchSyncListItems, findSyncMapItems } from "@/lib/twilio";
import { Stages } from "@/lib/utils";
import { Event } from "@/app/(master-layout)/event/[slug]/page";
import { modes } from "@/config/menus";
import { headers } from "next/headers";
import { getAuthenticatedRole, Privilege } from "@/middleware";

const NEXT_PUBLIC_EVENTS_MAP = process.env.NEXT_PUBLIC_EVENTS_MAP || "";

export type MixologistStats = {
  orderItemCounter: Record<string, number>;
  orderStatusCounter: Record<string, number>;
  mostOrderedItem: string | undefined;
  mostOrderedItemCount: number;
  summedUpStages: { id: string; value: number; label: string }[];
  countries: Record<string, number>;
  deliveredCount: number;
  cancelledCount: number;
  customerCount: number;
  mode: modes;
};

export async function calcStatsForEvent(
  slug: string,
): Promise<MixologistStats> {
  if (
    !process.env.NEXT_PUBLIC_CONFIG_DOC ||
    !process.env.NEXT_PUBLIC_EVENTS_MAP ||
    !process.env.NEXT_PUBLIC_ACTIVE_CUSTOMERS_MAP
  ) {
    throw new Error("No config doc specified");
  }
  const [orders, eventRes, customers] = await Promise.all([
    fetchSyncListItems(slug),
    findSyncMapItems(process.env.NEXT_PUBLIC_EVENTS_MAP, {
      slug,
    }),
    findSyncMapItems(process.env.NEXT_PUBLIC_ACTIVE_CUSTOMERS_MAP, {
      event: slug,
    }),
  ]);

  const event = eventRes[0].data as Event;

  const orderStatusCounter: Record<string, number> = {};
  const customerCountryCounter: Record<string, number> = {};
  const orderItemCounter: any = {};

  orders.forEach((order: any) => {
    const { data } = order;
    if (!orderStatusCounter[data.status]) {
      orderStatusCounter[data.status] = 0;
    }
    orderStatusCounter[data.status]++;

    if (!orderItemCounter[data.item.shortTitle]) {
      orderItemCounter[data.item.shortTitle] = 0;
    }
    orderItemCounter[data.item.shortTitle]++;
  });

  customers.forEach((customer: any) => {
    const { data } = customer;
    if (!customerCountryCounter[data.country]) {
      customerCountryCounter[data.country] = 0;
    }
    customerCountryCounter[data.country]++;
  });

  // @ts-ignore
  const mostOrderedItemCount = Math.max(...Object.values(orderItemCounter));
  const mostOrderedItem = Object.keys(orderItemCounter).find(
    (key) => orderItemCounter[key] === mostOrderedItemCount,
  );

  const attendeeStages = customers.reduce((acc: any, customer: any) => {
    const { data } = customer;
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
    customerCount: customers.length,
    countries: customerCountryCounter,
  };
}
