import twilio from "twilio";

const {
  TWILIO_API_KEY = "",
  TWILIO_API_SECRET = "",
  TWILIO_ACCOUNT_SID = "",
  TWILIO_SYNC_SERVICE_SID = "",
  NEXT_PUBLIC_EVENTS_MAP = "",
} = process.env;

const client = twilio(TWILIO_API_KEY, TWILIO_API_SECRET, {
  accountSid: TWILIO_ACCOUNT_SID,
});

(async () => {
  try {
    const eventPage = await client.sync.v1
      .services(TWILIO_SYNC_SERVICE_SID)
      .syncMaps(NEXT_PUBLIC_EVENTS_MAP)
      .syncMapItems.page({ pageSize: 200 });

    const events = eventPage.instances.map((item) => ({
      key: item.key,
      name: (item.data as any).name,
      slug: (item.data as any).slug,
      active: (item.data as any).active,
      dateCreated: item.dateCreated,
    }));

    console.log(`\nTotal events: ${events.length}\n`);
    console.log("Events in Sync map:");
    console.table(events);

    const activeEvents = events.filter(e => e.active);
    console.log(`\nActive events: ${activeEvents.length}`);
    console.log(`Inactive events: ${events.length - activeEvents.length}`);
  } catch (error) {
    console.error("Error fetching events:", error);
  }
})();
