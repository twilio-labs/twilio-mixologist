import twilio from "twilio";
import { throttledQueue, RetryError } from "throttled-queue";
import { deleteMemoryProfile } from "@/app/webhooks/messaging/memory";
import { isRateLimited } from "./rateLimitUtils";
import type { AttendeeRecord } from "@/types";

const {
  TWILIO_API_KEY = "",
  TWILIO_API_SECRET = "",
  TWILIO_ACCOUNT_SID = "",
  TWILIO_SYNC_SERVICE_SID = "",
} = process.env;

// evenlySpaced avoids bursting 20 requests at once, which trips Twilio's
// per-map write rate limit (54009) even though the 1s average is within it.
const throttle = throttledQueue({ maxPerInterval: 10, interval: 1000, evenlySpaced: true });
const client = twilio(TWILIO_API_KEY, TWILIO_API_SECRET, {
  accountSid: TWILIO_ACCOUNT_SID,
});

(async () => {
  //fetch all attendees and write to csv file with header columns
  let attendeePage = await client.sync.v1
    .services(TWILIO_SYNC_SERVICE_SID)
    .syncMaps("Attendees")
    .syncMapItems.page({ pageSize: 200 });

  let counter = 0;
  let profileCounter = 0;

  while (attendeePage && attendeePage.instances.length > 0) {
    attendeePage.instances.map((item) => {
      counter++;
      const profileId = (item.data as AttendeeRecord).profileId;

      throttle(async () => {
        if (profileId) {
          try {
            await deleteMemoryProfile(profileId);
            profileCounter++;
          } catch (e) {
            console.error(`Error deleting Memory profile ${profileId} for ${item.key}:`, e);
          }
        }

        try {
          return await client.sync.v1
            .services(TWILIO_SYNC_SERVICE_SID)
            .syncMaps("Attendees")
            .syncMapItems(item.key)
            .remove();
        } catch (e) {
          if (isRateLimited(e)) {
            throw new RetryError({ pauseQueue: true });
          }
          throw e;
        }
      }).catch((e) => {
        console.error(`Failed to remove attendee ${item.key} after retries:`, e);
      });
    });

    // @ts-ignore
    attendeePage = await attendeePage.nextPage();
  }

  throttle(() => {
    console.log(`Removed ${counter} attendees and ${profileCounter} Memory profiles`);
  });
})();
