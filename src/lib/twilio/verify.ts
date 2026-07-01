"use server";

import { twilioClient } from "./client";

const { TWILIO_VERIFY_SERVICE_SID = "" } = process.env;

export async function getVerifyService() {
  if (!TWILIO_VERIFY_SERVICE_SID) {
    throw new Error("Missing sid for for verify service");
  }
  return twilioClient.verify.v2.services(TWILIO_VERIFY_SERVICE_SID);
}

export async function createVerification(to: string, eventName: string) {
  const verifyService = await getVerifyService();
  const verification = await verifyService.verifications.create({
    to,
    channel: "email",
    channelConfiguration: {
      substitutions: {
        "event-name": eventName,
      },
    },
  });
  return verification;
}

export async function checkVerification(verificationSid: string, code: string) {
  const verifyService = await getVerifyService();
  const verificationCheck = await verifyService.verificationChecks.create({
    verificationSid,
    code,
  });
  return verificationCheck;
}
