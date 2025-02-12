"use server";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const {
      getVerifyService,
      getMessagingService,
      getSyncService,
      getConversationService,
    } = await import("@/lib/twilio");
    const { updateConfig } = await import("@/scripts/updateConfig");
    await import("@/scripts/createTwilioRes"); // this automatically run const createTwilioRes()

    await checkIfAllEnvVarsAreSet();

    //Check Twilio Resources
    try {
      await getVerifyService();
      await getMessagingService();
      await getSyncService();
      await getConversationService();
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
    "TWILIO_CONVERSATIONS_SERVICE_SID",
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
}
