"use server";

import twilio, { validateRequest } from "twilio";
import { appendFileSync } from "fs";
import { Privilege, getAuthenticatedRole } from "@/middleware";
import { headers } from "next/headers";
import axios from "axios";
import AccessToken, { SyncGrant } from "twilio/lib/jwt/AccessToken";
import { ServiceInstance } from "twilio/lib/rest/sync/v1/service";
import throttledQueue from "throttled-queue";
import {
  WhatsAppTemplate,
  WhatsAppTemplateConfig,
} from "@/scripts/buildContentTemplates";
import {
  getEditOrderTool,
  getFetchOrderInfoTool,
  getForgetUserTool,
  getSubmitOrdersTool,
  getSystemPrompt,
} from "./aiAssistantTempaltes";
import { Event } from "@/app/(master-layout)/event/[slug]/page";
const throttle = throttledQueue(25, 1000);
const {
  TWILIO_API_KEY = "",
  TWILIO_AUTH_TOKEN = "",
  TWILIO_API_SECRET = "",
  TWILIO_ACCOUNT_SID = "",
  TWILIO_SYNC_SERVICE_SID = "",
  TWILIO_VERIFY_SERVICE_SID = "",
  TWILIO_CONVERSATIONS_SERVICE_SID = "",
  TWILIO_MESSAGING_SERVICE_SID = "",
  SERVICE_INSTANCE_PREFIX = "",
  PUBLIC_BASE_URL = "",
  SEGMENT_SPACE_ID = "",
  SEGMENT_PROFILE_KEY = "",
} = process.env;

const OneWeekInSeconds = 7 * 24 * 60 * 60;

export async function getAllWhatsAppTemplates(): Promise<WhatsAppTemplate[]> {
  const { data } = await axios.get(
    "https://content.twilio.com/v1/Content?PageSize=200",
    {
      headers: {
        "Content-Type": "application/json",
      },
      auth: {
        username: TWILIO_API_KEY,
        password: TWILIO_API_SECRET,
      },
    },
  );
  return data.contents;
}

export async function checkSignature(
  signature: string,
  url: string,
  formData?: FormData,
) {
  const regexLocalhost = /^[http|https]+:\/\/localhost(:\d+)?/;

  if (regexLocalhost.test(url)) {
    url = url.replace(regexLocalhost, PUBLIC_BASE_URL);
  }

  let data: any = {};
  if (formData) {
    formData.forEach((value, key) => {
      data[key] = value;
    });
  }

  return validateRequest(TWILIO_AUTH_TOKEN, signature, url, data);
}

export async function deleteWhatsAppTemplate(
  sid: string,
): Promise<WhatsAppTemplate> {
  const { data } = await axios.delete(
    `https://content.twilio.com/v1/Content/${sid}`,
    {
      headers: {
        "Content-Type": "application/json",
      },
      auth: {
        username: TWILIO_API_KEY,
        password: TWILIO_API_SECRET,
      },
    },
  );
  return data;
}

export async function createWhatsAppTemplate(
  template: WhatsAppTemplateConfig,
): Promise<WhatsAppTemplate> {
  const { data } = await axios.post(
    "https://content.twilio.com/v1/Content",
    template,
    {
      headers: {
        "Content-Type": "application/json",
      },
      auth: {
        username: TWILIO_API_KEY,
        password: TWILIO_API_SECRET,
      },
    },
  );

  return data;
}

export async function getMessagingService() {
  if (!TWILIO_MESSAGING_SERVICE_SID) {
    throw new Error("Missing sid for for messaging service");
  }
  const client = twilio(TWILIO_API_KEY, TWILIO_API_SECRET, {
    accountSid: TWILIO_ACCOUNT_SID,
  });
  const messagingClient = client.messaging.v1.services(
    TWILIO_MESSAGING_SERVICE_SID,
  );
  return messagingClient.fetch();
}

