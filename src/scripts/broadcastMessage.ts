import twilio from "twilio";
import throttledQueue from "throttled-queue";
import { addMessageToConversation } from "@/lib/twilio";

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
const throttle = throttledQueue(20, 1000); // 20 requests per second

(async () => {
  let customerPage = await client.sync.v1
    .services(TWILIO_SYNC_SERVICE_SID)
    .syncMaps("ActiveCustomers")
    .syncMapItems.page({ pageSize: 200 });

  let counter = 0;

  while (customerPage && customerPage.instances.length > 0) {
    customerPage.instances.map((item) => {
      if (item.data.event === eventName) {
        counter++;
        throttle(() => {
          return addMessageToConversation(item.key, MESSAGE);
        });
      }
    });

    // @ts-ignore
    customerPage = await customerPage.nextPage();
  }

  throttle(() => {
    console.log(`Sent ${counter} messages`);
  });
})();
