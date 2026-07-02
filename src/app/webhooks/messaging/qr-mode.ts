// Copyright (c) 2025 Twilio Inc.

"use server";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { Jimp } = require("jimp") as { Jimp: any };
import { createRequire } from "module";
const _require = createRequire(import.meta.url);
// eslint-disable-next-line @typescript-eslint/no-require-imports
const jsQR = _require("jsqr") as typeof import("jsqr").default;
import axios from "axios";
import { TAC, TACConfig, MemoryClient } from "twilio-agent-connect";
import {
  sendMessage,
  updateOrCreateSyncMapItem,
} from "@/lib/twilio";
import { Stages, sleep, TwoWeeksInSeconds } from "@/lib/utils";
import { checkSegmentTraits } from "./segment";
import { lookupProfileByPhone, getProfileTraits, createBadgeProfile } from "./memory";
import { getReadyToOrderMessage } from "@/scripts/fetchContentTemplates";
import {
  eventLang,
  getDataPolicy,
  getModifiersMessage,
  modeToBeverage,
} from "@/lib/stringTemplates";
import type { Event } from "@/types";

const NEXT_PUBLIC_ATTENDEES_MAP =
  process.env.NEXT_PUBLIC_ATTENDEES_MAP || "";
const BADGE_API_URL =
  "https://wad-api.wearedevelopers.com/api/partner/v1/events/16/scan";
const BADGE_TICKET_PREFIX = "ti_";

function decodeImage(image: { bitmap: { data: Buffer; width: number; height: number } }): string | null {
  const { data, width, height } = image.bitmap;
  const code = jsQR(new Uint8ClampedArray(data), width, height);
  return code?.data ?? null;
}

function extractTicketId(raw: string): string {
  // Badge QR may encode a URL with ticket ID in a query param: ...?id=ti_xxx
  if (raw.includes("=")) {
    const qs = raw.includes("?") ? raw.split("?")[1] : raw;
    return new URLSearchParams(qs).get("id") ?? raw;
  }
  return raw;
}

async function decodeQrFromUrl(mediaUrl: string): Promise<string | null> {
  const { TWILIO_ACCOUNT_SID = "", TWILIO_AUTH_TOKEN = "" } = process.env;

  let rawBuffer: Buffer;
  try {
    const response = await axios.get<ArrayBuffer>(mediaUrl, {
      responseType: "arraybuffer",
      auth: { username: TWILIO_ACCOUNT_SID, password: TWILIO_AUTH_TOKEN },
    });
    rawBuffer = Buffer.from(response.data);
  } catch {
    return null;
  }

  let base: any;
  try {
    base = await Jimp.fromBuffer(rawBuffer);
  } catch {
    return null;
  }

  const width: number = base.bitmap.width;
  const attempts: Array<() => any> = [
    () => base.clone(),
    () => base.clone().normalize(),
    () => base.clone().greyscale().normalize(),
    ...(width > 1200 ? [() => base.clone().resize({ w: 1200 }).normalize()] : []),
    ...(width > 800 ? [() => base.clone().resize({ w: 800 }).greyscale().normalize()] : []),
    ...(width > 400 ? [() => base.clone().resize({ w: 400 }).greyscale().normalize()] : []),
    ...(width > 300 ? [() => base.clone().resize({ w: 300 }).greyscale().normalize()] : []),
  ];

  for (const prepare of attempts) {
    try {
      const raw = decodeImage(prepare());
      if (raw) return extractTicketId(raw);
    } catch { /* try next */ }
  }

  return null;
}

