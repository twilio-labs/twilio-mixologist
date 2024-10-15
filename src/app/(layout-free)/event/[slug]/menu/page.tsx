"use client";

import { Event } from "@/app/(master-layout)/event/[slug]/page";
import MenuItem from "./menu-item";
import { useSyncMap } from "@/provider/syncProvider";
import { useEffect, useState } from "react";

function MenuPage({ params }: { params: { slug: string } }) {
  const [eventsMap, _, mapInitialized] = useSyncMap(
    process.env.NEXT_PUBLIC_EVENTS_MAP || "",
    [params.slug],
  );

  useEffect(() => {
    if (mapInitialized) {
      // @ts-ignore // TODO fix this TS issue
      const existingEvent = eventsMap?.get(params.slug) as Event;
      updateInternalEvent(existingEvent);
    }
  }, [eventsMap, mapInitialized]);

  const [internalEvent, updateInternalEvent] = useState<Event>();

  if (!internalEvent || !internalEvent.selection) {
    return <div>Loading...</div>;
  }

  return (
    // <header className="bg-red-600 text-white p-4">
    //   <div className="container mx-auto flex justify-between items-center">
    //     <h1 className="text-2xl font-bold">Mixologist</h1>
    //     <p className="text-sm">SEND YOUR ORDER TO +1-866-866-5302</p>
    //   </div>
    // </header>
    <main className="flex-grow bg-gray-900 text-white p-8 select-none">
      <div className="container mx-auto">
        <div className="grid grid-cols-5 gap-8">
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
      </div>
    </main>
  );
}

export default MenuPage;
