import { Privilege } from "@/middleware";
import { cookies } from "next/headers";
import { getSyncService } from "@/lib/twilio";
import OrderForm from "@/app/(master-layout)/event/[slug]/orders/order-form";

export default async function KioskPage(props: {
  params: Promise<{ slug: string }>;
}) {
  const [cookieStore, params, syncService] = await Promise.all([
    cookies(),
    props.params,
    getSyncService(),
  ]);
  const hasPermissions = [Privilege.ADMIN, Privilege.KIOSK].includes(
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

    const event = items.find((item) => item.data.slug === params.slug);

    return (
      <div className="p-4 space-y-8 flex-1">
        <p className="text-4xl">
          Order your beverage here and pick it up at the Twilio booth.
        </p>
        {hasPermissions && (
          <OrderForm
            askForSender={true}
            showToast={true}
            eventSlug={params.slug}
            selection={event?.data.selection}
          />
        )}
        {!hasPermissions && <p className="text-4xl">Unauthorized</p>}
      </div>
    );
  } catch (e: any) {
    console.error(e);
    throw new Error("Could not fetch events", e);
  }
}
