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
import { MenuSelect } from "@/components/menu-select";
import { useEffect, useRef, useState, use } from "react";
import { Privilege } from "@/proxy";
import { AlertTriangleIcon, ChevronDown } from "lucide-react";
import QrCodePopoverContent from "./qr-code-popovercontent";
import { Popover, PopoverTrigger } from "@/components/ui/popover";
import { modes, EventState } from "@/types";
import { Textarea } from "@/components/ui/text-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Event, Language, LeadCollection } from "@/types";

export type { Event };

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
    leadCollection: "MANUAL",
    senders: [],
    selection: {
      items: [],
      modifiers: [],
      mode: modes.barista,
    },
    pickupLocation: "",
    maxOrders: 70,
    welcomeMessage: "",
    language: "en",
  });

  const timerRef = useRef<NodeJS.Timeout>(undefined);
  const aiUpdateTimerRef = useRef<NodeJS.Timeout>(undefined);

  const [collapsed, setCollapsed] = useState({
    general: false,
    communication: false,
    menu: false,
    customize: false,
  });

  function toggleSection(section: keyof typeof collapsed) {
    if (!isNewEvent) setCollapsed((c) => ({ ...c, [section]: !c[section] }));
  }

  // Fields the user has interacted with at least once — gates the inline
  // per-field error messages so a blank new-event form doesn't light up red
  // before anyone's typed anything.
  const [touched, setTouched] = useState<Record<keyof EventFieldErrors, boolean>>({
    name: false,
    maxOrders: false,
    pickupLocation: false,
    senders: false,
    items: false,
  });
  function markTouched(field: keyof EventFieldErrors) {
    setTouched((t) => (t[field] ? t : { ...t, [field]: true }));
  }
  function updateMenuItemField(
    index: number,
    field: "title" | "shortTitle" | "description",
    value: string,
  ) {
    const updatedItems = internalEvent.selection.items.map((item, i) => {
      if (i !== index) return item;
      const updated = { ...item, [field]: value };
      if (field === "shortTitle" && !item.originalTitle) {
        updated.originalTitle = item.shortTitle;
      }
      return updated;
    });
    const newEvent = {
      ...internalEvent,
      selection: { ...internalEvent.selection, items: updatedItems },
    };
    updateEvent(newEvent);
    clearTimeout(aiUpdateTimerRef.current);
    aiUpdateTimerRef.current = setTimeout(() => {
      fetch(`/api/event/${newEvent.slug}/selection`, {
        method: "PUT",
        body: JSON.stringify({ selection: newEvent.selection }),
      });
    }, 1500);
  }

  function updateModifierField(index: number, value: string) {
    const updatedModifiers = internalEvent.selection.modifiers.map((m, i) =>
      i !== index ? m : value,
    );
    const newEvent = {
      ...internalEvent,
      selection: { ...internalEvent.selection, modifiers: updatedModifiers },
    };
    updateEvent(newEvent);
    clearTimeout(aiUpdateTimerRef.current);
    aiUpdateTimerRef.current = setTimeout(() => {
      fetch(`/api/event/${newEvent.slug}/selection`, {
        method: "PUT",
        body: JSON.stringify({ selection: newEvent.selection }),
      });
    }, 1500);
  }

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
        .filter((s) => s.startsWith("+"))
        .map((s) => {
          return { label: s, value: s };
        }),
    },
    {
      label: "WhatsApp",
      options: config.possibleSenders
        .filter((s) => s.startsWith("whatsapp:"))
        .map((s) => {
          return {
            label: s,
            value: s,
          };
        }),
    },
    {
      label: "RCS",
      options: config.possibleSenders
        .filter((s) => s.startsWith("rcs:"))
        .map((s) => {
          return {
            label: s,
            value: s,
          };
        }),
    },
  ];

  const unknownSenders = internalEvent.senders.filter(
    (s) =>
      !config.possibleSenders.find((ps) => {
        if (ps === s) {
          return true;
        }
        return false;
      }),
  );

  // Only relevant during creation — existing events have no equivalent
  // save-gate, so there's nothing for these to guard there.
  const fieldErrors = isNewEvent ? getFieldErrors(internalEvent) : {};

  return (
    <div className="w-full py-8 space-y-4">
      {/* Page header */}
      <div className="border-b border-gray-200 pb-5">
        <h1 className="text-2xl font-semibold text-twilio-ink tracking-tight">
          {isNewEvent ? "New Event" : internalEvent.name}
        </h1>
        <p className="text-base text-gray-500 mt-1">
          {isNewEvent ? "Configure and launch a new event" : `Slug: ${internalEvent.slug}`}
        </p>
      </div>

      {/* General */}
      <Card>
        <CardHeader className="flex flex-row items-center">
          <div
            className={`flex items-center gap-2 flex-1 ${!isNewEvent ? "cursor-pointer" : ""}`}
            onClick={() => toggleSection("general")}
          >
            <CardTitle className="text-base font-semibold">General</CardTitle>
            {!isNewEvent && (
              <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${collapsed.general ? "" : "rotate-180"}`} />
            )}
          </div>
          {!isNewEvent && (
            <div className="flex items-center gap-2">
              <span className={`text-sm font-medium ${internalEvent.state === EventState.OPEN ? "text-green-600" : "text-gray-400"}`}>
                {internalEvent.state === EventState.OPEN ? "Open" : "Ended"}
              </span>
              <Switch
                id="event-state"
                checked={internalEvent.state === EventState.OPEN}
                onCheckedChange={(newState) =>
                  updateEvent({ ...internalEvent, state: newState ? EventState.OPEN : EventState.ENDED })
                }
              />
            </div>
          )}
        </CardHeader>
        {!collapsed.general && (
          <CardContent className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="eventName">Event Name</Label>
              <Input
                id="eventName"
                placeholder="Enter event name"
                disabled={!isNewEvent}
                required
                pattern=".{4,}"
                aria-invalid={touched.name && !!fieldErrors.name}
                className={touched.name && fieldErrors.name ? "border-red-500 focus-visible:ring-red-500" : ""}
                value={internalEvent.name}
                onChange={(ev) =>
                  updateEvent({ ...internalEvent, name: ev.target.value, slug: toKebabCase(ev.target.value) })
                }
                onBlur={() => markTouched("name")}
              />
              {touched.name && fieldErrors.name && (
                <p className="text-xs text-red-500">{fieldErrors.name}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="eventSlug">Slug</Label>
              <Input disabled id="eventSlug" placeholder="Auto-generated" value={internalEvent.slug} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="maxOrders">Max Orders Per Customer / Day</Label>
              <Input
                id="maxOrders"
                type="number"
                min={1}
                required
                aria-invalid={touched.maxOrders && !!fieldErrors.maxOrders}
                className={touched.maxOrders && fieldErrors.maxOrders ? "border-red-500 focus-visible:ring-red-500" : ""}
                value={internalEvent.maxOrders}
                onChange={(ev) =>
                  updateEvent({ ...internalEvent, maxOrders: parseInt(ev.target.value) })
                }
                onBlur={() => markTouched("maxOrders")}
              />
              {touched.maxOrders && fieldErrors.maxOrders ? (
                <p className="text-xs text-red-500">{fieldErrors.maxOrders}</p>
              ) : (
                <p className="text-xs text-gray-400">
                  50 or more is treated as unlimited — order confirmations won&apos;t mention a daily cap.
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="leadCollection">Lead Collection</Label>
              <Select
                value={internalEvent.leadCollection ?? "MANUAL"}
                onValueChange={(value) =>
                  updateEvent({ ...internalEvent, leadCollection: value as LeadCollection })
                }
              >
                <SelectTrigger id="leadCollection">
                  <SelectValue placeholder="Select mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MANUAL">Manual (name + email)</SelectItem>
                  <SelectItem value="WeAreDevs_QR">WeAreDevelopers QR Badge</SelectItem>
                  <SelectItem value="NONE">None</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Communication */}
      <Card>
        <CardHeader
          className={`flex flex-row items-center justify-between ${!isNewEvent ? "cursor-pointer" : ""}`}
          onClick={() => toggleSection("communication")}
        >
          <CardTitle className="text-base font-semibold">Communication</CardTitle>
          {!isNewEvent && (
            <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${collapsed.communication ? "" : "rotate-180"}`} />
          )}
        </CardHeader>
        {!collapsed.communication && (
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="phoneNumbers">Senders</Label>
              {unknownSenders.length > 0 && (
                <Alert className="my-2" variant="destructive">
                  <AlertTriangleIcon className="h-4 w-4" />
                  <AlertTitle>Invalid Sender Configuration</AlertTitle>
                  <AlertDescription>
                    The following senders are no longer available: {unknownSenders.join(", ")}
                  </AlertDescription>
                </Alert>
              )}
              <MultiSelect
                placeholder="Senders to be used for this event"
                value={internalEvent.senders.map((s) => ({ label: s, value: s }))}
                onChange={(selected) => {
                  markTouched("senders");
                  updateEvent({ ...internalEvent, senders: selected.map((s) => s.value) });
                }}
                options={options}
              />
              {touched.senders && fieldErrors.senders && (
                <p className="text-xs text-red-500">{fieldErrors.senders}</p>
              )}
              {internalEvent.senders.length > 0 && (
                <Popover>
                  <PopoverTrigger>
                    <span className="text-xs font-semibold text-twilio-red cursor-pointer hover:underline">
                      Show QR codes
                    </span>
                  </PopoverTrigger>
                  <QrCodePopoverContent senders={internalEvent.senders} />
                </Popover>
              )}
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="pickupLocation">Pickup Location</Label>
                <Input
                  id="pickupLocation"
                  placeholder="Where to find the booth"
                  required
                  pattern=".{3,}"
                  aria-invalid={touched.pickupLocation && !!fieldErrors.pickupLocation}
                  className={touched.pickupLocation && fieldErrors.pickupLocation ? "border-red-500 focus-visible:ring-red-500" : ""}
                  value={internalEvent.pickupLocation}
                  onChange={(ev) =>
                    updateEvent({ ...internalEvent, pickupLocation: ev.target.value })
                  }
                  onBlur={() => markTouched("pickupLocation")}
                />
                {touched.pickupLocation && fieldErrors.pickupLocation && (
                  <p className="text-xs text-red-500">{fieldErrors.pickupLocation}</p>
                )}
                {internalEvent.pickupLocation.length >= 3 && (
                  <p className="text-xs text-gray-400 italic">
                    {(internalEvent.language ?? "en") === "pt-BR"
                      ? `"Bem-vindo ao ${internalEvent.pickupLocation}!"`
                      : `"Welcome to ${internalEvent.pickupLocation}!"`}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="language">Language</Label>
                <Select
                  value={internalEvent.language ?? "en"}
                  onValueChange={(value) =>
                    updateEvent({ ...internalEvent, language: value as Language })
                  }
                >
                  <SelectTrigger id="language">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="welcomeMessage">Custom Welcome Message</Label>
              <Textarea
                id="welcomeMessage"
                placeholder={`Shown on first contact with the bot. Sample structure:\n\n- Say hi to the attendee\n- Shoutout to a product/campaign\n- Invite to order\n- Link Resource`}
                value={internalEvent.welcomeMessage}
                onChange={(ev) =>
                  updateEvent({ ...internalEvent, welcomeMessage: ev.target.value })
                }
              />
            </div>
          </CardContent>
        )}
      </Card>

      {/* Menu */}
      <Card>
        <CardHeader
          className={`flex flex-row items-center justify-between ${!isNewEvent ? "cursor-pointer" : ""}`}
          onClick={() => toggleSection("menu")}
        >
          <CardTitle className="text-base font-semibold">Menu</CardTitle>
          {!isNewEvent && (
            <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${collapsed.menu ? "" : "rotate-180"}`} />
          )}
        </CardHeader>
        {!collapsed.menu && (
          <CardContent>
            <MenuSelect
              menus={config.menus}
              selection={internalEvent.selection}
              onSelectionChange={(newSelection) => {
                markTouched("items");
                updateEvent({ ...internalEvent, selection: newSelection });
                if (!isNewEvent) {
                  // Debounce the save (like updateMenuItemField/
                  // updateModifierField below) so rapid successive
                  // selections send a single PUT with the latest state,
                  // rather than one fire-and-forget PUT per click that can
                  // complete out of order and regress the saved selection.
                  clearTimeout(aiUpdateTimerRef.current);
                  aiUpdateTimerRef.current = setTimeout(() => {
                    fetch(`/api/event/${internalEvent.slug}/selection`, {
                      method: "PUT",
                      body: JSON.stringify({ selection: newSelection }),
                    });
                  }, 1500);
                }
              }}
            />
            {touched.items && fieldErrors.items && (
              <p className="text-xs text-red-500 mt-1.5">{fieldErrors.items}</p>
            )}
          </CardContent>
        )}
      </Card>

      {/* Customize Menu Items */}
      {!isNewEvent && internalEvent.selection.items.length > 0 && (
        <Card>
          <CardHeader
            className="flex flex-row items-center justify-between cursor-pointer"
            onClick={() => toggleSection("customize")}
          >
            <CardTitle className="text-base font-semibold">Customize Menu Items</CardTitle>
            <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${collapsed.customize ? "" : "rotate-180"}`} />
          </CardHeader>
          {!collapsed.customize && (
            <CardContent className="space-y-6">
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {internalEvent.selection.items.map((item, index) => (
                  <div key={item.originalTitle ?? item.shortTitle} className="space-y-3 rounded-lg border border-gray-100 bg-gray-50 p-4">
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                      {item.originalTitle ?? item.shortTitle}
                    </p>
                    <div className="space-y-1">
                      <Label className="text-xs">Display Name</Label>
                      <Input
                        value={item.title}
                        maxLength={24}
                        onChange={(e) => updateMenuItemField(index, "title", e.target.value)}
                      />
                      <p className="text-xs text-gray-400 text-right">{item.title.length}/24</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Short Title</Label>
                      <Input
                        value={item.shortTitle}
                        maxLength={24}
                        onChange={(e) => updateMenuItemField(index, "shortTitle", e.target.value)}
                      />
                      <p className="text-xs text-gray-400 text-right">{item.shortTitle.length}/24</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Description</Label>
                      <Textarea
                        value={item.description}
                        maxLength={72}
                        onChange={(e) => updateMenuItemField(index, "description", e.target.value)}
                      />
                      <p className="text-xs text-gray-400 text-right">{item.description.length}/72</p>
                    </div>
                  </div>
                ))}
              </div>

              {internalEvent.selection.modifiers.length > 0 && (
                <div className="border-t pt-4">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Modifiers</p>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {internalEvent.selection.modifiers.map((modifier, index) => {
                      const original = (internalEvent.selection.originalModifiers ?? internalEvent.selection.modifiers)[index];
                      return (
                        <div key={original} className="space-y-2 rounded-lg border border-gray-100 bg-gray-50 p-3">
                          <p className="text-xs text-gray-400">Original: {original}</p>
                          <Input
                            value={modifier}
                            onChange={(e) => updateModifierField(index, e.target.value)}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          )}
        </Card>
      )}

      {/* Create button */}
      {isNewEvent && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                className="w-full bg-twilio-red hover:bg-red-600 text-white aria-disabled:opacity-40 aria-disabled:cursor-not-allowed"
                aria-disabled={isFormInvalid(internalEvent)}
                onClick={(ev: React.MouseEvent<HTMLButtonElement, MouseEvent> & { target: HTMLButtonElement }) => {
                  if (isFormInvalid(internalEvent)) return;
                  ev.target.disabled = true;
                  fetch("/api/event", { method: "POST", body: JSON.stringify(internalEvent) })
                    .then((res) => {
                      if (res.ok) {
                        toast({ title: "Event Created", description: `The event ${internalEvent.name} was created` });
                        return router.push(`/event/${internalEvent.slug}`);
                      }
                      toast({ title: "Creation Failed", description: res.statusText });
                    })
                    .finally(() => { ev.target.disabled = false; });
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
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // strip diacritics, e.g. São -> Sao
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .replace(/\//g, "-")
    .replace(/([0-9])([a-zA-Z])/g, "$1-$2")
    .replace(/([a-zA-Z])([0-9])/g, "$1-$2")
    .replace(/[\s_]+/g, "-")
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "") // drop any remaining non-ascii characters
    .replace(/^-+|-+$/g, "");
}

type EventFieldErrors = {
  name?: string;
  maxOrders?: string;
  pickupLocation?: string;
  senders?: string;
  items?: string;
};

// Single source of truth for validation, shared by the per-field inline
// messages and the Create Event button's tooltip.
function getFieldErrors(internalEvent: Event): EventFieldErrors {
  const errors: EventFieldErrors = {};

  if (internalEvent.name?.length < 4) {
    errors.name = "Event name must be at least 4 characters long";
  } else if (internalEvent.name?.length > 20) {
    errors.name = "Event name must be 20 characters long or less";
  }
  if (internalEvent.maxOrders < 1) {
    errors.maxOrders = "Max orders must be at least 1";
  }
  if (internalEvent.pickupLocation.length < 3) {
    errors.pickupLocation = "Pickup location must be at least 3 characters long";
  }
  if (internalEvent.senders?.length! < 1) {
    errors.senders = "At least one sender must be selected";
  }
  if (internalEvent.selection.items?.length < 2) {
    errors.items = "At least two menu items must be selected";
  }
  return errors;
}

function isFormInvalid(internalEvent: Event) {
  return Object.keys(getFieldErrors(internalEvent)).length > 0;
}

function validateButtonTooltip(internalEvent: Event): string {
  const errors = getFieldErrors(internalEvent);
  return (
    errors.name ??
    errors.maxOrders ??
    errors.pickupLocation ??
    errors.senders ??
    errors.items ??
    "Create Event"
  );
}
