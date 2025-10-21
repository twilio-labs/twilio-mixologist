"use client";
import { useSyncDocument } from "@/provider/syncProvider";
import { isClientAuth } from "@/lib/customHooks";
import { Configuration } from "@/scripts/updateConfig";
import {
  MessageCircleMoreIcon,
  MessageSquareIcon,
  MessageSquarePlusIcon,
} from "lucide-react";

import { Privilege } from "@/middleware";
import MenuItem from "@/components/menu-item";
import { modes } from "@/config/menus";

function ConfigPage() {
  if (!process.env.NEXT_PUBLIC_CONFIG_DOC) {
    throw new Error("No config doc specified");
  }
  const [config, updateConfig, configInitialized] = useSyncDocument(
    process.env.NEXT_PUBLIC_CONFIG_DOC,
  ) as [Configuration, Function, boolean];

  const allModes = configInitialized ? [modes.barista, modes.smoothie] : [];

  return (
    <main className="p-4 md:p-6 lg:p-8 space-y-8">
      <h2 className="text-2xl font-semibold mb-6 text-center">Configuration</h2>
      <section>
        <h2 className="text-xl font-bold">Connected Senders</h2>
        <div className="grid md:grid-cols-4 grid-cols-2 gap-4 mt-4 ml-10">
          {configInitialized && config?.possibleSenders ? (
            config.possibleSenders
              .sort((a, b) => a.localeCompare(b))
              .map((sender: any, key) => (
                <div
                  key={key}
                  className={`flex items-center gap-4 overflow-ellipsis ${sender.length > 25 ? "col-span-2" : ""}`}
                >
                  {getIconFromSender(sender)}
                  <span className="w-40">{clipPrefix(sender)}</span>
                </div>
              ))
          ) : (
            <div className="w-2/3 h-10 bg-gray-300 rounded-sm animate-pulse"></div>
          )}
        </div>
      </section>
      <section>
        <h2 className="text-xl font-bold">Menus</h2>
        <div className="grid mt-4  ml-10 divide-y">
          {configInitialized && allModes ? (
            allModes.map((mode: modes, key) => {
              return (
                <div key={key} className="my-2">
                  <div className="flex items-center gap-4">
                    <h3 className="text-xl font-bold my-6">
                      {mode.charAt(0).toUpperCase() + mode.slice(1)}
                    </h3>
                  </div>
                  <div className="grid divide-y">
                    {config.menus[mode].items.map((item, key) => (
                      <MenuItem
                        key={`item-${mode}-${key}`}
                        title={item.title}
                        shortTitle={item.shortTitle}
                        description={item.description}
                      />
                    ))}
                  </div>

                  {config.menus[mode].modifiers && (
                    <h3 className="text-xl font-bold my-6">Modifiers</h3>
                  )}
                  <ul>
                    {config.menus[mode].modifiers?.map(
                      (modifier: string, key: number) => (
                        <li key={`modifiers-${mode}-${key}`}>{modifier}</li>
                      ),
                    )}
                  </ul>
                </div>
              );
            })
          ) : (
            <div className="w-2/3 h-10 bg-gray-300 rounded-sm animate-pulse"></div>
          )}
        </div>
      </section>
    </main>
  );
}

function getIconFromSender(sender: string) {
  if (sender.includes("whatsapp:")) {
    return <MessageCircleMoreIcon className="h-6 w-6 text-green-500" />;
  } else if (sender.includes("rcs:")) {
    return <MessageSquarePlusIcon className="h-6 w-6 text-blue-500" />;
  } else {
    return <MessageSquareIcon className="h-6 w-6 text-gray-500" />;
  }
}

function clipPrefix(sender: string) {
  return sender.replace(/whatsapp:|rcs:/, "");
}

export default isClientAuth(
  [Privilege.ADMIN, Privilege.MIXOLOGIST],
  ConfigPage,
);
