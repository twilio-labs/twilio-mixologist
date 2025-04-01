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
  let customerPage = await client.sync.v1
    .services(TWILIO_SYNC_SERVICE_SID)
    .syncMaps("ActiveCustomers")
    .syncMapItems.page({ pageSize: 200 });

  let counter = 0;

  while (customerPage && customerPage.instances.length > 0) {
    customerPage.instances.map((item) => {
      counter++;
      throttle(async () => {
        return client.sync.v1
          .services(TWILIO_SYNC_SERVICE_SID)
          .syncMaps("ActiveCustomers")
          .syncMapItems(item.key)
          .remove();
      });
    });

    // @ts-ignore
    customerPage = await customerPage.nextPage();
  }

  throttle(() => {
    console.log(`Removed ${counter} attendees`);
  });
})();
