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
  let attendeePage = await client.sync.v1
    .services(TWILIO_SYNC_SERVICE_SID)
    .syncMaps("Attendees")
    .syncMapItems.page({ pageSize: 200 });

  let verifiedAttendees: any[] = [];

  while (attendeePage && attendeePage.instances.length > 0) {
    const attendees = attendeePage.instances
      // @ts-ignore  thinks is a object but actually it's a user
      .map((item) => item.data as { stage: Stages; event: string })
      .filter(
        (a) =>
          (a.stage === Stages.VERIFIED_USER ||
            a.stage === Stages.FIRST_ORDER ||
            a.stage === Stages.REPEAT_CUSTOMER) &&
          a.event === eventName,
      );

    verifiedAttendees = verifiedAttendees.concat(attendees);

    // @ts-ignore
    attendeePage = await attendeePage.nextPage();
  }

  function escapeCsv(value: unknown): string {
    const str = value == null ? "" : String(value);
    return str.includes(",") || str.includes('"') || str.includes("\n")
      ? `"${str.replace(/"/g, '""')}"` : str;
  }

  try {
    const traitHeader = SEGMENT_TRAIT_CHECK || "SegmentTrait";
    const csv = verifiedAttendees.map((attendee) => {
      const traitValue = SEGMENT_TRAIT_CHECK ? attendee[SEGMENT_TRAIT_CHECK] : undefined;
      return [
        attendee.fullName,
        attendee.email,
        attendee.country,
        attendee.company,
        attendee.jobTitle,
        attendee.foundInSegment,
        traitValue,
        attendee.event,
        attendee.stage,
      ].map(escapeCsv).join(",");
    });
    writeFileSync(
      `attendees-${eventName}.csv`,
      `FullName,Email,Country,Company,JobTitle,FoundInSegment,${traitHeader},Event,Stage\n${csv.join("\n")}`,
    );
    console.log(`Exported ${csv.length} attendees to attendees-${eventName}.csv`);
  } catch (e) {
    console.error(e);
  }
})();
