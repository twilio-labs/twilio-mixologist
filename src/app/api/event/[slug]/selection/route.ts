"use server";

import { updateAiAssistant } from "@/lib/twilio";
import { headers } from "next/headers";
import { Privilege, getAuthenticatedRole } from "@/middleware";

export async function PUT(
  request: Request,
  props: { params: Promise<{ slug: string }> },
) {
  const [params, headersList, unfilteredData] = await Promise.all([
    props.params,
    headers(),
    request.json(),
  ]);
  const role = getAuthenticatedRole(headersList.get("Authorization") || "");

  if (role !== Privilege.MIXOLOGIST && role !== Privilege.ADMIN) {
    return new Response("Unauthorized", { status: 401 });
  }

  const selection = unfilteredData.selection,
    assistantId = unfilteredData.assistantId;

  try {
    // @ts-ignore, is not a full event object
    await updateAiAssistant(assistantId, { selection, slug: params.slug });
  } catch (e: any) {
    console.error(e);
    if (e?.status === 404) {
      return new Response(null, { status: 404 });
    }
    return new Response(null, { status: 500 });
  }

  return new Response(null, { status: 200 });
}
