"use client";

import { useState } from "react";
import { Privilege } from "@/proxy";
import { getCookie } from "cookies-next";
import { sendMessage } from "@/lib/twilio";
import { Badge } from "@/components/ui/badge";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

import type { Event } from "@/types";

import { Check, BellRing, UserCheck } from "lucide-react";
import {
  getOrderReadyMessage,
  getOrderReadyReminderMessage,
} from "@/scripts/fetchContentTemplates";

export default function OrdersList({
  ordersList,
  event,
  updateEvent,
  updateOrder,
}: {
  ordersList: any[];
  event: Event;
  updateEvent: (data: any) => void;
  updateOrder: (index: number, data: any) => void;
}) {
  const { toast } = useToast();
  const [noOfOrdersVisible, showMore] = useState<number>(50);
  const [processingOrders, setProcessingOrders] = useState<Set<string>>(
    new Set(),
  );

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
  const cancelled = listComponent(
    ordersList.filter((order) => order.data.status === "cancelled"),
  );

  return (
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
          {event?.cancelledCount != undefined && event.cancelledCount > 0 && (
            <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 rounded-full bg-gray-300 text-gray-700 text-xs font-bold px-1">
              {event.cancelledCount}
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
  );

  function toAddress(data: any): string {
    if (data.channel === "whatsapp") return `whatsapp:${data.key}`;
    if (data.channel === "rcs") return `rcs:${data.key}`;
    return data.key;
  }

  function listComponent(orders: any[]) {
    return orders.map((order) => {
      const { data, index, dateUpdated } = order;

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
            </p>
          </div>

          {/* Status + actions */}
          {isPriviledged && (
            <div className="flex items-center gap-2 flex-shrink-0">
              {isReady && !data?.manual && (
                <button
                  aria-label="Send reminder"
                  disabled={
                    isProcessing(index, "remind") ||
                    (Date.now() - dateUpdated < 3 * 60 * 1000 && data?.reminded)
                  }
                  className="w-10 h-10 rounded-lg border border-amber-300 bg-amber-50 text-amber-600 hover:bg-amber-100 disabled:opacity-40 flex items-center justify-center transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-amber-500 focus-visible:outline-none"
                  onClick={async () => {
                    startProcessing(index, "remind");
                    try {
                      const message = await getOrderReadyReminderMessage(
                        data.item, index, event.pickupLocation, event.language,
                      );
                      sendMessage(toAddress(data), "", message.contentSid, message.contentVariables);
                      updateOrder(index, { reminded: true });
                      toast({ title: "Customer Reminded", description: "Reminder sent." });
                    } finally {
                      stopProcessing(index, "remind");
                    }
                  }}
                >
                  <BellRing aria-hidden="true" className="h-4 w-4" />
                </button>
              )}
              {isQueued && (
                <button
                  aria-label="Mark order ready"
                  disabled={isProcessing(index, "made")}
                  className="w-10 h-10 rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-40 flex items-center justify-center transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
                  onClick={async () => {
                    startProcessing(index, "made");
                    try {
                      updateOrder(index, { status: "ready" });
                      if (!data?.manual) {
                        const message = await getOrderReadyMessage(
                          data.item, index, event.pickupLocation, event.language,
                        );
                        sendMessage(toAddress(data), "", message.contentSid, message.contentVariables);
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
                </button>
              )}
              {isReady && (
                <button
                  aria-label="Mark order served"
                  disabled={isProcessing(index, "served")}
                  className="w-10 h-10 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-40 flex items-center justify-center transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-emerald-600 focus-visible:outline-none"
                  onClick={async () => {
                    startProcessing(index, "served");
                    try {
                      updateOrder(index, { status: "delivered" });
                      await updateEvent({ deliveredCount: Number(event?.deliveredCount || 0) + 1 });
                      toast({ title: "Order Served", description: "Order marked as delivered." });
                    } finally {
                      stopProcessing(index, "served");
                    }
                  }}
                >
                  <UserCheck aria-hidden="true" className="h-4 w-4" />
                </button>
              )}
            </div>
          )}
        </div>
      );
    });
  }
}
