import { headers } from "next/headers";

import { fetchSyncListItems, addMessageToConversation } from "@/lib/twilio";
import { Privilege, getAuthenticatedRole } from "@/middleware";
import { sleep } from "@/lib/utils";

export async function POST(
  request: Request,
  { params }: { params: { slug: string } },
) {
  const headersList = headers();
  const role = getAuthenticatedRole(headersList.get("Authorization") || "");

  const hasPermissions =
    Privilege.ADMIN === role || Privilege.MIXOLOGIST === role;
  if (
    !process.env.NEXT_PUBLIC_EVENTS_MAP ||
    !process.env.NEXT_PUBLIC_ACTIVE_CUSTOMERS_MAP
  ) {
    console.error("No config doc specified");
    return new Response("No config doc specified", {
      status: 500,
      statusText: "No config doc specified",
    });
  }
  if (!hasPermissions) {
    console.error("Not authorized");
    return new Response(
      `Role ${role} is not authorized to perform this action`,
      {
        status: 500,
        statusText: `Role ${role} is not authorized to perform this action`,
      },
    );
  }

  const { message } = await request.json();
  const event = params.slug;
  try {
    const listItems = await fetchSyncListItems(event);
    const queuedOrders = listItems.filter(
      (listItem) =>
        listItem.data?.status === "queued" || listItem.data?.status === "ready",
    );

    queuedOrders.forEach((order) => {
      addMessageToConversation(order.data.key, message);
    });

    return new Response(null, { status: 201 });
  } catch (e: any) {
    console.error(e);
    return new Response(e.message, { status: 500, statusText: e.message });
  }
}
