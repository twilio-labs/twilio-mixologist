// Central registry of all server-side environment variables.
// Access env vars via this module rather than destructuring process.env inline.
// NEXT_PUBLIC_* vars are intentionally excluded — Next.js inlines those at
// build time and they're accessed directly in client components.

export const env = {
  // Twilio core credentials
  twilioApiKey: process.env.TWILIO_API_KEY ?? "",
  twilioApiSecret: process.env.TWILIO_API_SECRET ?? "",
  twilioAuthToken: process.env.TWILIO_AUTH_TOKEN ?? "",
  twilioAccountSid: process.env.TWILIO_ACCOUNT_SID ?? "",

  // Twilio service SIDs
  twilioSyncServiceSid: process.env.TWILIO_SYNC_SERVICE_SID ?? "",
  twilioVerifyServiceSid: process.env.TWILIO_VERIFY_SERVICE_SID ?? "",
  twilioMessagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID ?? "",
  twilioMemoryStoreId: process.env.TWILIO_MEMORY_STORE_ID ?? "",

  // App config
  publicBaseUrl: process.env.PUBLIC_BASE_URL ?? "",
  serviceInstancePrefix: process.env.SERVICE_INSTANCE_PREFIX ?? "",
  unlimitedOrders: (process.env.UNLIMITED_ORDERS ?? "").split(","),

  // Auth
  adminLogin: process.env.ADMIN_LOGIN ?? "",
  mixologistLogin: process.env.MIXOLOGIST_LOGIN ?? "",
  kioskLogin: process.env.KIOSK_LOGIN ?? "",

  // Integrations
  openaiApiKey: process.env.OPENAI_API_KEY ?? "",
  badgeApiKey: process.env.BADGE_API_KEY ?? "",
  segmentSpaceId: process.env.SEGMENT_SPACE_ID ?? "",
  segmentProfileKey: process.env.SEGMENT_PROFILE_KEY ?? "",
  segmentTraitCheck: process.env.SEGMENT_TRAIT_CHECK ?? "",
} as const;
