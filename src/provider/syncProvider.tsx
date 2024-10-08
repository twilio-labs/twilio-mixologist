"use client";
import {
  useState,
  useEffect,
  useCallback,
  createContext,
  useContext,
} from "react";
import { getCookie } from "cookies-next";
import { createToken } from "@/lib/twilio";
import { Privilege } from "@/middleware";
import {
  Client,
  SyncMap,
  SyncDocument,
  SyncList,
  Paginator,
  SyncListItem,
} from "twilio-sync";
import { useToast } from "@/components/ui/use-toast";

const SyncContext = createContext<ISyncContextData>({ initialized: false });

interface ISyncContextData {
  syncClient?: Client;
  initialized: boolean;
}

export default function SyncProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const privilege = getCookie("privilege") as Privilege;
  const loggedIn = [Privilege.ADMIN, Privilege.MIXOLOGIST].includes(privilege);
  const [syncClient, setSyncClient] = useState<Client>();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    async function initClient() {
      if (!syncClient) {
        const token = await createToken();
        const client = new Client(token);
        client
          .on("tokenAboutToExpire", async () => {
            const token = await createToken();
            client.updateToken(token);
          })
          .on("connectionStateChanged", (state) => {
            if (state === "connected") {
              setInitialized(true);
            } else {
              setInitialized(false);
            }
          });
        setSyncClient(client);
      }
    }
    initClient();

    return () => {
      if (syncClient) {
        syncClient.shutdown();
        setSyncClient(undefined);
      }
    };
  }, []);

  return (
    <SyncContext.Provider value={{ syncClient, initialized }}>
      {children}
    </SyncContext.Provider>
  );
}

interface sampleData {
  name: string;
}

export function useSyncDocument(name: string) {
  const { syncClient, initialized } = useContext(SyncContext);
  const [docReady, setDocReady] = useState(false);
  const [syncResource, setDoc] = useState<SyncDocument>();
  const [data, setInternalData] = useState<any>();
  const { toast } = useToast();

  useEffect(() => {
    setDoc(undefined);
    setInternalData(undefined);
  }, [syncClient]);

  useEffect(() => {
    (async () => {
      if (syncClient && !syncResource) {
        try {
          const newDoc = await syncClient.document(name);
          newDoc.on("updated", (args) => setInternalData(args.data));
          setDoc(newDoc);
          setInternalData(newDoc.data);
          setDocReady(true);
        } catch (e: any) {
          toast({
            title: "Count not connect to Sync",
            description: e.message,
          });
          console.error(e);
        }
      }
    })();
    return () => {
      syncResource && syncResource.close();
    };
  }, [syncClient, syncResource, name]);

  const setData = useCallback(
    async (value: any) => {
      if (!syncResource) {
        throw new Error("Sync Doc not initialized");
      }
      await syncResource.set(value);
    },
    [syncResource, data],
  );

  return [data, setData, initialized && docReady];
}

export function useSyncMap(name: string, keys: string[]) {
  const { syncClient, initialized } = useContext(SyncContext);
  const [docReady, setDocReady] = useState(false);
  const [syncResource, setResource] = useState<SyncMap>();
  const [map, setMapInternal] = useState<Map<string, any>>();
  const { toast } = useToast();

  useEffect(() => {
    setResource(undefined);
  }, [syncClient]);

  useEffect(() => {
    (async () => {
      if (syncClient && !syncResource) {
        try {
          const newMap = await syncClient.map(name);
          const mapData = new Map<string, any>();
          setResource(newMap);
          newMap.on("itemUpdated", (args) => {
            mapData.set(args.item.key, args.item.data);
            setMapInternal(new Map<string, any>(mapData));
          });
          newMap.on("itemAdded", (args) => {
            mapData.set(args.item.key, args.item.data);
            setMapInternal(new Map<string, any>(mapData));
          });
          await Promise.all(
            keys.map(async (key) => {
              mapData.set(key, undefined);
              try {
                const item = await newMap.get(key);
                mapData.set(key, item?.data);
              } catch (e) {
                console.error(e);
              }
            }),
          );
          setMapInternal(mapData);
          setDocReady(true);
        } catch (e: any) {
          toast({
            title: "Could not connect to Sync Map",
            description: e.message,
          });
          console.error(e);
        }
      }
    })();
    return () => {
      syncResource && syncResource.close();
    };
  }, [syncClient, syncResource, name]);

  const setData = useCallback(
    async (key: string, value: any) => {
      if (!syncResource) {
        throw new Error("Sync Map not initialized");
      }
      try {
        await syncResource.set(key, value);
      } catch (e: any) {
        toast({
          title: "Could not update object",
          description: e?.message,
        });
      }
    },
    [syncResource, map],
  );

  return [map, setData, initialized && docReady];
}

export function useSyncList(name: string, limit: number) {
  const { syncClient, initialized } = useContext(SyncContext);
  const [docReady, setDocReady] = useState(false);
  const [syncResource, setResource] = useState<SyncList>();
  const [list, setInternalList] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    setResource(undefined);
  }, [syncClient]);

  useEffect(() => {
    (async () => {
      if (syncClient && !syncResource) {
        try {
          const newList = await syncClient.list(name);
          setResource(newList);

          let items: SyncListItem[] = [];
          let count = 0;

          const pageHandler: any = async function (
            paginator: Paginator<SyncListItem>,
          ) {
            paginator.items.forEach((item) => {
              if (count <= limit) {
                items.push(item);
                count++;
              } else {
                return null;
              }
            });
            if (paginator.hasNextPage && count < limit) {
              pageHandler(await paginator.nextPage());
              return null;
            } else {
              return null;
            }
          };

          const pageOfItems = await newList.getItems({ pageSize: 100 });
          await pageHandler(pageOfItems);

          newList.on("itemAdded", (args) => {
            items.push(args.item);
            setInternalList([...items]);
          });
          newList.on("itemRemoved", (args) => {
            items.splice(
              items.findIndex((item) => args.index === item.index),
              1,
            );
            setInternalList([...items]);
          });
          newList.on("itemUpdated", (args) => {
            const index = items.findIndex((item) => args.index === item.index);
            items[index] = args.item;
            setInternalList([...items]);
          });

          setInternalList(items); // maybe need to page through items here later
          setDocReady(true);
        } catch (e: any) {
          toast({
            title: "Could not connect to Sync List",
            description: e.message,
          });
          console.error(e);
        }
      }
    })();
    return () => {
      syncResource && syncResource.close();
    };
  }, [syncClient, syncResource, name]);

  const removeItemByIndex = useCallback(
    async (value: any) => {
      if (!syncResource) {
        throw new Error("Sync List not initialized");
      }
      await syncResource.remove(value);
    },
    [syncResource, list],
  );

  const updateItemByIndex = useCallback(
    async (value: any, data: any) => {
      if (!syncResource) {
        throw new Error("Sync List not initialized");
      }
      try {
        await syncResource.update(value, data);
      } catch (error) {
        throw new Error("SyncList Update Failed", { cause: error });
      }
    },
    [syncResource, list],
  );

  const updateItemTTLByIndex = useCallback(
    async (index: number, ttl: number) => {
      if (!syncResource) {
        throw new Error("Sync List not initialized");
      }
      try {
        await syncResource.setItemTtl(index, ttl);
      } catch (error) {
        throw new Error("Update TTL of Item failed", { cause: error });
      }
    },
    [syncResource, list],
  );

  return [
    list,
    removeItemByIndex,
    updateItemByIndex,
    updateItemTTLByIndex,
    initialized && docReady,
  ];
}
