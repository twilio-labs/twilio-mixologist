import { updateSyncMapItem } from "@/lib/twilio";
import throttledQueue from "throttled-queue";
import twilio from "twilio";

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

const eventName = process.argv.pop();

if (!eventName || eventName.startsWith("/") || eventName.includes("=")) {
  console.error(
    "Please provide an event name as the last argument, e.g. 'pnpm clear-orders wearedevs24'",
  );
  process.exit(1);
}

(async () => {
  try {
    await updateSyncMapItem("Events", eventName, {
      cancelledCount: 0,
      deliveredCount: 0,
    });
  } catch (e: any) {
    if (e.code === 20404) {
      console.error(`Event ${eventName} not found`);
      process.exit(0);
    }
    console.error(e);
  }

  console.log(
    `Reset event stats "cancelledCount" and "deliveredCount" for ${eventName}`,
  );

  let orderPage = await client.sync.v1
    .services(TWILIO_SYNC_SERVICE_SID)
    .syncLists(eventName)
    .syncListItems.page({ pageSize: 200 });

  let counter = 0;

  while (orderPage && orderPage.instances.length > 0) {
    orderPage.instances.map((item) => {
      counter++;
      throttle(async () => {
        return client.sync.v1
          .services(TWILIO_SYNC_SERVICE_SID)
          .syncLists(eventName)
          .syncListItems(item.index)
          .remove();
      });
    });

    // @ts-ignore
    orderPage = await orderPage.nextPage();
  }

  throttle(() => {
    console.log(`All ${counter} orders removed for ${eventName}`);
  });
})();
