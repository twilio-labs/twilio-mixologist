import { headers } from "next/headers";

import {
  createSyncMapItemIfNotExists,
  createSyncListIfNotExists,
} from "@/lib/twilio";
import { Privilege, getAuthenticatedRole } from "@/middleware";
import { revalidatePath } from "next/cache";

export async function POST(request: Request) {
  const [headersList, event] = await Promise.all([headers(), request.json()]);
  const role = getAuthenticatedRole(headersList.get("Authorization") || "");
  const isAdmin = Privilege.ADMIN === role;

  if (!process.env.NEXT_PUBLIC_EVENTS_MAP) {
    console.error("No config doc specified");
    return new Response("No config doc specified", {
      status: 500,
      statusText: "No config doc specified",
    });
  }
  if (!isAdmin) {
    console.error("Not authorized");
    return new Response(
      `Role ${role} is not authorized to perform this action`,
      {
        status: 500,
        statusText: `Role ${role} is not authorized to perform this action`,
      },
    );
  }

  //Validation
  if (
    event.name?.length < 4 ||
    event.name?.length > 20 ||
    event.maxOrders < 1 ||
    event.pickupLocation.length < 3 ||
    event.senders?.length! < 1 ||
    event.selection.items?.length < 1
  ) {
    const message = eventValidator(event);
    return new Response(message, { status: 400, statusText: message });
  }

  try {
    await createSyncMapItemIfNotExists(
      process.env.NEXT_PUBLIC_EVENTS_MAP,
      event.slug,
      event,
    );

    //Create Event Orders List
    await createSyncListIfNotExists(event.slug);
  } catch (e: any) {
    console.error(e);
    return new Response(e.message, { status: 500, statusText: e.message });
  }
  revalidatePath(`/`);
  return new Response(null, { status: 201 });
}

function eventValidator(event: any): string {
  if (event.name?.length < 4) {
    return "Event name must be at least 4 characters long";
  }
  if (event.name?.length > 20) {
    return "Event name must be 20 characters long or less";
  }
  if (event.maxOrders < 1) {
    return "Max orders must be at least 1";
  }
  if (event.pickupLocation.length < 3) {
    return "Pickup location must be at least 3 characters long";
  }
  if (event.senders?.length! < 1) {
    return "At least one sender must be selected";
  }
  if (event.selection.items?.length < 2) {
    return "At least two menu items must be selected";
  } else return "Something Went wrong";
}