export async function createAiAssistant(event: Event) {
  const client = twilio(TWILIO_API_KEY, TWILIO_API_SECRET, {
    accountSid: TWILIO_ACCOUNT_SID,
  });

  const assistant = await client.assistants.v1.assistants.create({
    name: `AI Barista Assistant for ${event.name}`,
    personality_prompt: getSystemPrompt(event.selection.mode),
  });

  const tools = [
    getSubmitOrdersTool(
      `${PUBLIC_BASE_URL}/webhooks/ai-assistants/order?event=${event.slug}`,
      event.selection.items,
      event.selection.modifiers,
    ),
    getEditOrderTool(
      `${PUBLIC_BASE_URL}/webhooks/ai-assistants/editOrder?event=${event.slug}`,
      event.selection.items,
      event.selection.modifiers,
    ),
    getFetchOrderInfoTool(
      `${PUBLIC_BASE_URL}/webhooks/ai-assistants/order?event=${event.slug}`,
    ),

    getForgetUserTool(
      `${PUBLIC_BASE_URL}/webhooks/ai-assistants/forgetUser?event=${event.slug}`,
    ),
    //TODO add tool to send template messages
  ];

  tools.forEach(async (toolConfig) => {
    const orderTool = await client.assistants.v1.tools.create(
      // @ts-ignore
      toolConfig,
    );
    try {
      await client.assistants.v1
        .assistants(assistant.id)
        .assistantsTools(orderTool.id)
        .create();
    } catch (e) {
      console.error(e); //TODO this throw an error even if the tool is added
    }
  });

  return assistant;
}

export async function updateAiAssistant(aiAssistantID: string, event: Event) {
  const client = twilio(TWILIO_API_KEY, TWILIO_API_SECRET, {
    accountSid: TWILIO_ACCOUNT_SID,
  });

  const assistant = await client.assistants.v1
    .assistants(aiAssistantID)
    .fetch();

  const oldToolsToRemove = assistant.tools.filter(
    (tool) => tool.name === "Submit Order" || tool.name === "Edit Order",
  );
  if (oldToolsToRemove?.length > 0) {
    await Promise.all(
      oldToolsToRemove.map((toRemove) =>
        client.assistants.v1.tools(toRemove.id).remove(),
      ),
    );
    console.log(`Removed ${oldToolsToRemove.length} tools`);
  }

  const newTools = [
    getSubmitOrdersTool(
      `${PUBLIC_BASE_URL}/webhooks/ai-assistants/order?event=${event.slug}`,
      event.selection.items,
      event.selection.modifiers,
    ),
    getEditOrderTool(
      `${PUBLIC_BASE_URL}/webhooks/ai-assistants/editOrder?event=${event.slug}`,
      event.selection.items,
      event.selection.modifiers,
    ),
  ];

  newTools.forEach(async (toolConfig) => {
    const orderTool = await client.assistants.v1.tools.create(
      // @ts-ignore
      toolConfig,
    );
    try {
      await client.assistants.v1
        .assistants(assistant.id)
        .assistantsTools(orderTool.id)
        .create();
      console.log(`Added tool ${orderTool.name}`);
    } catch (e) {
      console.error(e); //TODO this throw an error even if the tool is added
    }
  });

  return assistant;
}

export async function deleteAiAssistant(aiAssistantID: string) {
  const client = twilio(TWILIO_API_KEY, TWILIO_API_SECRET, {
    accountSid: TWILIO_ACCOUNT_SID,
  });

  return client.assistants.v1.assistants(aiAssistantID).remove();
}

export async function askAiAssistant(
  aiAssistantID: string,
  message: string,
  sender: string,
  event: string,
  conversationSid: string,
) {
  const client = twilio(TWILIO_API_KEY, TWILIO_API_SECRET, {
    accountSid: TWILIO_ACCOUNT_SID,
  });

  await client.assistants.v1.assistants(aiAssistantID).messages.create({
    body: message,
    identity: sender,
    session_id: `${event}:${conversationSid}`,
    webhook: `${PUBLIC_BASE_URL}/webhooks/ai-assistants/proxy?event=${event}`,
  });
}

export async function getVerifyService() {
  if (!TWILIO_VERIFY_SERVICE_SID) {
    throw new Error("Missing sid for for verify service");
  }
  const client = twilio(TWILIO_API_KEY, TWILIO_API_SECRET, {
    accountSid: TWILIO_ACCOUNT_SID,
  });
  const verifyClient = client.verify.v2.services(TWILIO_VERIFY_SERVICE_SID);
  return verifyClient;
}

