import twilio from "twilio";
import { writeFileSync } from "fs";
import { Stages } from "@/lib/utils";

const {
  TWILIO_API_KEY = "",
  TWILIO_API_SECRET = "",
  TWILIO_ACCOUNT_SID = "",
  TWILIO_SYNC_SERVICE_SID = "",
  SEGMENT_TRAIT_CHECK = "",
} = process.env;

const client = twilio(TWILIO_API_KEY, TWILIO_API_SECRET, {
  accountSid: TWILIO_ACCOUNT_SID,
});

const eventName = process.argv.pop();

if (!eventName || eventName.startsWith("/") || eventName.includes("=")) {
  console.error(
    "Please provide an event name as the last argument, e.g. 'pnpm download wearedevs24'",
  );
  process.exit(1);
}

(async () => {
  //fetch all attendees and write to csv file with header columns
  const map = await client.sync.v1
    .services(TWILIO_SYNC_SERVICE_SID)
    .syncMaps("ActiveCustomers");
  try {
    const mapItems = await map.syncMapItems.list({ limit: 1000 }); //TODO should fetch all here
    const attendees = mapItems
      .map((item) => item.data)
      // .filter(
      //   (a) =>
      //     (a.stage === Stages.VERIFIED_USER ||
      //       a.stage === Stages.FIRST_ORDER ||
      //       a.stage === Stages.REPEAT_CUSTOMER) &&
      //     a.event === eventName,
      // );
    const csv = attendees.map((attendee) => {
      return `${attendee.fullName},${attendee.email},${attendee.country},${attendee.foundInSegment},${attendee[SEGMENT_TRAIT_CHECK]},${attendee.event},${attendee.stage}`;
    });
    writeFileSync(
      `attendees-${eventName}.csv`,
      `FullName,Email,Country,FoundInSegment,CompletedSignup,Event,Stage\n${csv.join("\n")}`,
    );
  } catch (e) {
    console.error(e);
  }
})();
