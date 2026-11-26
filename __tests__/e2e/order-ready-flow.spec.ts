import { Privilege } from "@/proxy";
import { test, expect, createEvent, createOrder, deleteIfExists } from "./fixtures";

// Regression: the "ready" and "remind" buttons look up WhatsApp/SMS content
// templates through staff-only Server Actions. If that lookup ever runs in the
// browser instead (missing secrets), the click fails with "Failed to fetch
// Templates" and no toast appears.
test.describe("[mixologist] mark ready and remind", () => {
  test("marking an order ready notifies and shows a toast; reminder works", async ({
    page,
    context,
  }, workerInfo) => {
    const baseURL = workerInfo.project.use.baseURL || "http://localhost:3000";
    const slug = `test-ready-${workerInfo.workerIndex}-${Math.random().toString(36).slice(2, 7)}`;
    await deleteIfExists(baseURL, slug);
    await createEvent(baseURL, slug, `Rd-${slug.slice(-6)}`);
    await createOrder(baseURL, slug, "queued", "make me ready");

    try {
      await context.addCookies([
        { name: "privilege", value: Privilege.MIXOLOGIST, url: "http://localhost:3000" },
      ]);
      await context.setExtraHTTPHeaders({
        Authorization: `Basic ${btoa(process.env.MIXOLOGIST_LOGIN || ":")}`,
      });
      await page.goto(`/event/${slug}/orders`);

      await page.getByRole("button", { name: /Ready for pickup|Mark order ready/ }).first().click();
      await expect(page.getByText("Order Ready").first()).toBeVisible();

      const remind = page.getByRole("button", { name: /^(Remind|Send reminder)$/ }).first();
      await expect(remind).toBeEnabled();
      await remind.click();
      await expect(page.getByText("Customer Reminded").first()).toBeVisible();
    } finally {
      await deleteIfExists(baseURL, slug);
    }
  });
});
