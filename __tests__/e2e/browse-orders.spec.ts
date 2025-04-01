import { test, expect, type Locator } from "@playwright/test";
import { Privilege } from "@/middleware";

test.describe("[no login]", () => {
  test("Only elements with permissions should be visible", async ({ page }) => {
    await page.goto("/event/test-event/orders");

    await expect(page.getByRole("tab", { name: "Queue" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Cancelled" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Delivered" })).toBeVisible();

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

  test("Scroll through extra orders", async ({ page }) => {
    await page.goto("/event/test-event/orders");

    await expect(page.getByRole("button", { name: "Show More" })).toBeVisible();
    await expect(page.getByText("#61")).not.toBeVisible();

    await page.getByRole("button", { name: "Show More" }).click();
    while (await page.getByRole("button", { name: "Show More" }).isVisible()) {
      await page.getByRole("button", { name: "Show More" }).click();
    }
    await expect(
      page.getByRole("button", { name: "Show More" }),
    ).not.toBeVisible();
    !(await page.getByText("#61").isVisible());
  });

  test("broadcast message usable", async ({ page, context }) => {
    await page.goto("/event/test-event/orders");

    await expect(
      page.getByRole("button", { name: "Send Message to all open" }),
    ).toBeHidden();
  });

  test("Custom Order usable", async ({ page, context }) => {
    await page.goto("/event/test-event/orders");

    await expect(
      page.getByRole("button", { name: "Create a Manual Order" }),
    ).toBeHidden();
  });
});

test.describe("[mixologist]", () => {
  test("All Tabs should be visible", async ({ page, context }) => {
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

    await page.goto("/event/test-event/orders");

    await expect(page.getByRole("tab", { name: "Queue" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Cancelled" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Delivered" })).toBeVisible();
    await expect(page.getByTestId("pause-orders")).toBeVisible();
  });

  test("Scroll through extra orders", async ({ page, context }) => {
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
    await page.goto("/event/test-event/orders");

    await expect(page.getByRole("button", { name: "Show More" })).toBeVisible();
    await expect(page.getByText("#61")).not.toBeVisible();

    await page.getByRole("button", { name: "Show More" }).click();
    while (await page.getByRole("button", { name: "Show More" }).isVisible()) {
      await page.getByRole("button", { name: "Show More" }).click();
    }
    await expect(
      page.getByRole("button", { name: "Show More" }),
    ).not.toBeVisible();
    !(await page.getByText("#61").isVisible());
  });

  test("broadcast message usable", async ({ page, context }) => {
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

    await page.goto("/event/test-event/orders");

    await page
      .getByRole("button", { name: "Send Message to all open" })
      .click();
    await page.getByPlaceholder("Type your message here...").fill("Hello test");

    await page
      .getByRole("button", { name: "Send Message", exact: true })
      .isEnabled();
  });

  test("Custom Order usable", async ({ page, context }) => {
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

    await page.goto("/event/test-event/orders");

    await page.getByRole("button", { name: "Create a Manual Order" }).click();
    await page.getByPlaceholder("Customer name").fill("Test Name");
    await page.getByLabel("Order Item").click();
    await page.getByLabel("Espresso", { exact: true }).click();
    await page
      .getByPlaceholder("Without regular milk or similar...")
      .fill("Test Notes");
    await page
      .getByRole("button", { name: "Create Order", exact: true })
      .isEnabled();
  });
});
