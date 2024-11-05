"use client";

import { useRouter } from "next/navigation";
import { isClientAuth } from "@/lib/customHooks";
import { notFound } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import { useSyncDocument, useSyncMap } from "@/provider/syncProvider";
import { CardTitle, CardHeader, CardContent, Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Configuration } from "@/scripts/updateConfig";
import { Switch } from "@/components/ui/switch";
import MultiSelect from "@/components/ui/multi-select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import LoadingSpinner from "@/components/loading-spinner";
import { MenuSelect, Selection } from "@/components/menu-select";
import { useEffect, useRef, useState, use } from "react";
import { Privilege } from "@/middleware";
import { AlertTriangleIcon } from "lucide-react";
import QrCodePopoverContent from "./qr-code-popovercontent";
import { Popover, PopoverTrigger } from "@/components/ui/popover";
import { modes } from "@/config/menus";
import { EventState } from "@/lib/utils";
import { Textarea } from "@/components/ui/text-area";

export interface Event {
  name: string;
  slug: string;
  state: EventState;
  enableLeadCollection: boolean;
  senders: string[];
  selection: Selection;
  pickupLocation: string;
  maxOrders: number;
  welcomeMessage: string;
  cancelledCount?: number;
  deliveredCount?: number;
}

function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  if (
    !process.env.NEXT_PUBLIC_CONFIG_DOC ||
    !process.env.NEXT_PUBLIC_EVENTS_MAP
  ) {
    throw new Error("No config doc specified");
  }

  const { slug } = use(params);
  const isNewEvent = slug === "new";
  const router = useRouter();
  const { toast } = useToast();

  const [eventsMap, updateEventsMap, mapInitialized] = useSyncMap(
    process.env.NEXT_PUBLIC_EVENTS_MAP || "",
    isNewEvent ? [] : [slug],
  );

  useEffect(() => {
    if (!isNewEvent && mapInitialized) {
      // @ts-ignore // TODO fix this TS issue
      const existingEvent = eventsMap?.get(slug) as Event;
      updateInternalEvent(existingEvent);
    }
  }, [eventsMap, mapInitialized]);

  const [internalEvent, updateInternalEvent] = useState<Event>({
    name: "",
    slug: "",
    state: EventState.OPEN,
    enableLeadCollection: true,
    senders: [],
    selection: {
      items: [],
      modifiers: [],
      mode: modes.smoothie,
    },
    pickupLocation: "",
    maxOrders: 40,
    welcomeMessage: "",
  });

  const timerRef = useRef<NodeJS.Timeout>();
  function updateEvent(newEvent: Event) {
    clearTimeout(timerRef.current);
    updateInternalEvent(newEvent);

    if (!isNewEvent) {
      timerRef.current = setTimeout(() => {
        // @ts-ignore // TODO fix this TS issue
        updateEventsMap(slug, newEvent);
      }, 1000);
    }
  }

  const [config, _, configInitialized] = useSyncDocument(
    process.env.NEXT_PUBLIC_CONFIG_DOC,
  ) as [Configuration, (newConf: Configuration) => void, boolean];

  if (!configInitialized || !mapInitialized) {
    return <LoadingSpinner />;
  }

  if (!internalEvent) {
    return notFound();
  }

  const options = [
    {
      label: "SMS",
      options: config.possibleSenders
        .filter((s) => s.smsChannel)
        .map((s) => {
          return { label: s.sender, value: s.sender };
        }),
    },
    {
      label: "WhatsApp",
      options: config.possibleSenders
        .filter((s) => s.whatsappChannel)
        .map((s) => {
          return {
            label: `whatsapp:${s.sender}`,
            value: `whatsapp:${s.sender}`,
          };
        }),
    },
  ];

  const unknownSenders = internalEvent.senders.filter(
    (s) =>
      !config.possibleSenders.find((ps) => {
        const isWhatsapp = s.startsWith("whatsapp:");
        if (
          (isWhatsapp && ps.sender === s.replace("whatsapp:", "")) ||
          ps.sender === s
        ) {
          return true;
        }
        return false;
      }),
  );

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader className="flex flex-row space-between">
          <CardTitle>General</CardTitle>
          <div className="ml-auto flex items-center space-x-2">
            {!isNewEvent && (
              <>
                <Label htmlFor="event-state">
                  {internalEvent.state === EventState.OPEN ? "Open" : "Ended"}
                </Label>
                <Switch
                  id="event-state"
                  checked={internalEvent.state === EventState.OPEN}
                  onCheckedChange={(newState) => {
                    updateEvent({
                      ...internalEvent,
                      state: newState ? EventState.OPEN : EventState.ENDED,
                    });
                  }}
                />
              </>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="eventName">Event Name</Label>
            <Input
              id="eventName"
              placeholder="Enter event name"
              disabled={!isNewEvent}
              required
              pattern=".{4,}"
              value={internalEvent.name}
              onChange={(ev) => {
                updateEvent({
                  ...internalEvent,
                  name: ev.target.value,
                  slug: toKebabCase(ev.target.value),
                });
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="eventSlug">Slug</Label>
            <Input
              disabled
              id="eventSlug"
              placeholder="Event slug will be auto-generated"
              value={internalEvent.slug}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="maxOrders">Max Orders Per Customer</Label>
            <Input
              id="maxOrders"
              type="number"
              min={1}
              required
              value={internalEvent.maxOrders}
              onChange={(ev) => {
                updateEvent({
                  ...internalEvent,
                  maxOrders: parseInt(ev.target.value),
                });
              }}
            />
          </div>
          <div className="space-y-2 flex flex-col">
            <Label htmlFor="disableLeadCollection">
              Enable Lead Collection
            </Label>
            <Switch
              id="enableLeadCollection"
              checked={internalEvent.enableLeadCollection}
              onCheckedChange={(newState) => {
                updateEvent({
                  ...internalEvent,
                  enableLeadCollection: newState,
                });
              }}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Communication</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="mt-2">
            <Label htmlFor="phoneNumbers">Senders</Label>
            {unknownSenders.length > 0 && (
              <Alert className="my-2" variant="destructive">
                <AlertTriangleIcon className="h-4 w-4" />
                <AlertTitle>Invalid Sender Configuration</AlertTitle>
                <AlertDescription>
                  The following senders are no longer available:{" "}
                  {unknownSenders.join(", ")}
                </AlertDescription>
              </Alert>
            )}
            <MultiSelect
              placeholder="Senders to be used for this event"
              value={internalEvent.senders.map((s) => {
                return { label: s, value: s };
              })}
              onChange={(selected) => {
                updateEvent({
                  ...internalEvent,
                  senders: selected.map((s) => s.value),
                });
              }}
              options={options}
            />

            <Popover>
              <PopoverTrigger>
                <span className="text-xs font-bold underline text-blue-700 cursor-pointer">
                  Show QR codes
                </span>
              </PopoverTrigger>
              <QrCodePopoverContent senders={internalEvent.senders} />
            </Popover>

            <div className="mt-2">
              <Label aria-required htmlFor="pickupLocation">
                Pickup Location
              </Label>
              <Input
                id="pickupLocation"
                placeholder="Where to find the booth"
                required
                pattern=".{3,}"
                value={internalEvent.pickupLocation}
                onChange={(ev) => {
                  updateEvent({
                    ...internalEvent,
                    pickupLocation: ev.target.value,
                  });
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="welcomeMessage">Custom Welcome Message</Label>
              <Textarea
                id="welcomeMessage"
                placeholder={`Shown on first contact with the bot. Sample structure: 

- Say hi to the attendee
- Shoutout to a product/campaign
- Invite to order
- Link Resource`}
                value={internalEvent.welcomeMessage}
                onChange={(ev) => {
                  updateEvent({
                    ...internalEvent,
                    welcomeMessage: ev.target.value,
                  });
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Menu</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <MenuSelect
            menus={config.menus}
            selection={internalEvent.selection}
            onSelectionChange={(newSelection) => {
              updateEvent({
                ...internalEvent,
                selection: newSelection,
              });
            }}
          />
        </CardContent>
      </Card>

      {isNewEvent && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                className={`w-full flex items-center justify-center ${isFormInvalid(internalEvent) ? "bg-blue-50 hover:bg-blue-100 text-slate-300" : "bg-blue-100 hover:bg-blue-200"}`}
                variant="default"
                // disabled={validateButtonState(internalEvent)}
                onClick={(
                  ev: React.MouseEvent<HTMLButtonElement, MouseEvent> & {
                    target: HTMLButtonElement;
                  },
                ) => {
                  if (isFormInvalid(internalEvent)) {
                    return;
                  }
                  ev.target.disabled = true;

                  fetch("/api/event", {
                    method: "POST",
                    body: JSON.stringify(internalEvent),
                  })
                    .then((res) => {
                      if (res.ok) {
                        toast({
                          title: "Event Created",
                          description: `The event ${internalEvent.name} was created`,
                        });
                        return router.push(`/event/${internalEvent.slug}`);
                      }
                      toast({
                        title: "Creation Failed",
                        description: res.statusText,
                      });
                    })
                    .finally(() => {
                      ev.target.disabled = false;
                    });
                }}
              >
                Create Event
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{validateButtonTooltip(internalEvent)}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}

export default isClientAuth([Privilege.ADMIN], EventPage);

function toKebabCase(string: string) {
  // kebab case when a number is followed by a letter and vice versa
  // no starting or tailing dashes
  return string
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .replace(/\//g, "-")
    .replace(/([0-9])([a-zA-Z])/g, "$1-$2")
    .replace(/([a-zA-Z])([0-9])/g, "$1-$2")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function isFormInvalid(internalEvent: Event) {
  return (
    internalEvent.name?.length < 4 ||
    internalEvent.name?.length > 20 ||
    internalEvent.maxOrders < 1 ||
    internalEvent.pickupLocation.length < 3 ||
    internalEvent.senders?.length! < 1 ||
    internalEvent.selection.items?.length < 2
  );
}

function validateButtonTooltip(internalEvent: Event): string {
  if (internalEvent.name?.length < 4) {
    return "Event name must be at least 4 characters long";
  }
  if (internalEvent.name?.length > 20) {
    return "Event name must be 20 characters long or less";
  }
  if (internalEvent.maxOrders < 1) {
    return "Max orders must be at least 1";
  }
  if (internalEvent.pickupLocation.length < 3) {
    return "Pickup location must be at least 3 characters long";
  }
  if (internalEvent.senders?.length! < 1) {
    return "At least one sender must be selected";
  }
  if (internalEvent.selection.items?.length < 2) {
    return "At least two menu items must be selected";
  }
  return "Create Event";
}
