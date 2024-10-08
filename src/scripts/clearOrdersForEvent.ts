import { getSyncService, updateSyncMapItem } from "@/lib/twilio";
import twilio from "twilio";

const {
  TWILIO_API_KEY = "",
  TWILIO_API_SECRET = "",
  TWILIO_ACCOUNT_SID = "",
  TWILIO_SYNC_SERVICE_SID = "",
} = process.env;

const client = twilio(TWILIO_API_KEY, TWILIO_API_SECRET, {
  accountSid: TWILIO_ACCOUNT_SID,
});

const eventName = "wwc-2024";

(async () => {
  await updateSyncMapItem("Events", eventName, {
    cancelledCount: 0,
    deliveredCount: 0,
  });

  console.log(
    `Reset event stats "cancelledCount" and "deliveredCount" for ${eventName}`,
  );

  const orderItems = await client.sync.v1
    .services(TWILIO_SYNC_SERVICE_SID)
    .syncLists(eventName)
    .syncListItems.list({ limit: 1000 });
  await Promise.all(
    orderItems.map(async (item) => {
      await client.sync.v1
        .services(TWILIO_SYNC_SERVICE_SID)
        .syncLists(eventName)
        .syncListItems(item.index)
        .remove();
    }),
  );

  console.log(`All ${orderItems.length} orders removed for ${eventName}`);
})();
