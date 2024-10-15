"use client";

import { useSyncList, useSyncMap } from "@/provider/syncProvider";

import { Event } from "@/app/(master-layout)/event/[slug]/page";
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

  let [
    ordersList,
    deleteOrder,
    updateOrder,
    updateOrderTTL,
    orderListInitialized,
  ] = useSyncList(slug, 300);

  if (!mapInitialized || !internalEvent || !orderListInitialized) {
    return (
      <div className="w-2/3 mx-auto h-10 bg-gray-300 rounded animate-pulse"></div>
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
      <div className="flex">
        <h2 className="flex-1 text-2xl font-semibold mb-6 text-center">
          Orders for {internalEvent?.name}
          <span className="text-sm text-gray-500">
            <br />
            {terminalSuffix}
          </span>
        </h2>
        <HeaderControls event={internalEvent} updateEvent={fetchUpdateEvent} />
      </div>
      <section className="mt-4">
        <OrdersList
          // @ts-ignore // TODO Fix this TS issue
          ordersList={ordersList}
          // @ts-ignore // TODO Fix this TS issue
          updateOrder={updateOrder}
          event={internalEvent}
          updateEvent={fetchUpdateEvent}
          // @ts-ignore // TODO Fix this TS issue
          updateOrderTTL={updateOrderTTL}
          // @ts-ignore // TODO Fix this TS issue
          deleteOrder={deleteOrder}
        />
      </section>
    </div>
  );
}
