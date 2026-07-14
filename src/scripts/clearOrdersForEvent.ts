import { updateSyncMapItem } from "@/lib/twilio";
import { throttledQueue, RetryError } from "throttled-queue";
import twilio from "twilio";
import { isRateLimited } from "./rateLimitUtils";

const {
  TWILIO_API_KEY = "",
  TWILIO_API_SECRET = "",
  TWILIO_ACCOUNT_SID = "",
  TWILIO_SYNC_SERVICE_SID = "",
} = process.env;

// evenlySpaced avoids bursting requests at once, which trips Twilio's
// per-list write rate limit even though the 1s average is within it.
const throttle = throttledQueue({ maxPerInterval: 10, interval: 1000, evenlySpaced: true });
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
        try {
          return await client.sync.v1
            .services(TWILIO_SYNC_SERVICE_SID)
            .syncLists(eventName)
            .syncListItems(item.index)
            .remove();
        } catch (e) {
          if (isRateLimited(e)) {
            throw new RetryError({ pauseQueue: true });
          }
          throw e;
        }
      }).catch((e) => {
        console.error(`Failed to remove order ${item.index} after retries:`, e);
      });
    });

    // @ts-ignore
    orderPage = await orderPage.nextPage();
  }

  throttle(() => {
    console.log(`All ${counter} orders removed for ${eventName}`);
  });
})();
