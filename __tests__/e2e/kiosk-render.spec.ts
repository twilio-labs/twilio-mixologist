import { test, expect, type Locator } from "@playwright/test";
import { Privilege } from "@/middleware";



test.describe("[no login]", () => {
  test("Should not see the page", async ({ page }) => {
    await page.goto("/event/test-event/kiosk");

    await expect(page.getByText("Unauthorized")).toBeVisible();
  });
});

test.describe("[kiosk]", () => {
  test("Form should be visible", async ({ page, context }) => {
    await context.addCookies([
      {
        name: "privilege",
        value: Privilege.KIOSK,
        url: "http://localhost:3000",
      },
    ]);
    context.setExtraHTTPHeaders({
      Authorization: `Basic ${btoa(process.env.KIOSK_LOGIN || ":")}`,
    });

    await page.goto("/event/test-event/kiosk");

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
