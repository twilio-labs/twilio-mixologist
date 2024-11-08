"use server";

import { headers } from "next/headers";
import { getAuthenticatedRole, Privilege } from "@/middleware";
import { calcStatsForEvent } from "./helper";

export async function GET(
  request: Request,
  props: { params: Promise<{ slug: string }> },
): Promise<Response> {
  const [params, headersList] = await Promise.all([props.params, headers()]);
  const role = getAuthenticatedRole(headersList.get("Authorization") || "");

  if (role !== Privilege.ADMIN) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (
    !process.env.NEXT_PUBLIC_CONFIG_DOC ||
    !process.env.NEXT_PUBLIC_EVENTS_MAP ||
    !process.env.NEXT_PUBLIC_ACTIVE_CUSTOMERS_MAP
  ) {
    return new Response("No config doc specified", { status: 500 });
  }

  try {
    const stats = await calcStatsForEvent(params.slug);
    return Response.json(stats);
  } catch (e: any) {
    console.error(e);
    if (e?.status === 404) {
      return new Response(null, { status: 404 });
    }
    return new Response(null, { status: 500 });
  }
}
