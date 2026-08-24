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

// Test event pattern from __tests__/e2e/fixtures.ts:91
// Format: "Ev-w{workerIndex}-{RUN_TAG}"
const TEST_EVENT_PATTERN = /^Ev-w\d+-/;

// Also clean up test event slugs
// Format: "test-event-{platform}-{RUN_TAG}-w{workerIndex}"
const isTestEvent = (event: any): boolean => {
  return (
    TEST_EVENT_PATTERN.test(event.name) ||
    (event.slug && event.slug.startsWith("test-event-"))
  );
};

(async () => {
  try {
    const eventPage = await client.sync.v1
      .services(TWILIO_SYNC_SERVICE_SID)
      .syncMaps(NEXT_PUBLIC_EVENTS_MAP)
      .syncMapItems.page({ pageSize: 200 });

    const allEvents = eventPage.instances;
    const testEvents = allEvents.filter((item) => isTestEvent(item.data as any));

    console.log(`\nTotal events in map: ${allEvents.length}`);
    console.log(`Test events found: ${testEvents.length}\n`);

    if (testEvents.length === 0) {
      console.log("No test events to clean up.");
      return;
    }

    console.log("Test events to be deleted:");
    testEvents.forEach((item) => {
      const data = item.data as any;
      console.log(`  - ${data.name} (${data.slug}) - created ${item.dateCreated}`);
    });

    const dryRun = process.argv.includes("--dry-run");

    if (dryRun) {
      console.log("\n[DRY RUN] No events were deleted. Remove --dry-run to delete.");
      return;
    }

    console.log("\nDeleting test events...");
    let deleted = 0;

    for (const item of testEvents) {
      try {
        await client.sync.v1
          .services(TWILIO_SYNC_SERVICE_SID)
          .syncMaps(NEXT_PUBLIC_EVENTS_MAP)
          .syncMapItems(item.key)
          .remove();
        deleted++;
        console.log(`  ✓ Deleted: ${(item.data as any).name}`);
      } catch (error: any) {
        console.error(`  ✗ Failed to delete ${(item.data as any).name}:`, error.message);
      }
    }

    console.log(`\n✓ Cleanup complete. Deleted ${deleted}/${testEvents.length} test events.`);
  } catch (error) {
    console.error("Error during cleanup:", error);
    process.exit(1);
  }
})();
