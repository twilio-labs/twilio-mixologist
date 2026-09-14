import twilio from "twilio";

const {
  TWILIO_API_KEY,
  TWILIO_API_SECRET,
  TWILIO_ACCOUNT_SID,
  TWILIO_SYNC_SERVICE_SID,
  NEXT_PUBLIC_EVENTS_MAP,
} = process.env;

const required = {
  TWILIO_API_KEY,
  TWILIO_API_SECRET,
  TWILIO_ACCOUNT_SID,
  TWILIO_SYNC_SERVICE_SID,
  NEXT_PUBLIC_EVENTS_MAP,
};
const missing = Object.entries(required)
  .filter(([, v]) => !v)
  .map(([k]) => k);
if (missing.length > 0) {
  console.error(`Missing required environment variables: ${missing.join(", ")}`);
  process.exit(1);
}

const client = twilio(TWILIO_API_KEY, TWILIO_API_SECRET, {
  accountSid: TWILIO_ACCOUNT_SID,
});

(async () => {
  try {
    const items = await client.sync.v1
      .services(TWILIO_SYNC_SERVICE_SID as string)
      .syncMaps(NEXT_PUBLIC_EVENTS_MAP as string)
      .syncMapItems.list({ pageSize: 200 });

    const events = items.map((item) => ({
      key: item.key,
      name: (item.data as any).name,
      slug: (item.data as any).slug,
      active: (item.data as any).active,
      dateCreated: item.dateCreated,
    }));

    console.log(`\nTotal events: ${events.length}\n`);
    console.log("Events in Sync map:");
    console.table(events);

    const activeEvents = events.filter((e) => e.active);
    console.log(`\nActive events: ${activeEvents.length}`);
    console.log(`Inactive events: ${events.length - activeEvents.length}`);
  } catch (error) {
    console.error("Error fetching events:", error);
    process.exit(1);
  }
})();
