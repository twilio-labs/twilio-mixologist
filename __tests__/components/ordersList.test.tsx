import { describe, test, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent, waitFor } from "@testing-library/react";
import type { Event } from "@/types";

const { toast, actions } = vi.hoisted(() => ({
  toast: vi.fn(),
  actions: {
    sendMessage: vi.fn(),
    getPinnedSender: vi.fn(),
    getOrderReadyMessage: vi.fn(),
    getOrderReadyReminderMessage: vi.fn(),
    getOrderCancelledMessage: vi.fn(),
  },
}));

vi.mock("cookies-next", () => ({ getCookie: () => "mixologist" }));
vi.mock("@/components/ui/use-toast", () => ({ useToast: () => ({ toast }) }));
vi.mock("@/lib/actions", () => actions);


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

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

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

describe("OrdersList cancelled tab badge", () => {
  test("counts cancelled orders in the list", () => {
    const list = [
      { index: 7, dateUpdated: minutesAgo(1), data: { key: "a", item: "Tea", status: "cancelled" } },
      { index: 8, dateUpdated: minutesAgo(1), data: { key: "b", item: "Tea", status: "cancelled" } },
      ...orders,
    ];
    render(
      <OrdersList
        ordersList={list}
        event={{ slug: "e" } as Event}
        updateEvent={vi.fn()}
        updateOrder={vi.fn()}
      />,
    );
    expect(screen.getByTestId("cancelledTab").textContent).toBe("Cancelled2");
  });
});

describe("OrdersList cancel flow", () => {
  const ok = async () => ({ contentSid: "HX", contentVariables: "{}" });
  const boom = async () => {
    throw new Error("no template");
  };

  function setup(
    o: {
      updateOrder?: any;
      updateEvent?: any;
      template?: any;
      send?: any;
      order?: any;
    } = {},
  ) {
    const updateOrder = o.updateOrder ?? vi.fn().mockResolvedValue(undefined);
    const updateEvent = o.updateEvent ?? vi.fn().mockResolvedValue(undefined);
    actions.getPinnedSender.mockResolvedValue("+1000");
    actions.sendMessage.mockImplementation(o.send ?? (async () => undefined));
    actions.getOrderCancelledMessage.mockImplementation(o.template ?? ok);
    const props = {
      ordersList: [o.order ?? orders[0]],
      updateEvent,
      updateOrder,
    };
    render(<OrdersList {...props} event={{ slug: "e", allowBaristaCancel: true } as Event} />);
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    return { updateOrder, updateEvent };
  }

  const banner = () => screen.queryByRole("alert");

  test("send itself fails: banner, no success toast", async () => {
    setup({ send: async () => { throw new Error("twilio 400"); } });
    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(actions.sendMessage).toHaveBeenCalledTimes(1);
    expect(toast).not.toHaveBeenCalled();
  });

  test("everything succeeds: cancelled, notified, success toast, no counter write", async () => {
    const { updateOrder, updateEvent } = setup();
    await waitFor(() => expect(toast).toHaveBeenCalled());
    expect(updateOrder).toHaveBeenCalledWith(1, { status: "cancelled" });
    expect(updateEvent).not.toHaveBeenCalled();
    expect(actions.sendMessage).toHaveBeenCalledTimes(1);
    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Order #1 cancelled", description: "The customer has been notified." }),
    );
    expect(banner()).toBeNull();
  });

  test("order save fails: nothing else happens, error toast", async () => {
    setup({ updateOrder: vi.fn().mockRejectedValue(new Error("sync down")) });
    await waitFor(() => expect(toast).toHaveBeenCalled());
    expect(actions.getOrderCancelledMessage).not.toHaveBeenCalled();
    expect(actions.sendMessage).not.toHaveBeenCalled();
    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({
        variant: "destructive",
        title: "Couldn't cancel order #1",
        description: "Nothing changed. Try again.",
      }),
    );
    expect(banner()).toBeNull();
  });

  test("message fails: order stays cancelled, banner with Retry and Undo", async () => {
    const { updateOrder } = setup({ template: boom });
    const alert = await screen.findByRole("alert");
    expect(actions.getOrderCancelledMessage).toHaveBeenCalledTimes(1);
    expect(updateOrder).toHaveBeenCalledTimes(1);
    expect(alert.textContent).toMatch(/Order #1 is cancelled, but the message to the customer didn.t go out/);
    expect(screen.getByRole("button", { name: "Retry message" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Undo cancel" })).toBeTruthy();
    expect(toast).not.toHaveBeenCalled();
  });

  test("Retry message succeeds: banner goes away", async () => {
    setup({ template: boom });
    await screen.findByRole("alert");
    actions.getOrderCancelledMessage.mockImplementation(ok);
    fireEvent.click(screen.getByRole("button", { name: "Retry message" }));
    await waitFor(() => expect(banner()).toBeNull());
    expect(toast).toHaveBeenCalledWith(expect.objectContaining({ title: "Order #1: customer notified" }));
  });

  test("Retry message fails again: banner stays", async () => {
    setup({ template: boom });
    await screen.findByRole("alert");
    fireEvent.click(screen.getByRole("button", { name: "Retry message" }));
    await waitFor(() =>
      expect(toast).toHaveBeenCalledWith(expect.objectContaining({ title: "The message still didn't go out" })),
    );
    expect(banner()).toBeTruthy();
  });

  test("Undo cancel restores the previous status", async () => {
    const { updateOrder, updateEvent } = setup({ template: boom });
    await screen.findByRole("alert");
    fireEvent.click(screen.getByRole("button", { name: "Undo cancel" }));
    await waitFor(() => expect(banner()).toBeNull());
    expect(updateOrder).toHaveBeenLastCalledWith(1, { status: "queued" });
    expect(updateEvent).not.toHaveBeenCalled();
    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Order #1 restored", description: "Back in the queue." }),
    );
  });

  test("Undo cancel fails: banner stays, error toast", async () => {
    const updateOrder = vi.fn().mockResolvedValueOnce(undefined).mockRejectedValue(new Error("sync down"));
    setup({ template: boom, updateOrder });
    await screen.findByRole("alert");
    fireEvent.click(screen.getByRole("button", { name: "Undo cancel" }));
    await waitFor(() =>
      expect(toast).toHaveBeenCalledWith(expect.objectContaining({ title: "Couldn't undo the cancel" })),
    );
    expect(banner()).toBeTruthy();
  });

  test("manual order: no message attempted, barista asked to inform the customer", async () => {
    setup({ order: { ...orders[0], data: { ...orders[0].data, manual: true } } });
    await waitFor(() => expect(toast).toHaveBeenCalled());
    expect(actions.getOrderCancelledMessage).not.toHaveBeenCalled();
    expect(actions.sendMessage).not.toHaveBeenCalled();
    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Order #1 cancelled", description: "Please inform the customer." }),
    );
  });
});
