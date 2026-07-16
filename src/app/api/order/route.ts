import { headers } from "next/headers";

import { pushToSyncList } from "@/lib/twilio";
import { getAuthenticatedRole, Privilege } from "@/proxy";
import { getEvent } from "@/app/webhooks/mixologist-helper";
import { EventState } from "@/lib/utils";

export async function POST(request: Request) {
  const [headersList, data] = await Promise.all([headers(), request.json()]);
  const role = getAuthenticatedRole(headersList.get("Authorization") || "");

  const isPrivileged = [
    Privilege.ADMIN,
    Privilege.MIXOLOGIST,
    Privilege.KIOSK,
  ].includes(role);

  if (!process.env.NEXT_PUBLIC_EVENTS_MAP) {
    console.error("No config doc specified");
    return new Response("No config doc specified", {
      status: 500,
      statusText: "No config doc specified",
    });
  }
  if (!isPrivileged) {
    console.error("Not authorized");
    return new Response(
      `Role ${role} is not authorized to perform this action`,
      {
        status: 500,
        statusText: `Role ${role} is not authorized to perform this action`,
      },
    );
  }

  const event = await getEvent(data.event);
  if (!event) {
    return new Response("Event not found", { status: 404, statusText: "Event not found" });
  }
  if (event.state === EventState.CLOSED) {
    return new Response("Event is closed", { status: 403, statusText: "Event is closed" });
  }

  let item;
  try {
    item = await pushToSyncList(data.event, {
      ...data.order,
      channel: "api",
    });
  } catch (e: any) {
    console.error(e);
    return new Response(e.message, { status: 500, statusText: e.message });
  }
  return new Response(JSON.stringify({ key: item.index }), { status: 201 });
}
