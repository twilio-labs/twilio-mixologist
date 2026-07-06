"use server";

import AccessToken, { SyncGrant } from "twilio/lib/jwt/AccessToken";
import { headers } from "next/headers";
import { getAuthenticatedRole } from "@/proxy";
import { TWILIO_ACCOUNT_SID, TWILIO_API_KEY, TWILIO_API_SECRET } from "./client";

const { TWILIO_SYNC_SERVICE_SID = "" } = process.env;

export async function createToken() {
  const headersList = await headers();
  const role = getAuthenticatedRole(headersList.get("Authorization") || "");
  const syncGrant = new SyncGrant({
    serviceSid: TWILIO_SYNC_SERVICE_SID,
  });

  const token = new AccessToken(
    TWILIO_ACCOUNT_SID,
    TWILIO_API_KEY,
    TWILIO_API_SECRET,
    { identity: role },
  );
  token.addGrant(syncGrant);
  return token.toJwt();
}
