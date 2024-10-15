// Copyright (c) 2024 Twilio Inc.

import { Card } from "@/components/ui/card";
import EventCard from "@/components/event-card";
import { Button } from "@/components/ui/button";
import { Privilege } from "@/middleware";
import Link from "next/link";
import { cookies } from "next/headers";
import { getSyncService } from "@/lib/twilio";

export default async function Home() {
  const cookieStore = cookies();
  const isAdmin = [Privilege.ADMIN].includes(
    cookieStore.get("privilege")?.value as Privilege,
  );

  if (!process.env.NEXT_PUBLIC_EVENTS_MAP) {
    throw new Error("No config doc specified");
  }

  const syncService = await getSyncService();
  try {
    const events = await syncService
      .syncMaps()(process.env.NEXT_PUBLIC_EVENTS_MAP)
      .fetch();
    const items = await events.syncMapItems().list();

    return (
      <>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 select-none">
          {items.map((item) => {
            return (
              <EventCard
                key={item.data.slug}
                title={item.data.name}
                slug={item.data.slug}
                isAdmin={isAdmin}
              />
            );
          })}
          {isAdmin && (
            <Card className="w-full bg-blue-100 hover:bg-blue-200 flex">
              <Link
                className="flex-1 flex items-center justify-center"
                href="/event/new"
              >
                <Button variant="default">+ Create New Event</Button>
              </Link>
            </Card>
          )}
        </div>
      </>
    );
  } catch (e: any) {
    console.error(e);
    throw new Error("Could not fetch events", e);
  }
}
