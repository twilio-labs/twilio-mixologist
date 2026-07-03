"use client";

import { useState } from "react";
import { Privilege } from "@/proxy";
import { getCookie } from "cookies-next";

import { useToast } from "@/components/ui/use-toast";
import { Popover, PopoverTrigger } from "@/components/ui/popover";
import BroadcastPopoverContent from "./broadcast-popover-content";
import CustomOrderPopoverContent from "./custom-order-popover-content";

import type { Event } from "@/types";
import { EventState } from "@/lib/utils";

import {
  PauseIcon,
  PlayIcon,
  MessageSquareIcon,
  BanIcon,
  PlusIcon,
} from "lucide-react";

export default function HeaderControls({
  event,
  updateEvent,
}: {
  event: Event;
  updateEvent: (data: any) => void;
}) {
  const { toast } = useToast();

  const [broadcastPopoverIsOpen, openBroadcastPopover] = useState(false);
  const [customOrderPopoverIsOpen, openCustomOrderPopover] = useState(false);
  const [isUpdatingEvent, setIsUpdatingEvent] = useState(false);

  const isPriviledged = [Privilege.ADMIN, Privilege.MIXOLOGIST].includes(
    getCookie("privilege") as Privilege,
  );

  if (!isPriviledged) return null;

  const btnBase = "w-10 h-10 rounded-lg flex items-center justify-center transition-colors disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-twilio-ink focus-visible:outline-none";

  return (
    <div className="flex items-center gap-2">
      <Popover open={customOrderPopoverIsOpen} onOpenChange={openCustomOrderPopover}>
        <PopoverTrigger asChild>
          <button
            aria-label="Add manual order"
            onClick={() => openCustomOrderPopover(true)}
            className={`${btnBase} border border-warm-strong bg-white hover:bg-warm text-gray-600`}
          >
            <PlusIcon aria-hidden="true" className="h-4 w-4" />
          </button>
        </PopoverTrigger>
        <CustomOrderPopoverContent
          selection={event.selection}
          eventSlug={event.slug}
          closePopover={() => openCustomOrderPopover(false)}
        />
      </Popover>

      <Popover open={broadcastPopoverIsOpen} onOpenChange={openBroadcastPopover}>
        <PopoverTrigger asChild>
          <button
            aria-label="Broadcast message"
            onClick={() => openBroadcastPopover(true)}
            className={`${btnBase} border border-warm-strong bg-white hover:bg-warm text-gray-600`}
          >
            <MessageSquareIcon aria-hidden="true" className="h-4 w-4" />
          </button>
        </PopoverTrigger>
        <BroadcastPopoverContent
          eventSlug={event.slug}
          closePopover={() => openBroadcastPopover(false)}
        />
      </Popover>

      <button
        data-testid="pause-orders"
        disabled={event.state === EventState.ENDED || isUpdatingEvent}
        aria-label={event.state === EventState.OPEN ? "Pause orders" : "Resume orders"}
        className={`${btnBase} ${
          event.state === EventState.OPEN
            ? "bg-amber-50 border border-amber-300 text-amber-600 hover:bg-amber-100"
            : event.state === EventState.ENDED
              ? "bg-gray-100 border border-gray-200 text-gray-400"
              : "bg-emerald-50 border border-emerald-300 text-emerald-700 hover:bg-emerald-100"
        }`}
        onClick={async () => {
          setIsUpdatingEvent(true);
          try {
            await updateEvent({
              state: event?.state === EventState.OPEN ? EventState.CLOSED : EventState.OPEN,
            });
            toast({
              title: event?.state === EventState.OPEN ? "Orders Paused" : "Orders Resumed",
              description: `Attendees can ${event?.state === EventState.OPEN ? "no longer" : "now"} place new orders`,
            });
          } finally {
            setIsUpdatingEvent(false);
          }
        }}
      >
        {event.state === EventState.CLOSED && <PlayIcon aria-hidden="true" className="h-4 w-4" />}
        {event.state === EventState.OPEN && <PauseIcon aria-hidden="true" className="h-4 w-4" />}
        {event.state === EventState.ENDED && <BanIcon aria-hidden="true" className="h-4 w-4" />}
      </button>
    </div>
  );
}
