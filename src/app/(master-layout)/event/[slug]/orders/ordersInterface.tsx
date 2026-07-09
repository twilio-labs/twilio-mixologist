"use client";

import { useState, useEffect, useRef } from "react";
import { useSyncList, useSyncMap } from "@/provider/syncProvider";

import type { Event } from "@/types";
import { EventState } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import HeaderControls from "./headerControls";
import OrdersList from "./ordersList";

function playChime(ctx: AudioContext) {
  const frequencies = [880, 1100, 1320];
  frequencies.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.value = freq;
    const start = ctx.currentTime + i * 0.12;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.3, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.4);
    osc.start(start);
    osc.stop(start + 0.4);
  });
}

export default function OrdersInterface({
  slug,
  terminalId,
  terminalCount,
}: {
  slug: string;
  terminalId?: number;
  terminalCount?: number;
}) {
  if (
    !process.env.NEXT_PUBLIC_CONFIG_DOC ||
    !process.env.NEXT_PUBLIC_EVENTS_MAP
  ) {
    throw new Error("No config doc specified");
  }
  const { toast } = useToast();
  const [muted, setMuted] = useState(true);
  const prevOrderCount = useRef<number | null>(null);
  const audioCtx = useRef<AudioContext | null>(null);

  function getOrCreateAudioCtx(): AudioContext {
    if (!audioCtx.current) {
      audioCtx.current = new AudioContext();
    }
    return audioCtx.current;
  }

  async function fetchUpdateEvent(newState: {
    cancelledCount?: number;
    state?: EventState;
    deliveredCount?: number;
  }) {
    try {
      await fetch(`/api/event/${slug}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newState),
      });
    } catch (e: any) {
      console.error(e);
      toast({
        title: "Could not update event",
        description: e?.message,
      });
    }
  }

  const [eventsMap, _, mapInitialized] = useSyncMap(
    process.env.NEXT_PUBLIC_EVENTS_MAP,
    [slug],
  );
  // @ts-ignore TODO Fix this TS issue
  const internalEvent = eventsMap?.get(slug) as Event;

  let [ordersList, , updateOrder, , orderListInitialized] = useSyncList(
    slug,
    300,
  );

  const totalOrders = Array.isArray(ordersList) ? ordersList.length : 0;
  useEffect(() => {
    if (!orderListInitialized) return;
    if (prevOrderCount.current === null) {
      prevOrderCount.current = totalOrders;
      return;
    }
    if (totalOrders > prevOrderCount.current && !muted && audioCtx.current) {
      playChime(audioCtx.current);
    }
    prevOrderCount.current = totalOrders;
  }, [totalOrders, muted, orderListInitialized]);

  if (!mapInitialized || !internalEvent || !orderListInitialized) {
    return (
      <div className="w-full space-y-3">
        <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse" />
        <div className="h-16 bg-gray-100 rounded-xl animate-pulse" />
        <div className="h-16 bg-gray-100 rounded-xl animate-pulse opacity-70" />
        <div className="h-16 bg-gray-100 rounded-xl animate-pulse opacity-40" />
      </div>
    );
  }

  let terminalSuffix = "";
  if (terminalCount && terminalId && terminalCount > 0 && terminalId > 0) {
    terminalSuffix = `Terminal ${terminalId} of ${terminalCount}`;
    // @ts-ignore
    ordersList = ordersList.filter((order: any) => {
      const visibleInTerminal =
        order.descriptor.index % terminalCount === terminalId - 1;
      const queuedOrReady =
        order.descriptor.data.status === "queued" ||
        order.descriptor.data.status === "ready";

      return visibleInTerminal || !queuedOrReady;
    });
  }

  return (
    <div className="w-full">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-twilio-ink tracking-tight">
            {internalEvent?.name}
          </h2>
          {terminalSuffix && (
            <p className="text-sm text-gray-400 mt-0.5">{terminalSuffix}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              const ctx = getOrCreateAudioCtx();
              const nowMuted = !muted;
              setMuted(nowMuted);
              if (!nowMuted) playChime(ctx);
            }}
            title={muted ? "Unmute order notifications" : "Mute order notifications"}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            {muted ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
              </svg>
            )}
          </button>
          <HeaderControls event={internalEvent} updateEvent={fetchUpdateEvent} />
        </div>
      </div>
      <OrdersList
        // @ts-ignore // TODO Fix this TS issue
        ordersList={ordersList}
        // @ts-ignore // TODO Fix this TS issue
        updateOrder={updateOrder}
        event={internalEvent}
        updateEvent={fetchUpdateEvent}
      />
    </div>
  );
}
