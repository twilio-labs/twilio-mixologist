// This route is for development purposes only
// it allows you to clear the privilege cookie

import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = await cookies();
  cookieStore.delete("privilege");
  redirect(`/`);
}
