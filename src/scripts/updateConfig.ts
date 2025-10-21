import nextConfig from "../../next.config";

import {
  getPossibleSenders,
  createSyncDocIfNotExists,
  createSyncMapIfNotExists,
  createSyncListIfNotExists,
} from "@/lib/twilio";

import menus, { Menus } from "@/config/menus";

export interface Configuration {
  menus: Menus;
  possibleSenders: string[];
}

const NEXT_PUBLIC_CONFIG_DOC = nextConfig?.env?.NEXT_PUBLIC_CONFIG_DOC;
const NEXT_PUBLIC_EVENTS_MAP = nextConfig?.env?.NEXT_PUBLIC_EVENTS_MAP;
const NEXT_PUBLIC_ACTIVE_CUSTOMERS_MAP =
  nextConfig?.env?.NEXT_PUBLIC_ACTIVE_CUSTOMERS_MAP;
const NEXT_PUBLIC_FEEDBACK_LIST =
  nextConfig?.env?.NEXT_PUBLIC_FEEDBACK_LIST || "";

export function mergeConfig(
  newConfig: Configuration,
  oldConfig: Configuration,
) {
  const oldSenders = oldConfig.possibleSenders?.map((s) => s) ?? [];
  const dedupedSenders = Array.from(
    new Set([...oldSenders, ...newConfig.possibleSenders.map((s) => s)]),
  );
  return {
    ...newConfig,
    possibleSenders: dedupedSenders.map((sender) => {
      const oldSender = oldConfig.possibleSenders?.find((s) => s === sender);
      const newSender = newConfig.possibleSenders.find((s) => s === sender);
      return sender;
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

  await createSyncListIfNotExists(NEXT_PUBLIC_FEEDBACK_LIST);
  const configDoc = await createSyncDocIfNotExists(NEXT_PUBLIC_CONFIG_DOC);
  const newConfig = mergeConfig(
    {
      menus,
      possibleSenders: possibleSenders,
    },

    // @ts-ignore  thinks is a object but actually it's a Config
    configDoc.data,
  );
  await configDoc.update({ data: newConfig });
}

(async () => {
  updateConfig();
})();
