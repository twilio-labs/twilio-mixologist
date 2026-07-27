import { Privilege } from "@/proxy";
import { test, expect } from "./fixtures";

test("should contain all relevant elements [no login]", async ({ page, testEvent }) => {
  // Start from the index page (the baseURL is set via the webServer in the playwright.config.ts)
  await page.goto("/");
  // Find an element with the text 'About' and click on it
  await page.click("text=Twilio Mixologist");

  await expect(page.locator('[href*="/login"]')).toContainText("Login");
  await expect(page.locator('button[type="submit"]')).toBeHidden();
  await expect(
    page.getByRole("heading", { name: testEvent.name, exact: true }),
  ).toContainText(testEvent.name);
  await expect(
    page.getByRole("link", { name: "orders" }).first(),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "menu" }).first()).toBeVisible();

  await expect(page).toHaveURL("http://localhost:3000/");
  await expect(page.locator("footer")).toContainText("Made with ❤️ by Twilio");
});

test("should show the right ui elements [admin]", async ({ page, context }) => {
  await context.addCookies([
    {
      name: "privilege",
      value: Privilege.ADMIN,
      url: "http://localhost:3000",
    },
  ]);
  await page.goto("/");
  // Find an element with the text 'About' and click on it
  await page.click("text=Twilio Mixologist");

  await expect(page.locator('[href*="/configuration"]')).toContainText(
    "Configuration",
  );
  await expect(page.locator('[href*="/configuration"]')).toBeVisible();

  await expect(page.locator('button[type="submit"]')).toContainText("Log out");
  await expect(page.locator('button[type="submit"]')).toBeVisible();
  await expect(page.locator('[href*="/login"]')).toBeHidden();

  await expect(
    page.getByRole("link", { name: "orders" }).first(),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "menu" }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: "stats" }).first()).toBeVisible();

  await expect(page.locator('[href="/event/new"]')).toContainText(
    "New Event",
  );
});

test("should show the right ui elements [mixologist]", async ({
  page,
  context,
}) => {
  await context.addCookies([
    {
      name: "privilege",
      value: Privilege.MIXOLOGIST,
      url: "http://localhost:3000",
    },
  ]);
  await page.goto("/");
  // Find an element with the text 'About' and click on it
  await page.click("text=Twilio Mixologist");

  await expect(page.locator('[href*="/configuration"]')).toBeHidden();

  await expect(page.locator('button[type="submit"]')).toContainText("Log out");
  await expect(page.locator('button[type="submit"]')).toBeVisible();
  await expect(page.locator('[href*="/login"]')).toBeHidden();

  await expect(
    page.getByRole("link", { name: "orders" }).first(),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "menu" }).first()).toBeVisible();

  await expect(page.locator('[href="/event/new"]')).toBeHidden();
});