export async function getLookupService() {
  const client = twilio(TWILIO_API_KEY, TWILIO_API_SECRET, {
    accountSid: TWILIO_ACCOUNT_SID,
  });
  return client.lookups.v2;
}

export async function createVerification(to: string, eventName: string) {
  const verifyService = await getVerifyService();
  const verification = await verifyService.verifications.create({
    to,
    channel: "email",
    channelConfiguration: {
      substitutions: {
        "event-name": eventName,
      },
    },
  });
  return verification;
}

export async function checkVerification(verificationSid: string, code: string) {
  const verifyService = await getVerifyService();
  const verificationCheck = await verifyService.verificationChecks.create({
    verificationSid,
    code,
  });
  return verificationCheck;
}

export async function getSyncService() {
  if (!TWILIO_SYNC_SERVICE_SID) {
    throw new Error("Missing sid for for sync service");
  }
  const client = twilio(TWILIO_API_KEY, TWILIO_API_SECRET, {
    accountSid: TWILIO_ACCOUNT_SID,
  });
  const syncClient = client.sync.v1.services(TWILIO_SYNC_SERVICE_SID);
  return syncClient.fetch();
}

export async function createSyncMapItemIfNotExists(
  syncServiceUniqueName: string,
  syncMapItemKey: string,
  data: any = {},
  ttl: number = 0,
) {
  const syncService = await getSyncService();
  try {
    const item = await syncService
      .syncMaps()(syncServiceUniqueName)
      .syncMapItems(syncMapItemKey)
      .fetch();
    return item;
  } catch (err: any) {
    if (err.status === 404) {
      const newItem = await syncService
        .syncMaps()(syncServiceUniqueName)
        .syncMapItems.create({
          key: syncMapItemKey,
          data,
          ttl,
        });
      return newItem;
    } else {
      throw new Error("Fetch/Create Sync Map Item Failed", { cause: err });
    }
  }
}

export async function updateOrCreateSyncMapItem(
  syncMapUniqueName: string,
  syncMapItemKey: string,
  data: any = {},
  ttl: number = 0,
) {
  const syncService = await getSyncService();
  const syncMap = await syncService.syncMaps()(syncMapUniqueName);

  try {
    const oldData = await syncMap.syncMapItems(syncMapItemKey).fetch();

    const updatedData = await syncMap.syncMapItems(syncMapItemKey).update({
      data: {
        ...oldData.data,
        ...data,
      },
      ttl,
    });
    return updatedData;
  } catch (err: any) {
    const mapItemDoesNotExist = err.status == 404;

    if (mapItemDoesNotExist) {
      const mapItem = await syncMap.syncMapItems.create({
        key: syncMapItemKey,
        data,
        ttl,
      });
      return mapItem;
    } else {
      throw new Error("Update syncMapItem record failed", {
        cause: err,
      });
    }
  }
}

export async function updateSyncMapItem(
  syncMapUniqueName: string,
  syncMapItemKey: string,
  data: any = {},
  ttl: number = 0,
) {
  const syncService = await getSyncService();
  const syncMap = await syncService.syncMaps()(syncMapUniqueName);

  const oldData = await syncMap.syncMapItems(syncMapItemKey).fetch();

  const updatedData = await syncMap.syncMapItems(syncMapItemKey).update({
    data: {
      ...oldData.data,
      ...data,
    },
    ttl,
  });
  return updatedData;
}

export async function removeSyncMapItem(
  syncMapUniqueName: string,
  syncMapItemKey: string,
) {
  const syncService = await getSyncService();
  const syncMap = await syncService.syncMaps()(syncMapUniqueName);
  try {
    return syncMap.syncMapItems(syncMapItemKey).remove();
  } catch (err: any) {
    throw new Error("Remove a syncMap record failed", { cause: err });
  }
}

export async function findSyncMapItems(
  syncMapUniqueName: string,
  filters: any = {},
) {
  const syncService = await getSyncService();
  try {
    const syncMap = syncService.syncMaps()(syncMapUniqueName);
    const syncMapItems = await syncMap.syncMapItems.list();
    const filteredItems = syncMapItems.filter((item) => {
      return Object.keys(filters).every((key) => {
        return item.data.hasOwnProperty(key) && item.data[key] === filters[key];
      });
    });
    return filteredItems;
  } catch (err: any) {
    throw new Error("Find a syncMap record failed", { cause: err });
  }
}

