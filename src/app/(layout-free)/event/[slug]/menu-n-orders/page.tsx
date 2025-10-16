"use client";

import { useState, useEffect } from "react";
import { Event } from "@/app/(master-layout)/event/[slug]/page";
import MenuItem from "./menu-item";
import Header from "./header";
import { useSyncList, useSyncMap } from "@/provider/syncProvider";

import { useScreenOrientation } from "@/lib/use-screen-orientation";

function MenuPage(props: { params: Promise<{ slug: string }> }) {
  const [params, setParams] = useState<{ slug: string } | null>(null);

  const screenOrientation = useScreenOrientation();

  // Initialize params
  useEffect(() => {
    props.params.then(setParams);
  }, [props.params]);

  if (!process.env.NEXT_PUBLIC_EVENTS_MAP) {
    throw new Error("No config doc specified");
  }

  // Use sync hooks for real-time data
  const [eventsMap, _, mapInitialized] = useSyncMap(
    process.env.NEXT_PUBLIC_EVENTS_MAP,
    params ? [params.slug] : [],
  );

  // @ts-ignore TODO Fix this TS issue
  const internalEvent = params ? (eventsMap?.get(params.slug) as Event) : null;

  const [ordersList, , , , orderListInitialized] = useSyncList(
    params?.slug || "",
    300,
  );

  if (!params || !mapInitialized || !internalEvent) {
    return <div>Loading...</div>;
  }

  // Filter orders to show only pending ones (queued or ready)
  const pendingOrders = Array.isArray(ordersList)
    ? ordersList.filter(
        (order: any) =>
          order.data.status === "queued" || order.data.status === "ready",
      )
    : [];

  const itemsCount = internalEvent.selection.items.length;
  const columns = screenOrientation.includes("landscape")
    ? itemsCount <= 4
      ? 2
      : itemsCount % 3 === 0
        ? 3
        : itemsCount % 4 === 0
          ? 4
          : 5
    : itemsCount % 3 === 0
      ? 3
      : 2;

  return (
    <>
      <Header number={internalEvent.senders[0]} />
      <main className="flex grow pb-8 mb-32 items-center justify-center text-white select-none">
        <div className={`grid grid-cols-${columns} gap-8mx-24 `}>
          {internalEvent.selection?.items.map((item: any, index: Number) => (
            <div key={`item-${index}`} className="flex flex-col items-center">
              <div className="p-4 rounded-full mb-2">
                <MenuItem
                  title={item.title}
                  shortTitle={item.shortTitle}
                  description={item.description}
                />
              </div>
            </div>
          ))}
        </div>
        {/* Pending Orders List */}
        {pendingOrders.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-600 p-4">
            <h3 className="text-lg font-semibold mb-2">Pending Orders</h3>
            <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
              {pendingOrders.map((order: any) => (
                <div
                  key={order.index}
                  className={`px-3 py-2 rounded-md text-sm ${
                    order.data.status === "ready"
                      ? "bg-green-600 text-white"
                      : "bg-red-600 text-white"
                  }`}
                >
                  <span className="font-bold">#{order.index}</span> -{" "}
                  {order.data.item}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </>
  );
}

export default MenuPage;
