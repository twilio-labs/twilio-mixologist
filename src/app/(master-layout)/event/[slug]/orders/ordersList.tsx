"use client";

import { useEffect, useState } from "react";
import { formatDistanceToNowStrict } from "date-fns";
import { Privilege } from "@/proxy";
import { getCookie } from "cookies-next";
import {
  sendMessage,
  getPinnedSender,
  getOrderReadyMessage,
  getOrderReadyReminderMessage,
  getOrderCancelledMessage,
} from "@/lib/actions";
import { Badge } from "@/components/ui/badge";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

import type { Event } from "@/types";


import { Check, BellRing, UserCheck, XCircle, TriangleAlert } from "lucide-react";

// Icon-only on small screens (phones in portrait, < 640px); icon + text from
// the `sm` breakpoint up. The text stays in the DOM (sr-only) so the button
// always has an accessible name.
const BUTTON_LABEL = "sr-only sm:not-sr-only text-sm font-medium whitespace-nowrap";

// A cancelled order whose customer could not be told. Staff have no other way
// to reach attendees, so this stays on screen until the message goes out or
// the cancel is undone.
type UnnotifiedCancel = {
  data: any;
  previousStatus: "queued" | "ready";
};

export default function OrdersList({
  ordersList,
  event,
  updateEvent,
  updateOrder,
}: {
  ordersList: any[];
  event: Event;
  updateEvent: (data: any) => void | Promise<void>;
  updateOrder: (index: number, data: any) => void | Promise<void>;
}) {
  const { toast } = useToast();
  const [noOfOrdersVisible, showMore] = useState<number>(50);
  const [processingOrders, setProcessingOrders] = useState<Set<string>>(
    new Set(),
  );

  const [unnotified, setUnnotified] = useState<Record<number, UnnotifiedCancel>>({});

  function clearUnnotified(index: number) {
    setUnnotified((prev) => {
      const { [index]: _, ...rest } = prev;
      return rest;
    });
  }

  // One shared clock for all "x min ago" labels instead of a timer per row.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  function startProcessing(index: number, action: string) {
    setProcessingOrders((prev) => new Set(prev).add(`${index}-${action}`));
  }

  function stopProcessing(index: number, action: string) {
    setProcessingOrders((prev) => {
      const next = new Set(prev);
      next.delete(`${index}-${action}`);
      return next;
    });
  }

  function isProcessing(index: number, action: string) {
    return processingOrders.has(`${index}-${action}`);
  }

  const isPriviledged = [Privilege.ADMIN, Privilege.MIXOLOGIST].includes(
    getCookie("privilege") as Privilege,
  );
  const queue = ordersList.filter(
    (order) => order.data.status === "queued" || order.data.status === "ready",
  );
  const visibleQueue = listComponent(queue.toSpliced(noOfOrdersVisible));
  const delivered = listComponent(
    ordersList.filter((order) => order.data.status === "delivered"),
  );
  const cancelledOrders = ordersList.filter((order) => order.data.status === "cancelled");
  const cancelled = listComponent(cancelledOrders);

  const unnotifiedEntries = Object.entries(unnotified);

  return (
    <>
    {isPriviledged && unnotifiedEntries.length > 0 && (
      <div role="alert" className="mb-4 space-y-2">
        {unnotifiedEntries.map(([key, entry]) => {
          const index = Number(key);
          const busy = isProcessing(index, "notify") || isProcessing(index, "undo");
          return (
            <div
              key={key}
              className="border border-red-300 bg-red-50 rounded-xl px-4 py-3 flex flex-wrap items-center gap-3"
            >
              <TriangleAlert aria-hidden="true" className="h-5 w-5 text-red-600 flex-shrink-0" />
              <p className="flex-1 min-w-[12rem] text-sm text-red-800">
                <span className="font-semibold">Order #{index} is cancelled,</span> but the
                message to the customer didn&apos;t go out.
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  disabled={busy}
                  onClick={() => retryNotification(index, entry)}
                >
                  Retry message
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={() => undoCancel(index, entry)}
                >
                  Undo cancel
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    )}
    <Tabs defaultValue="queue" className="w-full">
      <TabsList className="flex bg-warm border border-warm-strong rounded-lg p-1 h-auto mb-4">
        <TabsTrigger
          data-testid="queueTab"
          className="flex-1 flex items-center justify-center gap-2 rounded-md py-2 text-sm font-medium text-gray-500 data-[state=active]:bg-white data-[state=active]:text-twilio-ink data-[state=active]:shadow-xs transition-all"
          value="queue"
        >
          Queue
          {queue.length > 0 && (
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-twilio-red text-white text-xs font-bold">
              {queue.length}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger
          data-testid="cancelledTab"
          className="flex-1 flex items-center justify-center gap-2 rounded-md py-2 text-sm font-medium text-gray-500 data-[state=active]:bg-white data-[state=active]:text-twilio-ink data-[state=active]:shadow-xs transition-all"
          value="cancelled"
        >
          Cancelled
          {cancelledOrders.length > 0 && (
            <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 rounded-full bg-gray-300 text-gray-700 text-xs font-bold px-1">
              {cancelledOrders.length}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger
          data-testid="deliveredTab"
          className="flex-1 flex items-center justify-center gap-2 rounded-md py-2 text-sm font-medium text-gray-500 data-[state=active]:bg-white data-[state=active]:text-twilio-ink data-[state=active]:shadow-xs transition-all"
          value="delivered"
        >
          Delivered
          {event?.deliveredCount != undefined && event.deliveredCount > 0 && (
            <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 rounded-full bg-green-100 text-green-700 text-xs font-bold px-1">
              {event.deliveredCount}
            </span>
          )}
        </TabsTrigger>
      </TabsList>
      <TabsContent value="queue">
        {visibleQueue}
        {queue.length > visibleQueue.length && (
          <button
            className="w-full mt-2 py-2.5 rounded-lg border border-warm-strong text-sm text-gray-500 hover:bg-warm transition-colors"
            onClick={() => showMore(noOfOrdersVisible + 10)}
          >
            Show {queue.length - noOfOrdersVisible} more
          </button>
        )}
      </TabsContent>
      <TabsContent value="cancelled">{cancelled}</TabsContent>
      <TabsContent value="delivered">{delivered}</TabsContent>
    </Tabs>
    </>
  );

  async function notifyCancelled(index: number, data: any) {
    const [message, from] = await Promise.all([
      getOrderCancelledMessage(data.item, String(index), event.language),
      pinnedFrom(data.key),
    ]);
    await sendMessage(toAddress(data), "", message.contentSid, message.contentVariables, from);
  }

  async function cancelOrder(index: number, data: any) {
    startProcessing(index, "cancel");
    try {
      // 1. The order itself. If this fails nothing else happens.
      try {
        await updateOrder(index, { status: "cancelled" });
      } catch (e) {
        console.error("Cancelling order failed", e);
        toast({
          variant: "destructive",
          title: `Couldn't cancel order #${index}`,
          description: "Nothing changed. Try again.",
        });
        return;
      }

      if (data?.manual) {
        toast({ title: `Order #${index} cancelled`, description: "Please inform the customer." });
        return;
      }

      // 2. Tell the customer.
      try {
        await notifyCancelled(index, data);
        toast({ title: `Order #${index} cancelled`, description: "The customer has been notified." });
      } catch (e) {
        console.error("Cancellation message failed", e);
        setUnnotified((prev) => ({
          ...prev,
          [index]: { data, previousStatus: data.status },
        }));
      }
    } finally {
      stopProcessing(index, "cancel");
    }
  }

  async function retryNotification(index: number, entry: UnnotifiedCancel) {
    startProcessing(index, "notify");
    try {
      await notifyCancelled(index, entry.data);
      clearUnnotified(index);
      toast({ title: `Order #${index}: customer notified` });
    } catch (e) {
      console.error("Retrying cancellation message failed", e);
      toast({
        variant: "destructive",
        title: "The message still didn't go out",
        description: `Try again, or undo the cancel to put order #${index} back.`,
      });
    } finally {
      stopProcessing(index, "notify");
    }
  }

  async function undoCancel(index: number, entry: UnnotifiedCancel) {
    startProcessing(index, "undo");
    try {
      await updateOrder(index, { status: entry.previousStatus });
    } catch (e) {
      console.error("Undoing cancel failed", e);
      toast({
        variant: "destructive",
        title: `Couldn't undo the cancel`,
        description: `Order #${index} is still cancelled. Try again.`,
      });
      stopProcessing(index, "undo");
      return;
    }
    clearUnnotified(index);
    stopProcessing(index, "undo");
    toast({
      title: `Order #${index} restored`,
      description: entry.previousStatus === "ready" ? "Back to ready for pickup." : "Back in the queue.",
    });
  }

  function timeAgo(date: Date | string | number): string {
    // Clamp so a slightly-ahead client clock never renders "in 0 seconds".
    const created = Math.min(new Date(date).getTime(), now);
    return formatDistanceToNowStrict(created, { addSuffix: true });
  }

  function toAddress(data: any): string {
    if (data.channel === "whatsapp") return `whatsapp:${data.key}`;
    if (data.channel === "rcs") return `rcs:${data.key}`;
    return data.key;
  }

  // The sender the attendee last messaged in on — pinned so replies never
  // come from a different Messaging Service-selected sender/channel.
  function pinnedFrom(phone: string): Promise<string> {
    return getPinnedSender(process.env.NEXT_PUBLIC_ATTENDEES_MAP || "", phone);
  }

  function listComponent(orders: any[]) {
    return orders.map((order) => {
      const { data, index, dateUpdated } = order;
      // Sync list items only carry dateUpdated, so the creation time is stored
      // in the order itself. For older orders without it, dateUpdated is the
      // creation time as long as the order is still untouched in the queue.
      const placedAt: Date | string | undefined =
        data?.createdAt ?? (data?.status === "queued" ? dateUpdated : undefined);

      const isQueued = data.status === "queued";
      const isReady = data.status === "ready";
      const isDelivered = data.status === "delivered";
      const isCancelled = data.status === "cancelled";

      const rowBg = isCancelled
        ? "bg-red-50 border-red-200"
        : isReady
          ? "bg-emerald-50 border-emerald-200"
          : isDelivered
            ? "bg-gray-50 border-warm opacity-60"
            : "bg-white border-warm";

      return (
        <div
          key={index}
          className={`${rowBg} border rounded-xl px-4 py-3 flex items-center gap-4 mb-2 transition-colors`}
        >
          {/* Order number */}
          <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-twilio-ink flex items-center justify-center">
            <span className="text-white font-bold text-sm">#{index}</span>
          </div>

          {/* Order details */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-twilio-ink text-base leading-snug">
              {data.item}
              {data?.modifiers && (
                <span className="text-gray-500 font-normal"> · {data.modifiers}</span>
              )}
            </h3>
            <p className="text-xs text-gray-400 truncate mt-0.5">
              {data?.manual ? data?.name : data?.address}
              {data?.originalText && (
                <span className="ml-1 italic">&ldquo;{data.originalText}&rdquo;</span>
              )}
              {placedAt && (
                <time
                  dateTime={new Date(placedAt).toISOString()}
                  title={new Date(placedAt).toLocaleString()}
                  className="ml-1.5 text-gray-400 whitespace-nowrap"
                >
                  · {timeAgo(placedAt)}
                </time>
              )}
            </p>
          </div>

          {/* Status + actions */}
          {isPriviledged && (
            <div className="flex items-center gap-2 flex-shrink-0">
              {isReady && !data?.manual && (
                <button
                  title="Remind the customer"
                  disabled={
                    isProcessing(index, "remind") ||
                    (Date.now() - dateUpdated < 3 * 60 * 1000 && data?.reminded)
                  }
                  className="h-10 min-w-10 px-2.5 sm:px-3 gap-2 rounded-lg border border-amber-300 bg-amber-50 text-amber-600 hover:bg-amber-100 disabled:opacity-40 flex items-center justify-center transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-amber-500 focus-visible:outline-none"
                  onClick={async () => {
                    startProcessing(index, "remind");
                    try {
                      const [message, from] = await Promise.all([
                        getOrderReadyReminderMessage(
                          data.item, index, event.pickupLocation, event.language,
                        ),
                        pinnedFrom(data.key),
                      ]);
                      sendMessage(toAddress(data), "", message.contentSid, message.contentVariables, from);
                      updateOrder(index, { reminded: true });
                      toast({ title: "Customer Reminded", description: "Reminder sent." });
                    } finally {
                      stopProcessing(index, "remind");
                    }
                  }}
                >
                  <BellRing aria-hidden="true" className="h-4 w-4" />
                  <span className={BUTTON_LABEL}>Remind</span>
                </button>
              )}
              {isQueued && (
                <button
                  title="Mark ready for pickup and notify the customer"
                  disabled={isProcessing(index, "made")}
                  className="h-10 min-w-10 px-2.5 sm:px-3 gap-2 rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-40 flex items-center justify-center transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
                  onClick={async () => {
                    startProcessing(index, "made");
                    try {
                      updateOrder(index, { status: "ready" });
                      if (!data?.manual) {
                        const [message, from] = await Promise.all([
                          getOrderReadyMessage(
                            data.item, index, event.pickupLocation, event.language,
                          ),
                          pinnedFrom(data.key),
                        ]);
                        sendMessage(toAddress(data), "", message.contentSid, message.contentVariables, from);
                      }
                      toast({
                        title: "Order Ready",
                        description: data?.manual
                          ? "Inform the customer their order is ready."
                          : "Customer has been notified.",
                      });
                    } finally {
                      stopProcessing(index, "made");
                    }
                  }}
                >
                  <Check aria-hidden="true" className="h-4 w-4" />
                  <span className={BUTTON_LABEL}>Ready for pickup</span>
                </button>
              )}
              {isReady && (
                <button
                  title="Complete: the customer has their order"
                  disabled={isProcessing(index, "served")}
                  className="h-10 min-w-10 px-2.5 sm:px-3 gap-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-40 flex items-center justify-center transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-emerald-600 focus-visible:outline-none"
                  onClick={async () => {
                    startProcessing(index, "served");
                    try {
                      updateOrder(index, { status: "delivered" });
                      await updateEvent({ deliveredCount: Number(event?.deliveredCount || 0) + 1 });
                      if (!data?.manual && event?.followUpMessage) {
                        const from = await pinnedFrom(data.key);
                        sendMessage(toAddress(data), event.followUpMessage, "", "", from);
                      }
                      toast({ title: "Order Served", description: "Order marked as delivered." });
                    } finally {
                      stopProcessing(index, "served");
                    }
                  }}
                >
                  <UserCheck aria-hidden="true" className="h-4 w-4" />
                  <span className={BUTTON_LABEL}>Complete</span>
                </button>
              )}
              {event?.allowBaristaCancel && (isQueued || isReady) && (
                <button
                  title="Cancel this order and notify the customer"
                  disabled={isProcessing(index, "cancel")}
                  onClick={() => cancelOrder(index, data)}
                  className="h-10 min-w-10 px-2.5 sm:px-3 gap-2 rounded-lg border border-red-300 bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-40 flex items-center justify-center transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-500 focus-visible:outline-none"
                >
                  <XCircle aria-hidden="true" className="h-4 w-4" />
                  <span className={BUTTON_LABEL}>Cancel</span>
                </button>
              )}
            </div>
          )}
        </div>
      );
    });
  }
}
