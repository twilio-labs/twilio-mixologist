export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const {
      getVerifyService,
      getMessagingService,
      getSyncService,
    } = await import("@/lib/twilio");
    const { updateConfig } = await import("@/scripts/updateConfig");
    await import("@/scripts/createTwilioRes"); // this automatically runs const createTwilioRes()

    await checkIfAllEnvVarsAreSet();

    //Check Twilio Resources
    try {
      await getVerifyService();
      await getMessagingService();
      await getSyncService();
      await updateConfig();
    } catch (e: any) {
      throw new Error(e.message);
    }
  }
}

async function checkIfAllEnvVarsAreSet() {
  const envVarName = [
    "TWILIO_ACCOUNT_SID",
    "TWILIO_API_KEY",
    "TWILIO_API_SECRET",
    "TWILIO_SYNC_SERVICE_SID",
    "TWILIO_MESSAGING_SERVICE_SID",
    "TWILIO_VERIFY_SERVICE_SID",
  ];
  const missingEnvVars = envVarName.filter((envVar) => !process.env[envVar]);
  if (missingEnvVars.length > 0) {
    throw new Error(
      `The following environment variables are missing: ${missingEnvVars.join(
        ", ",
      )}`,
    );
  }

  // Needed to verify X-Twilio-Signature on inbound messages. Without them the
  // app starts fine but rejects every real message from Twilio with a 403.
  const webhookVars = ["TWILIO_AUTH_TOKEN", "PUBLIC_BASE_URL"];
  const missingWebhookVars = webhookVars.filter((v) => !process.env[v]);
  if (missingWebhookVars.length > 0) {
    const message =
      `Inbound messages will be rejected: ${missingWebhookVars.join(", ")} ` +
      `not set (needed to verify Twilio webhook signatures).`;
    // Fail a real deployment at startup instead of at the first inbound text.
    // CI runs the production build but never receives Twilio webhooks.
    if (process.env.NODE_ENV === "production" && !process.env.CI) {
      throw new Error(message);
    }
    console.warn(message);
  }
}