async function fetchBadgeData(
  ticketCode: string,
): Promise<{ firstName?: string; lastName?: string; email?: string; company?: string; jobTitle?: string; country?: string } | null> {
  const BADGE_API_KEY = process.env.BADGE_API_KEY || "";
  if (!BADGE_API_KEY) return null;
  try {
    const res = await fetch(BADGE_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${BADGE_API_KEY}`,
      },
      body: JSON.stringify({ ticket_code: ticketCode }),
    });
    if (!res.ok) {
      console.error(`Badge API error: ${res.status}`);
      return null;
    }
    const d = await res.json() as {
      first_name?: string; last_name?: string; email?: string;
      job_position?: string; company?: string; country?: string;
    };
    return {
      firstName: d.first_name,
      lastName: d.last_name,
      email: d.email,
      jobTitle: d.job_position,
      company: d.company,
      country: d.country,
    };
  } catch (e: any) {
    console.error("Badge API error:", e.message);
    return null;
  }
}

async function sendReadyToOrder(
  sender: string,
  event: Event,
  isReturning: boolean,
) {
  const message = await getReadyToOrderMessage(
    event,
    event.selection.items,
    event.maxOrders,
    isReturning,
    eventLang(event),
  );
  sendMessage(
    sender,
    "",
    message.contentSid,
    message.contentVariables,
  );
  if (event.selection.modifiers.length > 1) {
    await sleep(1500);
    sendMessage(
      sender,
      getModifiersMessage(event.selection.modifiers, eventLang(event)),
    );
  }
}

export async function handleQrMode(
  phone: string,
  attendeeRecord: any,
  memoryClient: MemoryClient,
  event: Event,
  incomingMessageBody: string,
  mediaUrl: string | null,
  sender: string,
): Promise<void> {
  // Step 1: check Memory store — known attendees go straight to menu
  const existingProfileId = await lookupProfileByPhone(memoryClient, phone);
  if (existingProfileId) {
    const [profile, segmentData] = await Promise.all([
      getProfileTraits(memoryClient, existingProfileId),
      checkSegmentTraits(attendeeRecord.email),
    ]);
    const firstName = (profile?.Contact as any)?.firstName as string | undefined;
    await updateOrCreateSyncMapItem(
      NEXT_PUBLIC_ATTENDEES_MAP,
      phone,
      { stage: Stages.VERIFIED_USER, profileId: existingProfileId, ...segmentData },
      TwoWeeksInSeconds,
    );
    sendMessage(
      sender,
      firstName ? `Welcome back, ${firstName}! 👋` : "Welcome back! 👋",
    );
    await sleep(500);
    await sendReadyToOrder(sender, event, true);
    await sleep(2000);
    sendMessage(
      sender,
      getDataPolicy(event.selection.mode, eventLang(event)),
    );
    return;
  }

  // Step 2: unknown attendee — need their badge QR
  if (!mediaUrl) {
    sendMessage(
      sender,
      `To get started, please send a photo of your event badge QR code.\n\n_Your data will only be used to personalise your experience at this event and deleted afterwards._`,
    );
    return;
  }

  // Step 3: try to decode QR from the photo
  const qrData = await decodeQrFromUrl(mediaUrl);
  if (!qrData) {
    sendMessage(
      sender,
      "I couldn't scan a QR code from that image. Please make sure your badge QR code is clearly visible, well-lit and in focus, then try again.",
    );
    return;
  }

  // Step 4: validate it's a WeAreDevelopers badge code
  if (!qrData.startsWith(BADGE_TICKET_PREFIX)) {
    sendMessage(
      sender,
      "I scanned a QR code but it doesn't look like a WeAreDevelopers ticket. Are you sure you scanned the QR code on your badge and not another one? Please try again with your event badge.",
    );
    return;
  }

  // Step 5: fetch badge data from the event API
  const badgeData = await fetchBadgeData(qrData);
  if (!badgeData) {
    sendMessage(
      sender,
      "I could read your badge QR code but couldn't retrieve your details from the event system. Please ask a Twilio team member for help.",
    );
    return;
  }


  const firstName = badgeData.firstName?.trim() || undefined;
  const fullName = [badgeData.firstName, badgeData.lastName].filter(Boolean).join(" ").trim() || undefined;

  // Step 6: create Memory profile and update Sync
  const [profileId, segmentData] = await Promise.all([
    createBadgeProfile(memoryClient, phone, {
      firstName: badgeData.firstName,
      lastName: badgeData.lastName,
      email: badgeData.email,
      country: badgeData.country,
    }).catch((e) => { console.error("Memory profile creation error:", e); return null; }),
    checkSegmentTraits(badgeData.email),
  ]);

  await updateOrCreateSyncMapItem(
    NEXT_PUBLIC_ATTENDEES_MAP,
    phone,
    {
      stage: Stages.VERIFIED_USER,
      ...(fullName ? { fullName } : {}),
      ...(badgeData.email ? { email: badgeData.email } : {}),
      ...(badgeData.company ? { company: badgeData.company } : {}),
      ...(badgeData.jobTitle ? { jobTitle: badgeData.jobTitle } : {}),
      ...(badgeData.country ? { country: badgeData.country } : {}),
      profileId: profileId ?? undefined,
      ...segmentData,
    },
    TwoWeeksInSeconds,
  );

  const beverage = modeToBeverage(event.selection.mode, eventLang(event));
  const confirmation = firstName
    ? `That worked, ${firstName}! Which ${beverage} would you like to order?`
    : `That worked! Which ${beverage} would you like to order?`;
  sendMessage(sender, confirmation);
  await sleep(300);
  await sendReadyToOrder(sender, event, true); // true = use _without_email template variant
  await sleep(2000);
  sendMessage(
    sender,
    getDataPolicy(event.selection.mode, eventLang(event)),
  );
}

export async function createQrModeMemoryClient(): Promise<MemoryClient | null> {
  const { TWILIO_MEMORY_STORE_ID = "" } = process.env;
  if (!TWILIO_MEMORY_STORE_ID) return null;
  try {
    const tacConfig = TACConfig.fromEnv();
    const tac = await TAC.create({ config: tacConfig });
    return tac.getMemoryClient();
  } catch (e) {
    console.error("Failed to create TAC memory client:", e);
    return null;
  }
}
