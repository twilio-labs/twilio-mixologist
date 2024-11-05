"use server";

import { updateSyncMapItem } from "@/lib/twilio";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { getSyncService } from "@/lib/twilio";
import { Privilege, getAuthenticatedRole } from "@/middleware";

const NEXT_PUBLIC_EVENTS_MAP = process.env.NEXT_PUBLIC_EVENTS_MAP || "";

export async function DELETE(request: Request) {
  const headersList = await headers();
  const role = getAuthenticatedRole(headersList.get("Authorization") || "");
  const isAdmin = Privilege.ADMIN === role;

  if (!NEXT_PUBLIC_EVENTS_MAP) {
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
  const slug = request.url.split("/").pop();

  if (!slug) {
    throw new Error("No slug specified");
  }

  const syncService = await getSyncService();
  try {
    await syncService
      .syncMaps()(NEXT_PUBLIC_EVENTS_MAP)
      .syncMapItems(slug)
      .remove();
    await syncService.syncLists()(slug).remove();
  } catch (e: any) {
    if (e.status !== 404) {
      // no need to clutter the logs with 404s, might be on purpose as, for example, during tests
      console.error(e);
    }
    return new Response(e.message, { status: 500 });
  }
  revalidatePath(`/`);
  return new Response(null, { status: 204 });
}

export async function PUT(
  request: Request,
  props: { params: Promise<{ slug: string }> },
) {
  const [headersList, params, unfilteredData] = await Promise.all([
    headers(),
    props.params,
    request.json(),
  ]);
  const role = getAuthenticatedRole(headersList.get("Authorization") || "");

  if (role !== Privilege.MIXOLOGIST && role !== Privilege.ADMIN) {
    return new Response("Unauthorized", { status: 401 });
  }

  const filteredData = Object.keys(unfilteredData)
    .filter((key) =>
      ["state", "cancelledCount", "deliveredCount"].includes(key),
    )
    .reduce((obj: any, key: string) => {
      obj[key] = unfilteredData[key];
      return obj;
    }, {});
  try {
    await updateSyncMapItem(NEXT_PUBLIC_EVENTS_MAP, params.slug, filteredData);
  } catch (e: any) {
    console.error(e);
    if (e?.status === 404) {
      return new Response(null, { status: 404 });
    }
    return new Response(null, { status: 500 });
  }

  return new Response(null, { status: 200 });
}
