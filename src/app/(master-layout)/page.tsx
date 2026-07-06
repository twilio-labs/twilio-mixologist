// Copyright (c) 2025 Twilio Inc.

import EventCard from "@/components/event-card";
import { Privilege } from "@/proxy";
import Link from "next/link";
import { cookies } from "next/headers";
import { getSyncService } from "@/lib/twilio";

export default async function Home() {
  try {
    const [cookieStore, syncService] = await Promise.all([
      cookies(),
      getSyncService(),
    ]);

    const isAdmin = [Privilege.ADMIN].includes(
      cookieStore.get("privilege")?.value as Privilege,
    );

    if (!process.env.NEXT_PUBLIC_EVENTS_MAP) {
      throw new Error("No config doc specified");
    }

    try {
      const events = await syncService
        .syncMaps()(process.env.NEXT_PUBLIC_EVENTS_MAP)
        .fetch();
      const items = await events.syncMapItems().list();

      return (
        <>
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-twilio-ink tracking-tight">Events</h2>
            <p className="text-sm text-gray-500 mt-1">Select an event to manage orders</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 select-none">
            {items.map((item) => {
              return (
                <EventCard
                  // @ts-ignore  thinks is a object but actually it's a string
                  key={item.data.slug}
                  // @ts-ignore  thinks is a object but actually it's a string
                  title={item.data.name}
                  // @ts-ignore  thinks is a object but actually it's a string
                  slug={item.data.slug}
                  isAdmin={isAdmin}
                />
              );
            })}
            {isAdmin && (
              <Link
                className="flex items-center justify-center rounded-xl border-2 border-dashed border-warm-strong hover:border-twilio-red hover:bg-red-50 transition-colors min-h-[140px] group"
                href="/event/new"
              >
                <div className="flex flex-col items-center gap-2 text-gray-400 group-hover:text-twilio-red transition-colors">
                  <div className="w-8 h-8 rounded-full border-2 border-current flex items-center justify-center text-xl font-light">+</div>
                  <span className="text-sm font-medium">New Event</span>
                </div>
              </Link>
            )}
          </div>
        </>
      );
    } catch (e: any) {
      console.error(e);
      throw new Error("Could not fetch events", e);
    }
  } catch {
    return <p>Couldn&rsquo;t connect to Twilio Sync store</p>;
  }
}
