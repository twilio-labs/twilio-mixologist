# Testing Guide

## Test Environment Separation

To prevent test data pollution in production, E2E tests should run against a **separate test Twilio Sync service**.

### Why This Matters

E2E tests create temporary events and orders in Twilio Sync:
- **4 parallel workers** × **2 retries** = up to 8 test events per CI run
- Each test event contains **~60 test orders**
- If tests fail or timeout, cleanup may not run
- Orphaned test events in production break the event registration flow

### Setting Up Test Environment

#### 1. Create a separate Twilio Sync Service for testing

```bash
# Using Twilio CLI
twilio api:sync:v1:services:create --friendly-name "Mixologist Test"
```

This returns a new `SYNC_SERVICE_SID` for testing.

#### 2. Configure GitHub Repository Variables/Secrets

Add these **_TEST** variants to your GitHub repository:

**Variables** (Settings → Secrets and variables → Actions → Variables):
- `TWILIO_ACCOUNT_SID_TEST` - Your Twilio Account SID (or test subaccount)
- `TWILIO_MESSAGING_SERVICE_SID_TEST` - Test messaging service
- `TWILIO_SYNC_SERVICE_SID_TEST` - The new test Sync service SID
- `TWILIO_VERIFY_SERVICE_SID_TEST` - Test verify service
- `NEXT_PUBLIC_ATTENDEES_MAP_TEST` - Name for test attendees map (e.g., "Attendees_Test")

**Secrets** (Settings → Secrets and variables → Actions → Secrets):
- `TWILIO_API_KEY_TEST` - Test API Key
- `TWILIO_API_SECRET_TEST` - Test API Secret

#### 3. Fallback Behavior

The CI workflow uses test credentials if available, otherwise falls back to production:

```yaml
TWILIO_SYNC_SERVICE_SID: ${{ vars.TWILIO_SYNC_SERVICE_SID_TEST || vars.TWILIO_SYNC_SERVICE_SID }}
```

**⚠️ Until test credentials are configured, tests will continue using production.**

### Cleanup Script

A cleanup script is provided to remove orphaned test events:

```bash
# Dry run (preview what would be deleted)
pnpm run cleanup-test-events -- --dry-run

# Actually delete test events
pnpm run cleanup-test-events
```

This runs automatically after CI tests complete (even on failure).

### Test Event Naming Pattern

E2E tests create events matching these patterns:
- **Name**: `Ev-w{workerIndex}-{runTag}` (e.g., "Ev-w0-3a5f")
- **Slug**: `test-event-{platform}-{runTag}-w{workerIndex}`

The cleanup script identifies and removes events matching these patterns.

### Local E2E Testing

Local tests use `.env.local` credentials and run against `localhost:3000`:

```bash
pnpm run test:e2e
```

By default, these use your production Twilio credentials. To test against the test environment locally, override the Sync service in `.env.local`:

```bash
TWILIO_SYNC_SERVICE_SID=ISxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx  # Test service SID
```

### Manual Event Inspection

List every event in your Sync map (name, slug, active flag, created date):

```bash
pnpm run list-events
```

Preview only the events that would be swept by the cleanup script (matches the test-event name/slug patterns) without deleting anything:

```bash
pnpm run cleanup-test-events -- --dry-run
```
