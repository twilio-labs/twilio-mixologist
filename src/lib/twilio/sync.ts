"use server";

import { Privilege } from "@/proxy";
import { twilioClient } from "./client";

const {
  TWILIO_SYNC_SERVICE_SID = "",
} = process.env;

const OneWeekInSeconds = 7 * 24 * 60 * 60;

export async function getSyncService() {
  if (!TWILIO_SYNC_SERVICE_SID) {
    throw new Error("Missing sid for for sync service");
  }
  const syncClient = twilioClient.sync.v1.services(TWILIO_SYNC_SERVICE_SID);
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

export async function createSyncDocIfNotExists(uniqueName: string) {
  const syncService = await getSyncService();
  let syncDoc;
  try {
    syncDoc = syncService.documents()(uniqueName);
    await syncDoc.fetch();
  } catch (err) {
    await syncService.documents().create({ uniqueName });
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
    await syncMap.fetch();
  } catch (err) {
    await syncService.syncMaps().create({ uniqueName });
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
    await syncList.fetch();
  } catch (err) {
    await syncService.syncLists().create({ uniqueName });
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
