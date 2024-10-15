"use client";
import {
  useSyncDocument,
  useSyncMap,
  useSyncList,
} from "@/provider/syncProvider";

import { CardHeader, CardContent, Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  SelectValue,
  SelectTrigger,
  SelectItem,
  SelectContent,
  Select,
} from "@/components/ui/select";

import { Button } from "@/components/ui/button";
import { isClientAuth } from "@/lib/customHooks";
import { Privilege } from "@/middleware";

function SyncDemoPage() {
  const [doc, setDocData, docInitialized] = useSyncDocument("demo-doc");
  const [map, addMapData, mapInitialized] = useSyncMap("demo-map", [
    "key1",
    "key2",
  ]);
  const [list, addListData, listInitialized] = useSyncList("demo-list", 30);

  return (
    <main className="p-4">
      <Card className="max-w-xl  my-4 mx-auto">
        <CardHeader>
          <h2 className="text-xl font-semibold">Sync Doc Test</h2>
          <p className="text-sm text-gray-500">
            This form will automatically sync data to the Twilio Sync Service
            document
          </p>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                placeholder={docInitialized ? "Enter name" : "Loading..."}
                onChange={(event) => {
                  setDocData({ ...doc, name: event.target.value });
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rating">Rating</Label>
              <Select
                name="rating"
                onValueChange={(rating) => {
                  setDocData({ ...doc, rating });
                }}
              >
                <SelectTrigger id="rating">
                  <SelectValue
                    placeholder={
                      docInitialized ? doc?.rating : "Choose a rating"
                    }
                  />
                </SelectTrigger>
                <SelectContent position="popper">
                  <SelectItem value="1">1</SelectItem>
                  <SelectItem value="2">2</SelectItem>
                  <SelectItem value="3">3</SelectItem>
                  <SelectItem value="4">4</SelectItem>
                  <SelectItem value="5">5</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="max-w-xl  my-4 mx-auto">
        <CardHeader>
          <h2 className="text-xl font-semibold">Sync Map Test</h2>
          <p className="text-sm text-gray-500">
            On submit, this form will sync data to the Twilio Sync Service map
          </p>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              const target = event.target as HTMLFormElement;
              const data = new FormData(target);
              // @ts-ignore // TODO fix this TS issue
              addMapData(data.get("key") as string, {
                value: data.get("value"),
              });
              target.reset();
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="key">Key</Label>
              <Input id="key" name="key" placeholder="Enter a key" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="value">Value</Label>
              <Input id="value" name="value" placeholder="Enter a value" />
            </div>

            <Button type="submit" className="w-full">
              Add Item
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="max-w-xl my-4 mx-auto">
        <CardHeader>
          <h2 className="text-xl font-semibold">Sync List Test</h2>
          <p className="text-sm text-gray-500">
            On submit, this form will append a new name to the sync list
          </p>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              const target = event.target as HTMLFormElement;
              const data = new FormData(target);
              // @ts-ignore // TODO fix this TS issue
              addListData({
                value: data.get("name"),
              });
              target.reset();
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" placeholder="Enter a name" />
            </div>

            <Button type="submit" className="w-full">
              Add Name to List
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="max-w-xl my-4 mx-auto">
        <CardHeader>
          <h2 className="text-xl font-semibold">Synced Data</h2>
          <p className="text-sm text-gray-500">
            The last data synced to the Twilio Sync Service
          </p>
        </CardHeader>
        <CardContent>
          <h1 className="text-xl m-2">Doc</h1>
          <Label htmlFor="name">Name</Label>
          {docInitialized ? (
            <p>{doc?.name}</p>
          ) : (
            <div className="w-2/3 h-6 bg-gray-300 rounded animate-pulse"></div>
          )}
          <Label htmlFor="name">Rating</Label>
          {docInitialized ? (
            <p>{doc?.rating}</p>
          ) : (
            <div className="w-2/3 h-6 bg-gray-300 rounded animate-pulse"></div>
          )}

          <h1 className="text-xl m-2">Map</h1>
          {mapInitialized ? (
            <ul>
              <li>
                <p>
                  <Label className="pr-4">Key 1</Label>
                  {/*// TODO fix this TS issue */}
                  {map instanceof Map && map.get("key1")?.value}
                </p>
              </li>
              <li>
                <p>
                  <Label className="pr-4">Key 2</Label>
                  {/*// TODO fix this TS issue */}
                  {map instanceof Map && map.get("key2")?.value}
                </p>
              </li>
            </ul>
          ) : (
            <div className="w-2/3 h-10 bg-gray-300 rounded animate-pulse"></div>
          )}
          <h1 className="text-xl m-2">List</h1>
          {listInitialized ? (
            <ul>
              {/* // TODO fix this TS issue */}
              {Array.isArray(list) &&
                list.map((item, index) => (
                  <li key={index}>
                    <p>{item.data.value}</p>
                  </li>
                ))}
            </ul>
          ) : (
            <div className="w-2/3 h-10 bg-gray-300 rounded animate-pulse"></div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}

export default isClientAuth(
  [Privilege.ADMIN, Privilege.MIXOLOGIST],
  SyncDemoPage,
);
