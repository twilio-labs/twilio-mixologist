import { test, expect, type Page } from "@playwright/test";
import { Privilege } from "@/proxy";

test.describe("[no login]", () => {
  test("should not be navigable", async ({ page }) => {
    await page.goto("/");

    // Non-admin event cards render the title as a plain heading, not a link.
    await page.getByRole("heading", { name: "TestEvent", exact: true }).click();

    await expect(page).toHaveURL(/localhost:3000\/$/);
  });

  test("direct links should not work [no login]", async ({ page }) => {
    await page.goto("http://localhost:3000/event/test-event");

    await page.waitForTimeout(4000);

    await expect([
      // two options because of redirect timing
      "http://localhost:3000/",
      "http://localhost:3000/login",
    ]).toContain(page.url());
  });
});

test.describe("[mixologist]", () => {
  test("should not be navigable", async ({ page, context }) => {
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
    await page.getByRole("heading", { name: "TestEvent", exact: true }).click();

    await expect(page).toHaveURL(/localhost:3000\/$/);
  });

  test("direct links should not work", async ({ page, context }) => {
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

    await page.goto("http://localhost:3000/event/test-event");

    await expect(page).toHaveURL(/localhost:3000\/$/);
  });
});

test.describe("[admin]", () => {
  // These tests mutate the shared "test-event" fixture (item selection, mode);
  // run them in order rather than in parallel to avoid clobbering each other.
  test.describe.configure({ mode: "serial" });

  test("should be navigable to an existing event", async ({
    page,
    context,
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
    await page.getByRole("link", { name: "TestEvent" }).click();

    await expect(page).toHaveURL("http://localhost:3000/event/test-event");

    await expect(page.getByPlaceholder("Enter event name")).toHaveValue(
      "TestEvent",
    );
    await expect(page.getByPlaceholder("Enter event name")).toBeDisabled();

    await expect(page.getByPlaceholder("Auto-generated")).toHaveValue(
      "test-event",
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

    await page.goto("http://localhost:3000/event/test-event");

    await page.waitForTimeout(2000);

    // TestEvent starts with 1 item selected (Espresso); select 9 more unselected
    // items to reach the 10-item cap. Scoped to the literal aria-pressed="false"
    // attribute (not the role=button pressed filter) — Chromium's accessibility
    // tree reports pressed:false by default for any plain button, which would
    // otherwise also match the header's "Log out" button and toast dismiss buttons.
    const unselectedItem = page.locator('button[aria-pressed="false"]');
    for (let i = 0; i < 9; i++) {
      await unselectedItem.first().click();
    }

    await expect(page.getByText("10 of 10 items selected")).toBeVisible();

    // selecting an 11th item should be blocked
    await unselectedItem.first().click();
    await expect(
      page.getByText("Cannot select more items", { exact: true }),
    ).toBeVisible();

    await page.getByText("Smoothie").click();
  });

  test("should show warning for inactive number", async ({ page, context }) => {
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

    await page.goto("http://localhost:3000/event/test-event");

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
