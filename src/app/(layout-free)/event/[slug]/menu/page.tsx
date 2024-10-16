import { Event } from "@/app/(master-layout)/event/[slug]/page";
import MenuItem from "./menu-item";
import Header from "./header";
import { getSyncService } from "@/lib/twilio";

async function MenuPage({ params }: { params: { slug: string } }) {
  if (!process.env.NEXT_PUBLIC_EVENTS_MAP) {
    throw new Error("No config doc specified");
  }

  const syncService = await getSyncService();
  try {
    const events = await syncService
      .syncMaps()(process.env.NEXT_PUBLIC_EVENTS_MAP)
      .fetch();
    const items = await events.syncMapItems().list();

    // @ts-ignore
    const internalEvent: Event = items.find(
      (item: any) => item.data.slug === params.slug,
    ).data;

    if (!internalEvent) {
      return <div>Event not found</div>;
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
  } catch (e: any) {
    console.error(e);
    throw new Error("Could not fetch events", e);
  }
}

export default MenuPage;
