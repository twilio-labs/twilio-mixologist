import { test, expect, type Page } from "@playwright/test";
import { Privilege } from "@/middleware";

test.describe("[no login]", () => {
  test("should not be navigable", async ({ page }) => {
    await page.goto("/");

    await page.click("text=Event ID: test-event");

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
    context.setExtraHTTPHeaders({
      Authorization: `Basic ${btoa(process.env.MIXOLOGIST_LOGIN || ":")}`,
    });

    await page.goto("/");

    await page.click("text=Event ID: test-event");

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
    context.setExtraHTTPHeaders({
      Authorization: `Basic ${btoa(process.env.MIXOLOGIST_LOGIN || ":")}`,
    });

    await page.goto("http://localhost:3000/event/test-event");

    await expect(page).toHaveURL(/localhost:3000\/$/);
  });
});

test.describe("[admin]", () => {
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
    context.setExtraHTTPHeaders({
      Authorization: `Basic ${btoa(process.env.ADMIN_LOGIN || ":")}`,
    });

    await page.goto("/");
    // Find an element with the text 'About' and click on it
    await page.click("text=Event ID: test-event");

    await expect(page).toHaveURL("http://localhost:3000/event/test-event");

    await expect(page.getByPlaceholder("Enter event name")).toHaveValue(
      "TestEvent",
    );
    await expect(page.getByPlaceholder("Enter event name")).toBeDisabled();

    await expect(page.getByPlaceholder("Event slug will be")).toHaveValue(
      "test-event",
    );
    await expect(page.getByPlaceholder("Event slug will be")).toBeDisabled();

    await expect(page.getByText("Max Orders Per Customer")).toHaveValue("1860");

    await expect(page.getByText("Max Orders Per Customer")).toBeEditable();

    await expect(page.getByPlaceholder("Where to find the booth")).toHaveValue(
      "Pickup location",
    );

    await expect(
      page.getByRole("button", { name: "Show QR codes" }),
    ).toBeVisible();

    await expect(
      page.getByPlaceholder("Shown on first contact with"),
    ).toHaveValue("Custom Welcome");

    await expect(page.getByLabel("Open")).toBeChecked({ checked: true });

    await expect(page.getByText("Smoothie")).toBeVisible();
    await expect(page.getByText("Barista")).toBeVisible();

    await expect(
      page.getByRole("heading", { name: "Latte Macchiato", exact: true }),
    ).toBeVisible();
    await expect(
      page.locator(".space-y-2 > div:nth-child(2) > .peer").first(),
    ).toBeChecked({ checked: true });
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
    context.setExtraHTTPHeaders({
      Authorization: `Basic ${btoa(process.env.ADMIN_LOGIN || ":")}`,
    });

    await page.goto("http://localhost:3000/event/test-event");

    await page.waitForTimeout(1000);

    // select the first 10 items
    for (let i = 1; i <= 10; i++) {
      try {
        await page
          .locator(`.space-y-2 > div:nth-child(${i}) > .peer`)
          .first()
          .setChecked(true);
      } catch (e: any) {
        if (/Clicking the checkbox did not change its state/.exec(e.message)) {
          return;
        }
        throw e;
        // ignore that the checkbox might not be selectable
      }
    }

    await expect(page.getByText("Cannot select more items")).toBeVisible();

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
    context.setExtraHTTPHeaders({
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
    context.setExtraHTTPHeaders({
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
    context.setExtraHTTPHeaders({
      Authorization: `Basic ${btoa(process.env.ADMIN_LOGIN || ":")}`,
    });
    await page.goto("/");
    // Find an element with the text 'About' and click on it
    await page.click("text=+ Create New Event");

    await expect(page).toHaveURL("http://localhost:3000/event/new");

    await expect(page.getByPlaceholder("Enter event name")).toBeEnabled();
    await expect(page.getByPlaceholder("Event slug will be")).toBeDisabled();

    await expect(page.getByPlaceholder("Enter event name")).toHaveValue("");
    await expect(page.getByPlaceholder("Event slug will be")).toHaveValue("");

    await expect(page.getByText("Max Orders Per Customer")).toHaveValue("40");

    await page.getByPlaceholder("Enter event name").fill("ranDOM23");
    await expect(page.getByPlaceholder("Event slug will be")).toHaveValue(
      "ran-dom-23",
    );

    await expect(page.getByPlaceholder("Where to find the booth")).toHaveValue(
      "",
    );

    await expect(
      page.getByPlaceholder("Shown on first contact with"),
    ).toHaveValue("");

    await expect(page.getByLabel("Open")).toBeHidden();

    await expect(page.getByText("Smoothie")).toBeVisible();
    await expect(page.getByText("Barista")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Colombia (Red like Twilio!)" }),
    ).toBeVisible();
    await expect(page.getByText("Strawberry, Pineapple, Apple")).toBeVisible();

    const createButton = page
      .getByRole("button", { name: "Create Event" })
      .locator("nth=-1");

    await expect(createButton).toBeVisible();
    await expect(createButton).toHaveClass(/bg-blue-50/); // simular to be disable but still allow tooltip
    await expect(createButton).toHaveClass(/hover:bg-blue-100/);
    await expect(createButton).toHaveClass(/text-slate-300/); // maybe extend test later to check for enabled after data entered
  });
});
