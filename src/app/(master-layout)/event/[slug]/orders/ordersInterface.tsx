"use client";

import { useSyncList, useSyncMap } from "@/provider/syncProvider";

import type { Event } from "@/types";
import { EventState } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import HeaderControls from "./headerControls";
import OrdersList from "./ordersList";

export default function OrdersInterface({
  slug,
  terminalId,
  terminalCount,
}: {
  slug: string;
  terminalId?: number;
  terminalCount?: number;
}) {
  if (
    !process.env.NEXT_PUBLIC_CONFIG_DOC ||
    !process.env.NEXT_PUBLIC_EVENTS_MAP
  ) {
    throw new Error("No config doc specified");
  }
  const { toast } = useToast();

  async function fetchUpdateEvent(newState: {
    cancelledCount?: number;
    state?: EventState;
    deliveredCount?: number;
  }) {
    try {
      await fetch(`/api/event/${slug}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newState),
      });
    } catch (e: any) {
      console.error(e);
      toast({
        title: "Could not update event",
        description: e?.message,
      });
    }
  }

  const [eventsMap, _, mapInitialized] = useSyncMap(
    process.env.NEXT_PUBLIC_EVENTS_MAP,
    [slug],
  );
  // @ts-ignore TODO Fix this TS issue
  const internalEvent = eventsMap?.get(slug) as Event;

  let [ordersList, , updateOrder, , orderListInitialized] = useSyncList(
    slug,
    300,
  );

  if (!mapInitialized || !internalEvent || !orderListInitialized) {
    return (
      <div className="w-full space-y-3">
        <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse" />
        <div className="h-16 bg-gray-100 rounded-xl animate-pulse" />
        <div className="h-16 bg-gray-100 rounded-xl animate-pulse opacity-70" />
        <div className="h-16 bg-gray-100 rounded-xl animate-pulse opacity-40" />
      </div>
    );
  }

  let terminalSuffix = "";
  if (terminalCount && terminalId && terminalCount > 0 && terminalId > 0) {
    terminalSuffix = `Terminal ${terminalId} of ${terminalCount}`;
    // @ts-ignore
    ordersList = ordersList.filter((order: any) => {
      const visibleInTerminal =
        order.descriptor.index % terminalCount === terminalId - 1;
      const queuedOrReady =
        order.descriptor.data.status === "queued" ||
        order.descriptor.data.status === "ready";

      return visibleInTerminal || !queuedOrReady;
    });
  }

  return (
    <div className="w-full">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-twilio-ink tracking-tight">
            {internalEvent?.name}
          </h2>
          {terminalSuffix && (
            <p className="text-sm text-gray-400 mt-0.5">{terminalSuffix}</p>
          )}
        </div>
        <HeaderControls event={internalEvent} updateEvent={fetchUpdateEvent} />
      </div>
      <OrdersList
        // @ts-ignore // TODO Fix this TS issue
        ordersList={ordersList}
        // @ts-ignore // TODO Fix this TS issue
        updateOrder={updateOrder}
        event={internalEvent}
        updateEvent={fetchUpdateEvent}
      />
    </div>
  );
}
