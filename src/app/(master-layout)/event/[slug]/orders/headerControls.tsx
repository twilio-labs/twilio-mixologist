"use client";

import { useState } from "react";
import { Privilege } from "@/middleware";
import { getCookie } from "cookies-next";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Popover, PopoverTrigger } from "@/components/ui/popover";
import BroadcastPopoverContent from "./broadcast-popover-content";
import CustomOrderPopoverContent from "./custom-order-popover-content";

import { Event } from "@/app/(master-layout)/event/[slug]/page";
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

  const isPriviledged = [Privilege.ADMIN, Privilege.MIXOLOGIST].includes(
    getCookie("privilege") as Privilege,
  );

  return (
    <div>
      <Button
        className="rounded-full bg-slate-200 hover:bg-slate-400 h-15 w-15 p-5"
        data-testid="pause-orders"
        disabled={!isPriviledged || event.state === EventState.ENDED}
        onClick={async (ev) => {
          (ev.target as HTMLInputElement).disabled = true;
          await updateEvent({
            state:
              event?.state === EventState.OPEN
                ? EventState.CLOSED
                : EventState.OPEN,
          });
          toast({
            title: `EVENT ${event?.state === EventState.OPEN ? EventState.CLOSED : EventState.OPEN}`,
            description: `Event has been ${event?.state === EventState.OPEN ? "paused" : "opened"}, attendees can ${event?.state === EventState.OPEN ? "not" : "now"} make new orders`,
          });
          (ev.target as HTMLInputElement).disabled = false;
        }}
      >
        {event.state === EventState.CLOSED && <PlayIcon className="h-6 w-6" />}
        {event.state === EventState.OPEN && <PauseIcon className="h-6 w-6" />}
        {event.state === EventState.ENDED && <BanIcon className="h-6 w-6" />}
      </Button>
      <Popover
        open={customOrderPopoverIsOpen}
        onOpenChange={openCustomOrderPopover}
      >
        <PopoverTrigger
          asChild
          className="rounded-full bg-slate-200 hover:bg-slate-400 h-15 w-15 mx-2"
        >
          <Button
            title="Create a Manual Order"
            disabled={!isPriviledged}
            onClick={() => openCustomOrderPopover(true)}
            className="p-5"
          >
            <PlusIcon className="h-6 w-6" />
          </Button>
        </PopoverTrigger>
        <CustomOrderPopoverContent
          selection={event.selection}
          eventSlug={event.slug}
          closePopover={() => {
            openCustomOrderPopover(false);
          }}
        />
      </Popover>
      <Popover
        open={broadcastPopoverIsOpen}
        onOpenChange={openBroadcastPopover}
      >
        <PopoverTrigger
          asChild
          className="rounded-full bg-slate-200 hover:bg-slate-400 h-15 w-15 mx-2"
        >
          <Button
            title="Send Message to all open orders"
            disabled={!isPriviledged}
            onClick={() => openBroadcastPopover(true)}
            className="p-5"
          >
            <MessageSquareIcon className="h-6 w-6" />
          </Button>
        </PopoverTrigger>
        <BroadcastPopoverContent
          eventSlug={event.slug}
          closePopover={() => {
            openBroadcastPopover(false);
          }}
        />
      </Popover>
    </div>
  );
}
