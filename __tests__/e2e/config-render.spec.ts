import { Privilege } from "@/middleware";
import { test, expect } from "@playwright/test";

test("should not be navigable from home [no login]", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator('[href*="/configuration"]')).toBeHidden();
});

test("should be navigable from home [admin]", async ({ page, context }) => {
  await context.addCookies([
    {
      name: "privilege",
      value: Privilege.ADMIN,
      url: "http://localhost:3000",
    },
  ]);
  await page.goto("/");
  // Find an element with the text 'About' and click on it
  await page.click('[href*="/configuration"]');

  await expect(page).toHaveURL("http://localhost:3000/configuration");

  // shows placeholder for numbers
  await expect(
    page
      .locator("section")
      .filter({ hasText: "Connected Phone Numbers" })
      .locator("div")
      .nth(1),
  ).toBeVisible();

  // shows placeholder for menus
  await expect(
    page.locator("section").filter({ hasText: "Menus" }).locator("div").nth(1),
  ).toBeVisible();

  // shows placeholder for spelling map
  await expect(
    page
      .locator("section")
      .filter({ hasText: "Spelling Map" })
      .locator("div")
      .nth(1),
  ).toBeVisible();
});
