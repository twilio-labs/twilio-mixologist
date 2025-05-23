import { describe, expect, test } from "vitest";
import { Privilege } from "@/middleware";
import axios from "axios";

const {
  TWILIO_API_KEY = "",
  TWILIO_API_SECRET = "",
  TWILIO_SYNC_SERVICE_SID = "",
  TWILIO_VERIFY_SERVICE_SID = "",
  NEXT_PUBLIC_EVENTS_MAP = "",
  NEXT_PUBLIC_CONFIG_DOC = "",
  NEXT_PUBLIC_FEEDBACK_LIST = "",
} = process.env;

const authConfig = {
  headers: {
    Authorization: "Basic " + btoa(TWILIO_API_KEY + ":" + TWILIO_API_SECRET),
  },
};

describe("Test if configuration is set up right", () => {
  test("sync service sid to be defined", () => {
    expect(TWILIO_SYNC_SERVICE_SID).not.toBe("");
  });

  test("sync service has activated ACL", async () => {
    const syncServiceRes = await fetch(
      `https://sync.twilio.com/v1/Services/${TWILIO_SYNC_SERVICE_SID}/`,
      authConfig,
    );

    const syncService = await syncServiceRes.json();

    expect(syncService.acl_enabled).toBe(true);

    const [syncMaps, syncDocs] = await Promise.all([
      (await fetch(syncService.links.maps, authConfig)).json(),
      (await fetch(syncService.links.documents, authConfig)).json(),
      ,
    ]);

    const eventsSyncMap = syncMaps.maps.find(
      (map: { unique_name: string }) =>
        map.unique_name === NEXT_PUBLIC_EVENTS_MAP,
    );

    const configDoc = syncDocs.documents.find(
      (doc: { unique_name: string }) =>
        doc.unique_name === NEXT_PUBLIC_CONFIG_DOC,
    );

    const [configDocPermissions, eventsSyncMapPermissions] = await Promise.all([
      (await fetch(configDoc.links.permissions, authConfig)).json(),
      (await fetch(eventsSyncMap.links.permissions, authConfig)).json(),
    ]);

    // expect(configDocPermissions.permissions).toContainEqual({

    const MixConfig = configDocPermissions.permissions.find(
      (p: any) => p.identity === Privilege.MIXOLOGIST,
    );
    const AdminConfig = configDocPermissions.permissions.find(
      (p: any) => p.identity === Privilege.ADMIN,
    );

    expect(MixConfig).toMatchObject({
      read: true,
      write: false,
      manage: false,
    });
    expect(AdminConfig).toMatchObject({
      read: true,
      write: true,
      manage: false,
    });

    const MixEvents = eventsSyncMapPermissions.permissions.find(
      (p: any) => p.identity === Privilege.MIXOLOGIST,
    );
    const AdminEvents = eventsSyncMapPermissions.permissions.find(
      (p: any) => p.identity === Privilege.ADMIN,
    );
    const UnknownEvents = eventsSyncMapPermissions.permissions.find(
      (p: any) => p.identity === Privilege.UNKNOWN,
    );

    expect(MixEvents).toMatchObject({
      read: true,
      write: false,
      manage: false,
    });
    expect(AdminEvents).toMatchObject({
      read: true,
      write: true,
      manage: false,
    });
    expect(UnknownEvents).toMatchObject({
      read: true,
      write: false,
      manage: false,
    });
  });

  test("sync resources have the right permissions", async () => {
    const syncServiceRes = await fetch(
      `https://sync.twilio.com/v1/Services/${TWILIO_SYNC_SERVICE_SID}/`,
      authConfig,
    );

    const syncService = await syncServiceRes.json();

    expect(syncService.acl_enabled).toBe(true);

    const [syncMaps, syncDocs] = await Promise.all([
      (await fetch(syncService.links.maps, authConfig)).json(),
      (await fetch(syncService.links.documents, authConfig)).json(),
    ]);

    const eventsSyncMap = syncMaps.maps.find(
      (map: { unique_name: string }) =>
        map.unique_name === NEXT_PUBLIC_EVENTS_MAP,
    );

    const configDoc = syncDocs.documents.find(
      (doc: { unique_name: string }) =>
        doc.unique_name === NEXT_PUBLIC_CONFIG_DOC,
    );

    const [configDocPermissions, eventsSyncMapPermissions] = await Promise.all([
      (await fetch(configDoc.links.permissions, authConfig)).json(),
      (await fetch(eventsSyncMap.links.permissions, authConfig)).json(),
    ]);

    // expect(configDocPermissions.permissions).toContainEqual({

    const MixConfig = configDocPermissions.permissions.find(
      (p: any) => p.identity === Privilege.MIXOLOGIST,
    );
    const AdminConfig = configDocPermissions.permissions.find(
      (p: any) => p.identity === Privilege.ADMIN,
    );
    expect(MixConfig).toMatchObject({
      read: true,
      write: false,
      manage: false,
    });
    expect(AdminConfig).toMatchObject({
      read: true,
      write: true,
      manage: false,
    });

    const MixEvents = eventsSyncMapPermissions.permissions.find(
      (p: any) => p.identity === Privilege.MIXOLOGIST,
    );
    const AdminEvents = eventsSyncMapPermissions.permissions.find(
      (p: any) => p.identity === Privilege.ADMIN,
    );
    const UnknownEvents = eventsSyncMapPermissions.permissions.find(
      (p: any) => p.identity === Privilege.UNKNOWN,
    );

    expect(MixEvents).toMatchObject({
      read: true,
      write: false,
      manage: false,
    });
    expect(AdminEvents).toMatchObject({
      read: true,
      write: true,
      manage: false,
    });
    expect(UnknownEvents).toMatchObject({
      read: true,
      write: false,
      manage: false,
    });
  });


  test("feedback list exists", async () => {
    expect(NEXT_PUBLIC_FEEDBACK_LIST).not.toBe("");
    const syncServiceRes = await fetch(
      `https://sync.twilio.com/v1/Services/${TWILIO_SYNC_SERVICE_SID}/`,
      authConfig,
    );  

    const syncService = await syncServiceRes.json();
    expect(syncService.acl_enabled).toBe(true);
    const syncListsRes = await fetch(syncService.links.lists, authConfig);
    const syncLists = await syncListsRes.json();
    const feedbackList = syncLists.lists.find(
      (list: { unique_name: string }) =>
        list.unique_name === NEXT_PUBLIC_FEEDBACK_LIST,
    );
    expect(feedbackList).toBeDefined();

  });

  test("verify service has email channel enabled", async () => {
    expect(TWILIO_VERIFY_SERVICE_SID).not.toBe("");

    // use axios because the twilio sdk doesn't support expose the mailer_sid property
    const { data } = await axios.get(
      `https://verify.twilio.com/v2/Services/${TWILIO_VERIFY_SERVICE_SID}`,
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
    expect(data.mailer_sid).toBeDefined();
  });
});
