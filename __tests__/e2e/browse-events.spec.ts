import { type Page } from "@playwright/test";
import { Privilege } from "@/proxy";
import { test, expect, createEvent, deleteIfExists } from "./fixtures";

test.describe("[no login]", () => {
  test("should not be navigable", async ({ page, testEvent }) => {
    await page.goto("/");

    // Non-admin event cards render the title as a plain heading, not a link.
    await page.getByRole("heading", { name: testEvent.name, exact: true }).click();

    await expect(page).toHaveURL(/localhost:3000\/$/);
  });

  test("direct links should not work [no login]", async ({ page, testEvent }) => {
    await page.goto(`http://localhost:3000/event/${testEvent.slug}`);

    await page.waitForTimeout(4000);

    await expect([
      // two options because of redirect timing
      "http://localhost:3000/",
      "http://localhost:3000/login",
    ]).toContain(page.url());
  });
});

test.describe("[mixologist]", () => {
  test("should not be navigable", async ({ page, context, testEvent }) => {
    await context.addCookies([
      {
        name: "privilege",
        value: Privilege.MIXOLOGIST,
        url: "http://localhost:3000",
      },
    ]);
    await context.setExtraHTTPHeaders({
      Authorization: `Basic ${btoa(process.env.MIXOLOGIST_LOGIN || ":")}`,
    });

    await page.goto("/");

    // Non-admin event cards render the title as a plain heading, not a link.
    await page.getByRole("heading", { name: testEvent.name, exact: true }).click();

    await expect(page).toHaveURL(/localhost:3000\/$/);
  });

  test("direct links should not work", async ({ page, context, testEvent }) => {
    await context.addCookies([
      {
        name: "privilege",
        value: Privilege.MIXOLOGIST,
        url: "http://localhost:3000",
      },
    ]);
    await context.setExtraHTTPHeaders({
      Authorization: `Basic ${btoa(process.env.MIXOLOGIST_LOGIN || ":")}`,
    });

    await page.goto(`http://localhost:3000/event/${testEvent.slug}`);

    await expect(page).toHaveURL(/localhost:3000\/$/);
  });
});

