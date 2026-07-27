import { type Locator } from "@playwright/test";
import { Privilege } from "@/proxy";
import { test, expect } from "./fixtures";

test.describe("[no login]", () => {
  test("Only elements with permissions should be visible", async ({ page, testEvent }) => {
    await page.goto(`/event/${testEvent.slug}/orders`);

    await expect(page.getByRole("tab", { name: "Queue" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Cancelled" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Delivered" })).toBeVisible();

    const firstInQueue: Locator = page
      .getByText(new RegExp(/#(\d|[1-9]\d)Espresso/i))
      .first();
    const secondInQueue: Locator = page
      .getByText(new RegExp(/#(\d|[1-9]\d)Espresso/i))
      .nth(1);

    await expect(firstInQueue).toBeVisible();
    await expect(secondInQueue).toBeVisible();

    await expect(
      page.getByRole("button", { name: "Order Made" }),
    ).not.toBeVisible();
    await expect(
      page.getByRole("button", { name: "Served To Customer" }),
    ).not.toBeVisible();
    await expect(
      page.getByRole("button", { name: "Send Reminder" }),
    ).not.toBeVisible();

    await page.getByTestId("cancelledTab").click();
    expect(
      await page.getByText("A Cancelled Order").count(),
    ).toBeGreaterThan(0);

    await page.getByTestId("deliveredTab").click();
    expect(
      await page.getByText("A Delivered Order").count(),
    ).toBeGreaterThan(0);

    await expect(page.getByTestId("pause-orders")).toBeHidden();
  });

  test("Scroll through extra orders", async ({ page, testEvent }) => {
    await page.goto(`/event/${testEvent.slug}/orders`);

    await expect(page.getByRole("button", { name: /Show \d+ more/i })).toBeVisible();
    await expect(page.getByText("#61")).not.toBeVisible();

    await page.getByRole("button", { name: /Show \d+ more/i }).click();
    while (await page.getByRole("button", { name: /Show \d+ more/i }).isVisible()) {
      await page.getByRole("button", { name: /Show \d+ more/i }).click();
    }
    await expect(
      page.getByRole("button", { name: /Show \d+ more/i }),
    ).not.toBeVisible();
    expect(await page.getByText("#61").count()).toBeGreaterThan(0);
  });

  test("broadcast message usable", async ({ page, context, testEvent }) => {
    await page.goto(`/event/${testEvent.slug}/orders`);

    await expect(
      page.getByRole("button", { name: "Broadcast message" }),
    ).toBeHidden();
  });

  test("Custom Order usable", async ({ page, context, testEvent }) => {
    await page.goto(`/event/${testEvent.slug}/orders`);

    await expect(
      page.getByRole("button", { name: "Add manual order" }),
    ).toBeHidden();
  });
});

test.describe("[mixologist]", () => {
  test("All Tabs should be visible", async ({ page, context, testEvent }) => {
    await context.addCookies([
      {
        name: "privilege",
        value: Privilege.MIXOLOGIST,
        url: "http://localhost:3000",
      },
    ]);
    await context.setExtraHTTPHeaders({
      Authorization: `Basic ${btoa(process.env.ADMIN_LOGIN || ":")}`,
    });

    await page.goto(`/event/${testEvent.slug}/orders`);

    await expect(page.getByRole("tab", { name: "Queue" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Cancelled" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Delivered" })).toBeVisible();
    await expect(page.getByTestId("pause-orders")).toBeVisible();
  });

  test("Scroll through extra orders", async ({ page, context, testEvent }) => {
    await context.addCookies([
      {
        name: "privilege",
        value: Privilege.MIXOLOGIST,
        url: "http://localhost:3000",
      },
    ]);
    await context.setExtraHTTPHeaders({
      Authorization: `Basic ${btoa(process.env.ADMIN_LOGIN || ":")}`,
    });
    await page.goto(`/event/${testEvent.slug}/orders`);

    await expect(page.getByRole("button", { name: /Show \d+ more/i })).toBeVisible();
    await expect(page.getByText("#61")).not.toBeVisible();

    await page.getByRole("button", { name: /Show \d+ more/i }).click();
    while (await page.getByRole("button", { name: /Show \d+ more/i }).isVisible()) {
      await page.getByRole("button", { name: /Show \d+ more/i }).click();
    }
    await expect(
      page.getByRole("button", { name: /Show \d+ more/i }),
    ).not.toBeVisible();
    expect(await page.getByText("#61").count()).toBeGreaterThan(0);
  });

  test("broadcast message usable", async ({ page, context, testEvent }) => {
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

    await page.goto(`/event/${testEvent.slug}/orders`);

    await page
      .getByRole("button", { name: "Broadcast message" })
      .click();
    await page.getByPlaceholder("Type your message here...").fill("Hello test");

    await page
      .getByRole("button", { name: "Send Message", exact: true })
      .isEnabled();
  });

  test("Custom Order usable", async ({ page, context, testEvent }) => {
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

    await page.goto(`/event/${testEvent.slug}/orders`);

    await page.getByRole("button", { name: "Add manual order" }).click();
    await page.getByPlaceholder("Customer name").fill("Test Name");
    await page.getByLabel("Order Item").click();
    await page.getByRole("option", { name: "Espresso", exact: true }).click();
    await page
      .getByPlaceholder("Without regular milk or similar...")
      .fill("Test Notes");
    await page
      .getByRole("button", { name: "Create Order", exact: true })
      .isEnabled();
  });
});