export async function pushToSyncList(syncListUniqueName: string, data: any) {
  const syncService = await getSyncService();
  const syncList = syncService.syncLists()(syncListUniqueName);
  try {
    const listItem = await syncList.syncListItems.create({
      data,
      ttl: OneWeekInSeconds,
    });
    return listItem;
  } catch (err: any) {
    throw new Error("Create a sync List Item failed", { cause: err });
  }
}

export async function fetchSyncListItem(
  syncListUniqueName: string,
  index: number,
) {
  const syncService = await getSyncService();
  const syncList = syncService.syncLists()(syncListUniqueName);
  try {
    const listItem = await syncList.syncListItems(index).fetch();
    return listItem;
  } catch (err: any) {
    throw new Error("Fetch a sync List Item failed", { cause: err });
  }
}

export async function fetchSyncListItems(syncListUniqueName: string) {
  const syncService = await getSyncService();
  const syncList = syncService.syncLists()(syncListUniqueName);
  try {
    return syncList.syncListItems.list({ pageSize: 1000 });
  } catch (err: any) {
    throw new Error("Fetch Sync List Items failed", { cause: err });
  }
}

export async function updateSyncListItem(
  syncListUniqueName: string,
  index: number,
  data: any,
) {
  const syncService = await getSyncService();
  const syncList = syncService.syncLists()(syncListUniqueName);
  try {
    const listItem = await syncList
      .syncListItems(index)
      .update({ data, ttl: OneWeekInSeconds });
    return listItem;
  } catch (err: any) {
    throw new Error("Update a sync List Item failed", { cause: err });
  }
}
export async function getConversationService() {
  if (!TWILIO_CONVERSATIONS_SERVICE_SID) {
    throw new Error("Missing sid for for conversations service");
  }
  const client = twilio(TWILIO_API_KEY, TWILIO_API_SECRET, {
    accountSid: TWILIO_ACCOUNT_SID,
  });
  const conversationsClient = client.conversations.v1.services(
    TWILIO_CONVERSATIONS_SERVICE_SID,
  );
  return conversationsClient.fetch();
}

export async function getConversationsOfSender(phone: string) {
  if (!TWILIO_CONVERSATIONS_SERVICE_SID) {
    throw new Error("Missing sid for for conversations service");
  }
  const client = twilio(TWILIO_API_KEY, TWILIO_API_SECRET, {
    accountSid: TWILIO_ACCOUNT_SID,
  });
  return client.conversations.v1.participantConversations.list({
    address: phone,
    limit: 20,
  });
}

export async function createConversationWithParticipant(
  sender: string,
  twilioNumber: string,
) {
  if (!TWILIO_CONVERSATIONS_SERVICE_SID) {
    throw new Error("Missing sid for for conversations service");
  }
  const client = twilio(TWILIO_API_KEY, TWILIO_API_SECRET, {
    accountSid: TWILIO_ACCOUNT_SID,
  });
  const usingWhatsApp = sender.startsWith("whatsapp:");
  const identity = `Mixologist Kiosk Customer ${new Date().toISOString()}`;
  const conversation =
    await client.conversations.v1.conversationWithParticipants.create({
      friendlyName: identity,
      participant: [
        `{"messaging_binding": {"address": "${sender}", "proxy_address": "${usingWhatsApp ? "whatsapp:" : ""}${twilioNumber}"}}`,
        `{"identity": "${identity}"}`,
      ],
    });
  return conversation;
}

export async function deleteConversation(conversationSid: string) {
  if (!TWILIO_CONVERSATIONS_SERVICE_SID) {
    throw new Error("Missing sid for for conversations service");
  }
  const client = twilio(TWILIO_API_KEY, TWILIO_API_SECRET, {
    accountSid: TWILIO_ACCOUNT_SID,
  });
  return client.conversations.v1.conversations(conversationSid).remove();
}

