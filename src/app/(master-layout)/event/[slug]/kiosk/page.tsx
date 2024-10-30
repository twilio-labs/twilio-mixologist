import { Privilege } from "@/middleware";
import { cookies } from "next/headers";
import OrderForm from "./order-form";
import { getSyncService } from "@/lib/twilio";

export default async function KioskPage({
  params,
}: {
  params: { slug: string };
}) {
  const cookieStore = cookies();
  const hasPermissions = [Privilege.ADMIN, Privilege.KIOSK].includes(
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

    const event = items.find((item) => item.data.slug === params.slug);

    return (
      <main className="p-4 md:p-6 lg:p-8 space-y-8 flex-1">
        <h1 className="text-3xl font-bold">Kiosk</h1>
        {hasPermissions && (
          <OrderForm
            eventSlug={params.slug}
            askForSender={true}
            showToast={true}
            selection={event?.data.selection}
          />
        )}
        {!hasPermissions && <p>Unauthorized</p>}
      </main>
    );
  } catch (e: any) {
    console.error(e);
    throw new Error("Could not fetch events", e);
  }
}
