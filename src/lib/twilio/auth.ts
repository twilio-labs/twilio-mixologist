import AccessToken, { SyncGrant } from "twilio/lib/jwt/AccessToken";
import type { Privilege } from "@/proxy";
import { TWILIO_ACCOUNT_SID, TWILIO_API_KEY, TWILIO_API_SECRET } from "./client";

const { TWILIO_SYNC_SERVICE_SID = "" } = process.env;

/**
 * Mint a Sync token for an already-resolved role. Server-side only: callers
 * (see src/lib/actions.ts) are responsible for determining the role from the
 * request's Basic credentials, never from client input.
 */
export async function createToken(role: Privilege) {
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
