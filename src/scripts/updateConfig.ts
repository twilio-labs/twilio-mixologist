import nextConfig from "../../next.config";

import {
  getPossibleSenders,
  createSyncDocIfNotExists,
  createSyncMapIfNotExists,
} from "@/lib/twilio";

import spellingMistakes from "@/config/spellingMap";
import menus, { Menus } from "@/config/menus";

export interface Configuration {
  menus: Menus;
  spellingMistakes: Record<string, string>;
  possibleSenders: PossibleSender[];
}

interface PossibleSender {
  whatsappChannel: boolean | null;
  smsChannel: boolean;
  sender: string;
}

const NEXT_PUBLIC_CONFIG_DOC = nextConfig?.env?.NEXT_PUBLIC_CONFIG_DOC;
const NEXT_PUBLIC_EVENTS_MAP = nextConfig?.env?.NEXT_PUBLIC_EVENTS_MAP;
const NEXT_PUBLIC_ACTIVE_CUSTOMERS_MAP =
  nextConfig?.env?.NEXT_PUBLIC_ACTIVE_CUSTOMERS_MAP;

export function mergeConfig(
  newConfig: Configuration,
  oldConfig: Configuration,
) {
  const oldSenders = oldConfig.possibleSenders?.map((s) => s.sender) ?? [];
  const dedupedSenders = Array.from(
    new Set([...oldSenders, ...newConfig.possibleSenders.map((s) => s.sender)]),
  );
  return {
    ...newConfig,
    possibleSenders: dedupedSenders.map((sender) => {
      const oldSender = oldConfig.possibleSenders?.find(
        (s) => s.sender === sender,
      );
      const newSender = newConfig.possibleSenders.find(
        (s) => s.sender === sender,
      );
      return {
        sender,
        whatsappChannel:
          newSender?.whatsappChannel ?? oldSender?.whatsappChannel ?? false,
        smsChannel: newSender?.smsChannel ?? oldSender?.smsChannel ?? false,
      };
    }),
  };
}

export async function updateConfig() {
  if (
    !NEXT_PUBLIC_EVENTS_MAP ||
    !NEXT_PUBLIC_ACTIVE_CUSTOMERS_MAP ||
    !NEXT_PUBLIC_CONFIG_DOC
  ) {
    throw new Error("Missing environment variables");
  }

  const possibleSenders = await getPossibleSenders();

  await createSyncMapIfNotExists(NEXT_PUBLIC_EVENTS_MAP);
  await createSyncMapIfNotExists(NEXT_PUBLIC_ACTIVE_CUSTOMERS_MAP);
  const configDoc = await createSyncDocIfNotExists(NEXT_PUBLIC_CONFIG_DOC);
  const newConfig = mergeConfig(
    {
      menus,
      spellingMistakes,
      possibleSenders: possibleSenders.map((phoneNumber) => ({
        whatsappChannel: null,
        smsChannel: true,
        sender: phoneNumber,
      })),
    },

    // @ts-ignore  thinks is a object but actually it's a Config
    configDoc.data,
  );
  await configDoc.update({ data: newConfig });
}

(async () => {
  updateConfig();
})();
