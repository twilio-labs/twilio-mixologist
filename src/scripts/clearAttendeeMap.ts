import twilio from "twilio";
import throttledQueue from "throttled-queue";

const {
  TWILIO_API_KEY = "",
  TWILIO_API_SECRET = "",
  TWILIO_ACCOUNT_SID = "",
  TWILIO_SYNC_SERVICE_SID = "",
} = process.env;

const throttle = throttledQueue(20, 1000); // 20 requests per second
const client = twilio(TWILIO_API_KEY, TWILIO_API_SECRET, {
  accountSid: TWILIO_ACCOUNT_SID,
});

(async () => {
  //fetch all attendees and write to csv file with header columns
  const mapItems = await client.sync.v1
    .services(TWILIO_SYNC_SERVICE_SID)
    .syncMaps("ActiveCustomers")
    .syncMapItems.list({ limit: 1000 }); // TODO go over all users here, not just 1000, use pagination

  mapItems.map((item) => {
    throttle(async () => {
      return client.sync.v1
        .services(TWILIO_SYNC_SERVICE_SID)
        .syncMaps("ActiveCustomers")
        .syncMapItems(item.key)
        .remove();
    });
  });
  throttle(() => {
    console.log(`Removed ${mapItems.length} attendees`);
  });
})();
