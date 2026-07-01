import twilio from "twilio";
import { env } from "@/config/env";

export const {
  twilioApiKey: TWILIO_API_KEY,
  twilioAuthToken: TWILIO_AUTH_TOKEN,
  twilioApiSecret: TWILIO_API_SECRET,
  twilioAccountSid: TWILIO_ACCOUNT_SID,
  publicBaseUrl: PUBLIC_BASE_URL,
} = env;

export const twilioClient = twilio(TWILIO_API_KEY, TWILIO_API_SECRET, {
  accountSid: TWILIO_ACCOUNT_SID,
});
