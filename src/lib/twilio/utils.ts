"use server";

import { validateRequest } from "twilio";
import { TWILIO_AUTH_TOKEN, PUBLIC_BASE_URL } from "./client";

/**
 * Checks the X-Twilio-Signature of a webhook request. Twilio signs the URL configured
 * in the Console, which can differ from the URL this server sees behind a proxy or a
 * tunnel (http instead of https, an internal host), so the URL built from
 * PUBLIC_BASE_URL is tried first, then the URL as received.
 *
 * Fails closed: no signature, or no TWILIO_AUTH_TOKEN to check it with, is invalid.
 */
export async function checkSignature(
  signature: string | null,
  url: string,
  formData?: FormData,
) {
  if (!signature) return false;
  if (!TWILIO_AUTH_TOKEN) {
    console.error(
      "TWILIO_AUTH_TOKEN is not set, so Twilio webhook signatures can't be checked; rejecting the request.",
    );
    return false;
  }

  const params: Record<string, string> = {};
  formData?.forEach((value, key) => {
    if (typeof value === "string") params[key] = value;
  });

  return signedUrlCandidates(url).some((candidate) =>
    validateRequest(TWILIO_AUTH_TOKEN, signature, candidate, params),
  );
}

function signedUrlCandidates(url: string): string[] {
  const candidates = [url];
  if (PUBLIC_BASE_URL) {
    const { pathname, search } = new URL(url);
    candidates.unshift(
      `${PUBLIC_BASE_URL.replace(/\/+$/, "")}${pathname}${search}`,
    );
  }
  return [...new Set(candidates)];
}
