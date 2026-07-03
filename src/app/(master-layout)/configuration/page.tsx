"use client";
import { useSyncDocument } from "@/provider/syncProvider";
import { isClientAuth } from "@/lib/customHooks";
import { Configuration } from "@/scripts/updateConfig";
import {
  MessageCircleMoreIcon,
  MessageSquareIcon,
  MessageSquarePlusIcon,
  SignalIcon,
} from "lucide-react";
import { Privilege } from "@/proxy";
import MenuItem from "@/components/menu-item";
import { modes } from "@/config/menus";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

function ConfigPage() {
  if (!process.env.NEXT_PUBLIC_CONFIG_DOC) {
    throw new Error("No config doc specified");
  }
  const [config, , configInitialized] = useSyncDocument(
    process.env.NEXT_PUBLIC_CONFIG_DOC,
  ) as [Configuration, Function, boolean];

  const allModes = configInitialized
    ? Object.values(modes).filter((m) => config?.menus?.[m]?.items?.length > 0)
    : [];

  return (
    <div className="w-full py-8 space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold text-twilio-ink tracking-tight">
          Configuration
        </h1>
        <p className="text-base text-gray-500 mt-1">
          Read-only view of connected senders and menu catalogue
        </p>
      </div>

      {/* Connected Senders */}
      <section>
        <SectionHeading
          title="Connected Senders"
          description="Channels customers can use to place orders"
        />
        {configInitialized && config?.possibleSenders ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
            {config.possibleSenders
              .sort((a, b) => a.localeCompare(b))
              .map((sender, i) => {
                const meta = getSenderMeta(sender);
                return <SenderCard key={i} sender={sender} meta={meta} />;
              })}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 rounded-lg bg-gray-100 animate-pulse" />
            ))}
          </div>
        )}
      </section>

      {/* Menus */}
      <section>
        <SectionHeading
          title="Menus"
          description="Items and modifiers available per service mode"
        />
        <div className="mt-4">
          {configInitialized && allModes.length > 0 ? (
            <Tabs defaultValue={allModes[0]}>
              <TabsList className="mb-4 h-auto flex-wrap gap-1">
                {allModes.map((mode) => (
                  <TabsTrigger key={mode} value={mode} className="capitalize gap-2 text-sm py-2 px-4">
                    {mode}
                    <span className="rounded-full bg-gray-200 px-1.5 py-0.5 text-xs font-medium text-gray-600 data-[state=active]:bg-gray-300">
                      {config.menus[mode].items.length}
                    </span>
                  </TabsTrigger>
                ))}
              </TabsList>

              {allModes.map((mode) => (
                <TabsContent key={mode} value={mode} className="space-y-5">
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                    {config.menus[mode].items.map((item, i) => (
                      <MenuItem
                        key={`item-${mode}-${i}`}
                        title={item.title}
                        shortTitle={item.shortTitle}
                        description={item.description}
                      />
                    ))}
                  </div>

                  {config.menus[mode].modifiers?.length ? (
                    <div>
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                        Modifiers
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {config.menus[mode].modifiers!.map((modifier, i) => (
                          <Badge
                            key={i}
                            variant="secondary"
                            className="font-normal rounded-full"
                          >
                            {modifier}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </TabsContent>
              ))}
            </Tabs>
          ) : (
            <div className="space-y-2">
              <div className="h-10 w-48 rounded-md bg-gray-100 animate-pulse" />
              <div className="space-y-1.5 mt-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-14 rounded-md bg-gray-100 animate-pulse"
                    style={{ opacity: 1 - i * 0.12 }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

/* ─── Sub-components ─────────────────────────────────────────────────────── */

function SectionHeading({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-twilio-ink">{title}</h2>
      <p className="text-sm text-gray-400 mt-0.5">{description}</p>
    </div>
  );
}

type SenderMeta = {
  Icon: React.ElementType;
  label: string;
  accentClass: string;
  badgeClass: string;
};

function SenderCard({
  sender,
  meta,
}: {
  sender: string;
  meta: SenderMeta;
}) {
  const { Icon, label, accentClass, badgeClass } = meta;
  return (
    <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-xs">
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${accentClass}`}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className={`text-xs font-semibold rounded px-1 py-0.5 ${badgeClass}`}>
            {label}
          </span>
          <span className="flex items-center gap-0.5 text-xs text-green-500">
            <SignalIcon className="h-3 w-3" />
          </span>
        </div>
        <p className="truncate text-base text-gray-700 font-mono">
          {clipPrefix(sender)}
        </p>
      </div>
    </div>
  );
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */

function getSenderMeta(sender: string): SenderMeta {
  if (sender.includes("whatsapp:")) {
    return {
      Icon: MessageCircleMoreIcon,
      label: "WhatsApp",
      accentClass: "bg-green-50 text-green-600",
      badgeClass: "bg-green-50 text-green-700",
    };
  } else if (sender.includes("rcs:")) {
    return {
      Icon: MessageSquarePlusIcon,
      label: "RCS",
      accentClass: "bg-blue-50 text-blue-600",
      badgeClass: "bg-blue-50 text-blue-700",
    };
  } else {
    return {
      Icon: MessageSquareIcon,
      label: "SMS",
      accentClass: "bg-gray-100 text-gray-500",
      badgeClass: "bg-gray-100 text-gray-600",
    };
  }
}

function clipPrefix(sender: string) {
  return sender.replace(/^(whatsapp:|rcs:)/, "");
}

export default isClientAuth(
  [Privilege.ADMIN, Privilege.MIXOLOGIST],
  ConfigPage,
);
