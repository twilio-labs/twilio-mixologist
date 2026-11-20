import { Privilege } from "@/proxy";
import { test, expect, createEvent, createOrder, deleteIfExists } from "./fixtures";

const AUTH = (login?: string) => `Basic ${btoa(login || ":")}`;

async function loginAs(context: any, role: Privilege, login?: string) {
  await context.addCookies([
    { name: "privilege", value: role, url: "http://localhost:3000" },
  ]);
  await context.setExtraHTTPHeaders({ Authorization: AUTH(login) });
}

test.describe("[mixologist] orders screen", () => {
  test("action buttons show text labels only when there is room", async ({
    page,
    context,
    testEvent,
  }) => {
    await loginAs(context, Privilege.MIXOLOGIST, process.env.MIXOLOGIST_LOGIN);
    await page.goto(`/event/${testEvent.slug}/orders`);

    const label = page
      .getByRole("button", { name: "Ready for pickup" })
      .first()
      .locator("span");
    await expect(label).toBeAttached();

    // Below Tailwind's `sm` breakpoint (phone in portrait) the label is
    // visually hidden (1px, sr-only); otherwise it is rendered as text.
    const box = await label.boundingBox();
    const narrow = (page.viewportSize()?.width ?? 1280) < 640;
    if (narrow) {
      expect(box!.width).toBeLessThan(5);
    } else {
      expect(box!.width).toBeGreaterThan(40);
    }
  });

  test("shows when each order was placed", async ({ page, context, testEvent }) => {
    await loginAs(context, Privilege.MIXOLOGIST, process.env.MIXOLOGIST_LOGIN);
    await page.goto(`/event/${testEvent.slug}/orders`);

    await expect(page.locator("time").first()).toContainText(/ago/);
  });

  test("no Cancel button unless the admin enabled it", async ({
    page,
    context,
    testEvent,
  }) => {
    await loginAs(context, Privilege.MIXOLOGIST, process.env.MIXOLOGIST_LOGIN);
    await page.goto(`/event/${testEvent.slug}/orders`);

    await expect(
      page.getByRole("button", { name: "Ready for pickup" }).first(),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Cancel", exact: true })).toHaveCount(0);
  });
});

test.describe("[admin] allow baristas to cancel orders", () => {
  test("admin enables it, barista can then cancel an order", async ({
    page,
    context,
    browser,
  }, workerInfo) => {
    const baseURL = workerInfo.project.use.baseURL || "http://localhost:3000";
    const slug = `test-cancel-${workerInfo.workerIndex}-${Math.random().toString(36).slice(2, 7)}`;
    await deleteIfExists(baseURL, slug);
    await createEvent(baseURL, slug, `Cx-${slug.slice(-6)}`);
    await createOrder(baseURL, slug, "queued", "cancel me");

    try {
      // Admin flips the switch on the event page.
      await loginAs(context, Privilege.ADMIN, process.env.ADMIN_LOGIN);
      await page.goto(`/event/${slug}`);
      const toggle = page.getByRole("switch", { name: "Allow staff to cancel orders" });
      await expect(toggle).toBeVisible();
      await expect(toggle).not.toBeChecked();
      await toggle.click();
      await expect(toggle).toBeChecked();

      // A barista (mixologist) now sees Cancel and can use it.
      const baristaContext = await browser.newContext();
      await loginAs(baristaContext, Privilege.MIXOLOGIST, process.env.MIXOLOGIST_LOGIN);
      const baristaPage = await baristaContext.newPage();
      await baristaPage.goto(`${baseURL}/event/${slug}/orders`);

      const cancel = baristaPage.getByRole("button", { name: "Cancel", exact: true }).first();
      await expect(cancel).toBeVisible();
      await cancel.click();
      await baristaPage.getByRole("button", { name: "Cancel order" }).click();

      await expect(baristaPage.getByText("Order Cancelled").first()).toBeVisible();
      await baristaPage.getByTestId("cancelledTab").click();
      await expect(baristaPage.getByText("cancel me")).toBeVisible();
      await baristaContext.close();
    } finally {
      await deleteIfExists(baseURL, slug);
    }
  });
});