export async function getPossibleSenders() {
  "use server";
  const messagingService = await getMessagingService();
  const senders = await messagingService.phoneNumbers().list(); // Add whatsapp senders here once the API is available
  return senders.map((s) => s.phoneNumber);
}

export async function createServiceInstances() {
  let output = "";
  let messagingService, syncService: ServiceInstance, conversationsService;

  const client = twilio(TWILIO_API_KEY, TWILIO_API_SECRET, {
    accountSid: TWILIO_ACCOUNT_SID,
  });

  if (TWILIO_MESSAGING_SERVICE_SID) {
    console.log(
      `Skip creating Messaging Service because ${TWILIO_MESSAGING_SERVICE_SID} already exists`,
    );
    messagingService = await client.messaging.v1
      .services(TWILIO_MESSAGING_SERVICE_SID)
      .fetch();
  } else {
    messagingService = await client.messaging.v1.services.create({
      friendlyName: `${SERVICE_INSTANCE_PREFIX} Messaging Service`,
    });
    console.log(`Created Messaging Service ${messagingService.sid}`);
    output += `TWILIO_MESSAGING_SERVICE_SID=${messagingService.sid}\n`;
  }

  if (TWILIO_SYNC_SERVICE_SID) {
    console.log(
      `Skip creating Sync Service because ${TWILIO_SYNC_SERVICE_SID} already exists`,
    );
    syncService = await client.sync.v1
      .services(TWILIO_SYNC_SERVICE_SID)
      .fetch();
  } else {
    syncService = await client.sync.v1.services.create({
      friendlyName: `${SERVICE_INSTANCE_PREFIX} Sync Service`,
      aclEnabled: true,
    });
    console.log(`Created Sync Service ${syncService.sid}`);
    output += `TWILIO_SYNC_SERVICE_SID=${syncService.sid}\n`;
  }

  if (TWILIO_VERIFY_SERVICE_SID) {
    console.log(
      `Skip creating Verify Service because ${TWILIO_VERIFY_SERVICE_SID} already exists`,
    );
  } else {
    const verifyService = await client.verify.v2.services.create({
      friendlyName: `${SERVICE_INSTANCE_PREFIX} Verify Service`,
    });
    console.log(`Created Verify Service ${verifyService.sid}`);
    output += `TWILIO_VERIFY_SERVICE_SID=${verifyService.sid}\n`;
  }

  if (TWILIO_CONVERSATIONS_SERVICE_SID) {
    console.log(
      `Skip creating Conversations Service because ${TWILIO_CONVERSATIONS_SERVICE_SID} already exists`,
    );
    conversationsService = await client.conversations.v1
      .services(TWILIO_CONVERSATIONS_SERVICE_SID)
      .fetch();
  } else {
    conversationsService = await client.conversations.v1.services.create({
      friendlyName: `${SERVICE_INSTANCE_PREFIX} Conversations Service`,
    });
    console.log(`Created Conversations Service ${conversationsService.sid}`);
    output += `TWILIO_CONVERSATIONS_SERVICE_SID=${conversationsService.sid}\n`;
  }
  const conversationsConfig = conversationsService.configuration()();
  await conversationsConfig.update({});
  await conversationsService
    .configuration()
    .webhooks()
    .update({
      filters: ["onConversationAdded", "onMessageAdded"],
      method: "POST",
      postWebhookUrl: `${PUBLIC_BASE_URL}/webhooks/conversations`,
    });

  if (output.length > 0) {
    appendFileSync(".env.local", output);
    console.log(
      "The following lines have been added to your .env.locale file:",
    );
    console.log(output);
  }
}

export async function createToken() {
  const headersList = await headers();
  const role = getAuthenticatedRole(headersList.get("Authorization") || "");
  const syncGrant = new SyncGrant({
    serviceSid: TWILIO_SYNC_SERVICE_SID,
  });

  const token = new AccessToken(
    TWILIO_ACCOUNT_SID,
    TWILIO_API_KEY,
    TWILIO_API_SECRET,
    { identity: role },
  );
  token.addGrant(syncGrant);
  return token.toJwt();
}

