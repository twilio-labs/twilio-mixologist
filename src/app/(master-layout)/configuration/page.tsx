"use client";
import { useSyncDocument } from "@/provider/syncProvider";
import { isClientAuth } from "@/lib/customHooks";
import { Configuration } from "@/scripts/updateConfig";
import {
  ArrowRightIcon,
  MessageCircleMoreIcon,
  MessageSquareIcon,
  PhoneIcon,
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
        <h2 className="text-xl font-bold">Connected Phone Numbers</h2>
        <div className="grid gap-4 mt-4 ml-10">
          {configInitialized && config?.possibleSenders ? (
            config.possibleSenders.map((sender: any, key) => (
              <div key={key} className="flex items-center gap-4">
                <PhoneIcon className="h-6 w-6" />
                <span className="w-40">{sender.sender}</span>
                <button
                  title={sender.smsChannel ? "Disable SMS" : "Enable SMS"}
                  className={` rounded-lg p-1 ${
                    sender.smsChannel
                      ? "bg-green-500 hover:bg-green-300"
                      : "bg-gray-300 hover:bg-gray-400"
                  }`}
                  onClick={() => {
                    sender.smsChannel = !sender.smsChannel;
                    updateConfig({
                      ...config,
                    });
                  }}
                >
                  <img
                    src="/channel-icons/sms.svg"
                    className={`h-6 w-6 text-white`}
                  />
                </button>
                <button
                  title={
                    sender.whatsappChannel
                      ? "Disable WhatsApp"
                      : "Enable WhatsApp"
                  }
                  className={` rounded-lg p-1 ${
                    sender.whatsappChannel
                      ? "bg-green-500 hover:bg-green-300"
                      : "bg-gray-300 hover:bg-gray-400"
                  }`}
                  onClick={() => {
                    sender.whatsappChannel = !sender.whatsappChannel;
                    updateConfig({
                      ...config,
                    });
                  }}
                >
                  <img
                    src="/channel-icons/whatsapp.svg"
                    className={`h-6 w-6 text-white`}
                  />
                </button>
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

export default isClientAuth(
  [Privilege.ADMIN, Privilege.MIXOLOGIST],
  ConfigPage,
);
