import { describe, test, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import type { Event } from "@/types";

vi.mock("cookies-next", () => ({ getCookie: () => "mixologist" }));
vi.mock("@/lib/actions", () => ({
  sendMessage: vi.fn(),
  getPinnedSender: vi.fn().mockResolvedValue(""),
  getOrderReadyMessage: vi.fn(),
  getOrderReadyReminderMessage: vi.fn(),
  getOrderCancelledMessage: vi.fn(),
}));

import OrdersList from "@/app/(master-layout)/event/[slug]/orders/ordersList";

const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000);

// Sync list items have no dateCreated: the creation time is stored in
// data.createdAt, with dateUpdated as the fallback for untouched queued orders.
const orders = [
  {
    index: 1,
    dateUpdated: minutesAgo(5),
    data: {
      key: "+1555",
      item: "Espresso",
      status: "queued",
      originalText: "one espresso pls",
      createdAt: minutesAgo(5).toISOString(),
    },
  },
  {
    index: 2,
    dateUpdated: minutesAgo(1),
    data: { key: "+1556", item: "Latte", status: "ready", createdAt: minutesAgo(12).toISOString() },
  },
  // legacy orders created before createdAt existed
  { index: 3, dateUpdated: minutesAgo(30), data: { key: "+1557", item: "Mocha", status: "queued" } },
  { index: 4, dateUpdated: minutesAgo(1), data: { key: "+1558", item: "Chai", status: "ready" } },
];

function renderList(event: Partial<Event> = {}) {
  return render(
    <OrdersList
      ordersList={orders}
      event={{ slug: "e", ...event } as Event}
      updateEvent={vi.fn()}
      updateOrder={vi.fn()}
    />,
  );
}

afterEach(cleanup);

describe("OrdersList action buttons", () => {
  test("buttons have text labels (hidden visually only below the sm breakpoint)", () => {
    renderList();
    const ready = screen.getAllByRole("button", { name: "Ready for pickup" })[0];
    expect(ready).toBeTruthy();
    expect(screen.getAllByRole("button", { name: "Remind" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("button", { name: "Complete" }).length).toBeGreaterThan(0);
    // label is sr-only on phones in portrait, visible from sm up
    const label = ready.querySelector("span")!;
    expect(label.className).toContain("sr-only");
    expect(label.className).toContain("sm:not-sr-only");
  });
});

describe("OrdersList time ago", () => {
  test("shows how long ago each order was placed", () => {
    renderList();
    expect(screen.getByText(/5 minutes ago/)).toBeTruthy();
    expect(screen.getByText(/12 minutes ago/)).toBeTruthy();
  });

  test("sits next to the original message", () => {
    renderList();
    const subtitle = screen.getByText(/one espresso pls/).closest("p")!;
    expect(subtitle.textContent).toMatch(/one espresso pls.*5 minutes ago/);
  });

  test("legacy orders: queued falls back to dateUpdated, ready shows nothing", () => {
    renderList();
    expect(screen.getByText(/30 minutes ago/)).toBeTruthy(); // #3 queued, no createdAt
    // #4 is ready without createdAt: dateUpdated is the ready time, so don't claim it as placed time
    expect(document.querySelectorAll("time")).toHaveLength(3);
  });
});

describe("OrdersList cancel button", () => {
  test("hidden by default", () => {
    renderList();
    expect(screen.queryByRole("button", { name: "Cancel" })).toBeNull();
  });

  test("hidden when explicitly disabled", () => {
    renderList({ allowBaristaCancel: false });
    expect(screen.queryByRole("button", { name: "Cancel" })).toBeNull();
  });

  test("shown for queued and ready orders when the admin enables it", () => {
    renderList({ allowBaristaCancel: true });
    expect(screen.getAllByRole("button", { name: "Cancel" })).toHaveLength(4);
  });
});
