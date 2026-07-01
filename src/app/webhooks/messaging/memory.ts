// Copyright (c) 2025 Twilio Inc.

import type { MemoryClient } from "twilio-agent-connect";

export async function lookupProfileByPhone(
  client: MemoryClient,
  phone: string,
): Promise<string | null> {
  try {
    const result = await client.lookupProfile("phone", phone);
    return result.profiles.length > 0 ? result.profiles[0] : null;
  } catch {
    return null;
  }
}

export async function getProfileTraits(
  client: MemoryClient,
  profileId: string,
): Promise<Record<string, unknown> | null> {
  try {
    const profile = await client.getProfile(profileId);
    if (!profile.traits || Object.keys(profile.traits).length === 0) return null;
    return profile.traits;
  } catch {
    return null;
  }
}

export async function createBadgeProfile(
  client: MemoryClient,
  phone: string,
  badge: { firstName?: string; lastName?: string; email?: string; country?: string },
): Promise<string> {
  return client.createProfile({
    Contact: {
      phone,
      ...(badge.firstName ? { firstName: badge.firstName } : {}),
      ...(badge.lastName ? { lastName: badge.lastName } : {}),
      ...(badge.email ? { email: badge.email } : {}),
      ...(badge.country ? { country: badge.country } : {}),
    },
  });
}

export async function deleteMemoryProfile(
  profileId: string,
): Promise<void> {
  const {
    TWILIO_ACCOUNT_SID = "",
    TWILIO_AUTH_TOKEN = "",
    TWILIO_MEMORY_STORE_ID = "",
  } = process.env;

  if (!TWILIO_MEMORY_STORE_ID) return;

  const credentials = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString("base64");
  const url = `https://memory.twilio.com/v1/Stores/${TWILIO_MEMORY_STORE_ID}/Profiles/${profileId}`;
  const res = await fetch(url, {
    method: "DELETE",
    headers: { Authorization: `Basic ${credentials}` },
  });
  if (!res.ok && res.status !== 404) {
    throw new Error(`Failed to delete Memory profile: ${res.status} ${res.statusText}`);
  }
}
