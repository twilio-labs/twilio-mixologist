"use server";

import { updateSyncMapItem } from "@/lib/twilio";
import { headers } from "next/headers";
import { Privilege, getAuthenticatedRole } from "@/proxy";

const NEXT_PUBLIC_EVENTS_MAP = process.env.NEXT_PUBLIC_EVENTS_MAP || "";

export async function PUT(
  request: Request,
  props: { params: Promise<{ slug: string }> },
) {
  const [params, headersList, body] = await Promise.all([
    props.params,
    headers(),
    request.json(),
  ]);
  const role = getAuthenticatedRole(headersList.get("Authorization") || "");

  if (role !== Privilege.MIXOLOGIST && role !== Privilege.ADMIN) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    await updateSyncMapItem(NEXT_PUBLIC_EVENTS_MAP, params.slug, {
      selection: body.selection,
    });
  } catch (e: any) {
    console.error(e);
    if (e?.status === 404) {
      return new Response(null, { status: 404 });
    }
    return new Response(null, { status: 500 });
  }

  return new Response(null, { status: 200 });
}
