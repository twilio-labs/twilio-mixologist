import { test, expect, type Locator } from "@playwright/test";
import { Privilege } from "@/middleware";

test.describe("[no login] ", () => {
  test("Only elements with permissions should be visible / page 1/2", async ({
    page,
  }) => {
    await page.goto("/event/test-event/orders/1-2");

    await expect(page.getByRole("tab", { name: "Queue" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Cancelled" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Delivered" })).toBeVisible();

    await expect(page.getByText("Terminal 1 of 2")).toBeVisible();

    const firstInQueue: Locator = page
      .getByText(new RegExp(/#(\d|[1-9]\d)Espresso Original Message/i))
      .first();
    const secondInQueue: Locator = page
      .getByText(new RegExp(/#(\d|[1-9]\d)Espresso Original Message/i))
      .nth(1);

    await expect(firstInQueue).toBeVisible();
    await expect(secondInQueue).toBeVisible();

    await expect(
      page.getByRole("button", { name: "Order Made" }),
    ).not.toBeVisible();
    await expect(
      page.getByRole("button", { name: "Delete Order" }),
    ).not.toBeVisible();
    await expect(
      page.getByRole("button", { name: "Served To Customer" }),
    ).not.toBeVisible();
    await expect(
      page.getByRole("button", { name: "Send Reminder" }),
    ).not.toBeVisible();

    await page.getByTestId("cancelledTab").click();
    expect(
      await page.getByText('Original Message - "A Cancelled Order"').count(),
    ).toBeGreaterThan(0);

    await page.getByTestId("deliveredTab").click();
    expect(
      await page.getByText('Original Message - "A Delivered Order"').count(),
    ).toBeGreaterThan(0);

    await expect(page.getByTestId("pause-orders")).toBeHidden();
  });

  test("Only elements with permissions should be visible / page 2/2", async ({
    page,
  }) => {
    await page.goto("/event/test-event/orders/2-2");

    await expect(page.getByRole("tab", { name: "Queue" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Cancelled" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Delivered" })).toBeVisible();

    await expect(page.getByText("Terminal 2 of 2")).toBeVisible();

    const firstInQueue: Locator = page
      .getByText(new RegExp(/#(\d|[1-9]\d)Espresso Original Message/i))
      .first();
    const secondInQueue: Locator = page
      .getByText(new RegExp(/#(\d|[1-9]\d)Espresso Original Message/i))
      .nth(1);

    await expect(firstInQueue).toBeVisible();
    await expect(secondInQueue).toBeVisible();

    await expect(
      page.getByRole("button", { name: "Order Made" }),
    ).not.toBeVisible();
    await expect(
      page.getByRole("button", { name: "Delete Order" }),
    ).not.toBeVisible();
    await expect(
      page.getByRole("button", { name: "Served To Customer" }),
    ).not.toBeVisible();
    await expect(
      page.getByRole("button", { name: "Send Reminder" }),
    ).not.toBeVisible();

    await page.getByTestId("cancelledTab").click();
    expect(
      await page.getByText('Original Message - "A Cancelled Order"'),
    ).toBeVisible();

    await page.getByTestId("deliveredTab").click();
    await expect(
      page.getByText('Original Message - "A Delivered Order"'),
    ).toBeVisible();

    await expect(page.getByTestId("pause-orders")).toBeHidden();
  });

  test("Should show right header for page 2/4", async ({ page }) => {
    await page.goto("/event/test-event/orders/2-4");
    await expect(page.getByText("Terminal 2 of 4")).toBeVisible();
  });

  test("Should not navigate to invalid pages like 6/4", async ({ page }) => {
    await page.goto("/event/test-event/orders/6-4");

    await expect(page.getByText("404")).toBeVisible();
  });
});

test.describe("[mixologist]", () => {
  test("All Tabs should be visible  / page 1/2", async ({ page, context }) => {
    await context.addCookies([
      {
        name: "privilege",
        value: Privilege.MIXOLOGIST,
        url: "http://localhost:3000",
      },
    ]);
    context.setExtraHTTPHeaders({
      Authorization: `Basic ${btoa(process.env.ADMIN_LOGIN || ":")}`,
    });

    await page.goto("/event/test-event/orders/1-2");
    await expect(page.getByText("Terminal 1 of 2")).toBeVisible();

    await expect(page.getByRole("tab", { name: "Queue" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Cancelled" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Delivered" })).toBeVisible();
    await expect(page.getByTestId("pause-orders")).toBeVisible();
  });

  test("All Tabs should be visible  / page 2/2", async ({ page, context }) => {
    await context.addCookies([
      {
        name: "privilege",
        value: Privilege.MIXOLOGIST,
        url: "http://localhost:3000",
      },
    ]);
    context.setExtraHTTPHeaders({
      Authorization: `Basic ${btoa(process.env.ADMIN_LOGIN || ":")}`,
    });

    await page.goto("/event/test-event/orders/2-2");
    await expect(page.getByText("Terminal 2 of 2")).toBeVisible();

    await expect(page.getByRole("tab", { name: "Queue" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Cancelled" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Delivered" })).toBeVisible();
    await expect(page.getByTestId("pause-orders")).toBeVisible();
  });
});
