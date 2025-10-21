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
  const config = {
    ...configDoc.data,
    menus,
    possibleSenders,
  };

  await configDoc.update({ data: config });
}

(async () => {
  updateConfig();
})();
