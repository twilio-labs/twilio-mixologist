import twilio from "twilio";
import { throttledQueue, RetryError } from "throttled-queue";
import { sendMessage } from "@/lib/twilio";
import { isRateLimited } from "./rateLimitUtils";

const {
  TWILIO_API_KEY = "",
  TWILIO_API_SECRET = "",
  TWILIO_ACCOUNT_SID = "",
  TWILIO_SYNC_SERVICE_SID = "",
} = process.env;

const MESSAGE = "Hello, this is a broadcast message from Twilio"; // TODO change this message to inform attendees about the event, i.e. "the coffee station moved upstairs"

const eventName = process.argv.pop();

if (!eventName || eventName.startsWith("/") || eventName.includes("=")) {
  console.error(
    "Please provide an event name as the last argument, e.g. 'pnpm broadcast wearedevs24'",
  );
  process.exit(1);
}

const client = twilio(TWILIO_API_KEY, TWILIO_API_SECRET, {
  accountSid: TWILIO_ACCOUNT_SID,
});
// evenlySpaced avoids bursting requests at once, which trips Twilio's rate limit
// even though the 1s average is within it.
const throttle = throttledQueue({ maxPerInterval: 10, interval: 1000, evenlySpaced: true });

(async () => {
  let attendeePage = await client.sync.v1
    .services(TWILIO_SYNC_SERVICE_SID)
    .syncMaps("Attendees")
    .syncMapItems.page({ pageSize: 200 });

  let counter = 0;

  while (attendeePage && attendeePage.instances.length > 0) {
    attendeePage.instances.map((item) => {
      // @ts-ignore  thinks is a object but actually it's a string
      if (item.data.event === eventName) {
        counter++;
        throttle(async () => {
          try {
            return await sendMessage(item.key, MESSAGE);
          } catch (e) {
            if (isRateLimited(e)) {
              throw new RetryError({ pauseQueue: true });
            }
            throw e;
          }
        }).catch((e) => {
          console.error(`Failed to send message to ${item.key} after retries:`, e);
        });
      }
    });

    // @ts-ignore
    attendeePage = await attendeePage.nextPage();
  }

  throttle(() => {
    console.log(`Sent ${counter} messages`);
  });
})();
