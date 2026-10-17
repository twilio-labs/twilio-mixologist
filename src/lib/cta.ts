import { modes } from "@/types";

export const MODE_COPY: Record<modes, { noun: string; emoji: string }> = {
  [modes.barista]: { noun: "coffee", emoji: "☕️" },
  [modes.smoothie]: { noun: "smoothie", emoji: "🥤" },
  [modes.cocktail]: { noun: "cocktail", emoji: "🍸" },
  [modes.tea]: { noun: "tea", emoji: "🍵" },
  [modes.waffles]: { noun: "waffle", emoji: "🧇" },
};

const CTA_OPENER_EN = "Send this message to order";

export function buildDefaultCta(mode: modes, eventName: string): string {
  const { noun, emoji } = MODE_COPY[mode];
  const trimmed = eventName.trim();
  const suffix = trimmed ? ` at ${trimmed}` : "";
  return `${CTA_OPENER_EN} a ${noun}${suffix} ${emoji}`;
}

// Prefixes to detect returning attendees who re-tap the QR/CTA link. The
// English entry is derived from CTA_OPENER_EN so the generator and the match
// can never drift. Other locales are observed-in-field (pt-BR) or anticipated
// (fr) translations attendees may send; they stay as literals since
// buildDefaultCta itself is English-only today.
export const REORDER_CTA_PREFIXES = [
  CTA_OPENER_EN.toLowerCase(),
  "envie esta mensagem para pedir", // pt-BR, observed at Conarec 2026
  "envoyez ce message pour commander", // fr formal
  "envoie ce message pour commander", // fr informal
];

export function isReorderCta(body: string): boolean {
  const normalized = body.trim().toLowerCase();
  return REORDER_CTA_PREFIXES.some((p) => normalized.startsWith(p));
}