export async function createSyncDocIfNotExists(uniqueName: string) {
  const syncService = await getSyncService();
  let syncDoc;
  try {
    syncDoc = syncService.documents()(uniqueName);
    await syncDoc.fetch(); // to force an error if the doc doesn't exist
  } catch (err) {
    await syncService.documents().create({
      uniqueName,
    });
    syncDoc = syncService.documents()(uniqueName);
  }

  // @ts-ignore method exists and is documented this way, must be a bug in the TS definition
  await syncDoc.documentPermissions(Privilege.ADMIN).update({
    read: true,
    write: true,
    manage: false,
  });

  // @ts-ignore method exists and is documented this way, must be a bug in the TS definition
  await syncDoc.documentPermissions(Privilege.MIXOLOGIST).update({
    read: true,
    write: false,
    manage: false,
  });

  return syncDoc.fetch();
}

export async function createSyncMapIfNotExists(uniqueName: string) {
  const syncService = await getSyncService();
  let syncMap;
  try {
    syncMap = syncService.syncMaps()(uniqueName);
    await syncMap.fetch(); // to force an error if the doc doesn't exist
  } catch (err) {
    await syncService.syncMaps().create({
      uniqueName,
    });
    syncMap = syncService.syncMaps()(uniqueName);
  }

  // @ts-ignore method exists and is documented this way, must be a bug in the TS definition
  await syncMap.syncMapPermissions(Privilege.ADMIN).update({
    read: true,
    write: true,
    manage: false,
  });

  // @ts-ignore method exists and is documented this way, must be a bug in the TS definition
  await syncMap.syncMapPermissions(Privilege.MIXOLOGIST).update({
    read: true,
    write: false,
    manage: false,
  });

  // @ts-ignore method exists and is documented this way, must be a bug in the TS definition
  await syncMap.syncMapPermissions(Privilege.UNKNOWN).update({
    read: true,
    write: false,
    manage: false,
  });

  return syncMap.fetch();
}

export async function createSyncListIfNotExists(uniqueName: string) {
  const syncService = await getSyncService();
  let syncList;
  try {
    syncList = syncService.syncLists()(uniqueName);
    await syncList.fetch(); // to force an error if the doc doesn't exist
  } catch (err) {
    await syncService.syncLists().create({
      uniqueName,
    });
    syncList = syncService.syncLists()(uniqueName);
  }

  // @ts-ignore method exists and is documented this way, must be a bug in the TS definition
  await syncList.syncListPermissions(Privilege.ADMIN).update({
    read: true,
    write: true,
    manage: false,
  });

  // @ts-ignore method exists and is documented this way, must be a bug in the TS definition
  await syncList.syncListPermissions(Privilege.MIXOLOGIST).update({
    read: true,
    write: true,
    manage: false,
  });

  // @ts-ignore method exists and is documented this way, must be a bug in the TS definition
  await syncList.syncListPermissions(Privilege.UNKNOWN).update({
    read: true,
    write: false,
    manage: false,
  });

  return syncList.fetch();
}

export async function addMessageToConversation(
  conversationId: string,
  body: string = "",
  contentSid: string = "",
  contentVariables: string = "",
) {
  if (conversationId === "test-order") {
    //Ignore Messages during tests
    return;
  }

  const client = twilio(TWILIO_API_KEY, TWILIO_API_SECRET, {
    accountSid: TWILIO_ACCOUNT_SID,
  });
  try {
    throttle(() => {
      client.conversations.v1.conversations(conversationId).messages.create({
        body,
        contentSid: contentSid === "" ? undefined : contentSid,
        contentVariables:
          contentVariables === "" ? undefined : contentVariables,
      });
    });
    return;
  } catch (err) {
    console.log(err);
    return;
  }
}

export async function fetchSegmentTraits(
  email: string,
  specificTrait?: string,
) {
  let url = `https://profiles.segment.com/v1/spaces/${SEGMENT_SPACE_ID}/collections/users/profiles/email:${email}/traits`;
  if (specificTrait) {
    url += `?include=${specificTrait}`;
  }
  try {
    const response = await axios.get(url, {
      headers: {
        Authorization: `Basic ${btoa(SEGMENT_PROFILE_KEY + ":")}`,
      },
    });
    return response.data.traits;
  } catch (e: any) {
    if (e.response?.status === 404) {
      return null;
    } else {
      throw e;
    }
  }
}
