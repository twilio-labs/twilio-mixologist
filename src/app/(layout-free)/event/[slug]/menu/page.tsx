"use client";

import { Event } from "@/app/(master-layout)/event/[slug]/page";
import MenuItem from "./menu-item";
import { useSyncMap } from "@/provider/syncProvider";
import { useEffect, useState } from "react";
import Header from "./header";


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


  const itemsCount = internalEvent.selection.items.length;
  const columns = itemsCount % 3 === 0 ? 3 : itemsCount % 4 === 0 ? 4 : 5;

  return (
    <>
      <Header number={internalEvent.senders[0]} />
      <main className="flex grow pb-8 items-center justify-center bg-gray-900 text-white select-none">
        <div className={`grid grid-cols-${columns} gap-8  `}>
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
      </main>
    </>
  );
}

export default MenuPage;
