// Copyright (c) 2025 Twilio Inc.

import { fetchSegmentTraits } from "@/lib/twilio";

export type { SegmentData } from "@/types";
import type { SegmentData } from "@/types";

export async function checkSegmentTraits(
  email: string | undefined,
): Promise<SegmentData> {
  const {
    SEGMENT_SPACE_ID = "",
    SEGMENT_PROFILE_KEY = "",
    SEGMENT_TRAIT_CHECK = "",
  } = process.env;
  if (
    !SEGMENT_SPACE_ID ||
    !SEGMENT_PROFILE_KEY ||
    !SEGMENT_TRAIT_CHECK ||
    !email
  ) {
    return { foundInSegment: false };
  }
  try {
    const traits = await fetchSegmentTraits(email, SEGMENT_TRAIT_CHECK);
    if (traits) {
      return {
        foundInSegment: true,
        [SEGMENT_TRAIT_CHECK]: traits[SEGMENT_TRAIT_CHECK],
      };
    }
  } catch (e) {
    console.error("Error fetching Segment traits:", e);
  }
  return { foundInSegment: false };
}