test.describe("[admin]", () => {
  test("should be navigable to an existing event", async ({
    page,
    context,
    testEvent,
  }) => {
    await context.addCookies([
      {
        name: "privilege",
        value: Privilege.ADMIN,
        url: "http://localhost:3000",
      },
    ]);
    await context.setExtraHTTPHeaders({
      Authorization: `Basic ${btoa(process.env.ADMIN_LOGIN || ":")}`,
    });

    await page.goto("/");
    // Find an element with the text 'About' and click on it
    await page.getByRole("link", { name: testEvent.name, exact: true }).click();

    await expect(page).toHaveURL(`http://localhost:3000/event/${testEvent.slug}`);

    await expect(page.getByPlaceholder("Enter event name")).toHaveValue(
      testEvent.name,
    );
    await expect(page.getByPlaceholder("Enter event name")).toBeDisabled();

    await expect(page.getByPlaceholder("Auto-generated")).toHaveValue(
      testEvent.slug,
    );
    await expect(page.getByPlaceholder("Auto-generated")).toBeDisabled();

    await expect(page.getByText("Max Orders Per Customer / Day")).toHaveValue("1860");

    await expect(page.getByText("Max Orders Per Customer / Day")).toBeEditable();

    await expect(page.getByPlaceholder("Where to find the booth")).toHaveValue(
      "Pickup location",
    );

    await expect(
      page.getByRole("button", { name: "Show QR codes" }),
    ).toBeVisible();

    await expect(
      page.getByPlaceholder("Shown on first contact with"),
    ).toHaveValue("Custom Welcome");

    await expect(page.getByRole("switch")).toBeChecked({ checked: true });

    await expect(page.getByText("Smoothie")).toBeVisible();
    await expect(page.getByText("Barista")).toBeVisible();

    await expect(page.getByText("Cappuccino", { exact: true })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Espresso Strong black coffee" }),
    ).toHaveAttribute("aria-pressed", "true");
    await expect(
      page.getByText("whatsapp:+447700161860", { exact: true }),
    ).toBeVisible();
  });

  test("should not be able to select more than 9 menu items + navigate to smoothie", async ({
    page,
    context,
  }, testInfo) => {
    // This test mutates item selection and mode, unlike its siblings which only
    // read the shared per-worker testEvent — give it its own private event
    // (random slug/name, platform-prefixed) so it never clobbers the fixture
    // other tests depend on, whether they're in this worker or another one.
    const platform = process.env.CI ? "ci" : "local";
    const rand = Math.random().toString(36).slice(2, 8);
    const slug = `test-event-menu-cap-${platform}-${rand}`;
    // Event names are capped at 20 chars by the API (src/app/api/event/route.ts).
    const name = `MC-${rand.slice(0, 6)}`;
    const baseURL = testInfo.project.use.baseURL || "http://localhost:3000";
    await deleteIfExists(baseURL, slug);
    const response = await createEvent(baseURL, slug, name);
    expect(response.status).toBe(201);

    try {
      await context.addCookies([
        {
          name: "privilege",
          value: Privilege.ADMIN,
          url: "http://localhost:3000",
        },
      ]);
      await context.setExtraHTTPHeaders({
        Authorization: `Basic ${btoa(process.env.ADMIN_LOGIN || ":")}`,
      });

      await page.goto(`http://localhost:3000/event/${slug}`);

      // Wait for the freshly-created event's menu to actually be rendered
      // (Espresso pre-selected) rather than a fixed sleep, since a brand-new
      // event's Sync data may take longer to propagate under concurrent load.
      await expect(
        page.getByRole("button", { name: "Espresso Strong black coffee" }),
      ).toHaveAttribute("aria-pressed", "true");

      // The event starts with 1 item selected (Espresso); select 9 more unselected
      // items to reach the 10-item cap. Scoped to the literal aria-pressed="false"
      // attribute (not the role=button pressed filter) — Chromium's accessibility
      // tree reports pressed:false by default for any plain button, which would
      // otherwise also match the header's "Log out" button and toast dismiss buttons.
      const unselectedItem = page.locator('button[aria-pressed="false"]');
      for (let i = 0; i < 9; i++) {
        await unselectedItem.first().click();
        // Wait for this click's selection save to land before firing the
        // next — the save is a fire-and-forget PUT, and rapid unawaited
        // requests can complete out of order under latency, regressing the
        // count if a later click's save is overtaken by an earlier one.
        await expect(page.getByText(`${i + 2} of 10 items selected`)).toBeVisible();
      }

      // selecting an 11th item should be blocked
      await unselectedItem.first().click();
      await expect(
        page.getByText("Cannot select more items", { exact: true }),
      ).toBeVisible();

      await page.getByText("Smoothie").click();
    } finally {
      await deleteIfExists(baseURL, slug);
    }
  });

  test("should show warning for inactive number", async ({ page, context, testEvent }) => {
    await context.addCookies([
      {
        name: "privilege",
        value: Privilege.ADMIN,
        url: "http://localhost:3000",
      },
    ]);
    await context.setExtraHTTPHeaders({
      Authorization: `Basic ${btoa(process.env.ADMIN_LOGIN || ":")}`,
    });

    await page.goto(`http://localhost:3000/event/${testEvent.slug}`);

    await expect(
      page.getByText(
        "The following senders are no longer available: +4915199999999",
      ),
    ).toBeVisible();
  });

  test("should be 404 for invalid event", async ({ page, context }) => {
    await context.addCookies([
      {
        name: "privilege",
        value: Privilege.ADMIN,
        url: "http://localhost:3000",
      },
    ]);
    await context.setExtraHTTPHeaders({
      Authorization: `Basic ${btoa(process.env.ADMIN_LOGIN || ":")}`,
    });

    await page.goto("http://localhost:3000/event/test-event-not-here");

    await expect(page.getByRole("heading", { name: "404" })).toBeVisible();
  });

  test("should be navigable to a new event", async ({ page, context }) => {
    await context.addCookies([
      {
        name: "privilege",
        value: Privilege.ADMIN,
        url: "http://localhost:3000",
      },
    ]);
    await context.setExtraHTTPHeaders({
      Authorization: `Basic ${btoa(process.env.ADMIN_LOGIN || ":")}`,
    });
    await page.goto("/");
    // Find an element with the text 'About' and click on it
    await page.getByRole("link", { name: "New Event" }).click();

    await expect(page).toHaveURL("http://localhost:3000/event/new");

    await expect(page.getByPlaceholder("Enter event name")).toBeEnabled();
    await expect(page.getByPlaceholder("Auto-generated")).toBeDisabled();

    await expect(page.getByPlaceholder("Enter event name")).toHaveValue("");
    await expect(page.getByPlaceholder("Auto-generated")).toHaveValue("");

    await expect(page.getByText("Max Orders Per Customer / Day")).toHaveValue("70");

    await page.getByPlaceholder("Enter event name").fill("ranDOM23");
    await expect(page.getByPlaceholder("Auto-generated")).toHaveValue(
      "ran-dom-23",
    );

    await expect(page.getByPlaceholder("Where to find the booth")).toHaveValue(
      "",
    );

    await expect(
      page.getByPlaceholder("Shown on first contact with"),
    ).toHaveValue("");

    await expect(page.getByRole("switch")).toBeHidden();

    await expect(page.getByText("Smoothie")).toBeVisible();
    await expect(page.getByText("Barista")).toBeVisible();
    await expect(page.getByText("Coffee", { exact: true })).toBeVisible();

    await expect(page.getByText("Flat White", { exact: true })).toBeVisible();

    await expect(page.getByText("Oat Milk")).toBeVisible();
    await expect(page.getByText("Almond Milk")).toBeVisible();
    await expect(page.getByText("Brewed coffee, black")).toBeVisible();

    const createButton = page.getByRole("button", { name: "Create Event" });

    await expect(createButton).toBeVisible();
    // aria-disabled rather than disabled — this keeps the tooltip explaining
    // why the form can't be submitted yet accessible on hover/focus.
    await expect(createButton).toHaveAttribute("aria-disabled", "true");
  });
});
