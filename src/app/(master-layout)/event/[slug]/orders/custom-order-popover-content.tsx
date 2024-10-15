import { PopoverContent } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/text-area";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Selection } from "../../../../../components/menu-select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import MultiSelect from "@/components/ui/multi-select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export default function CustomOrderPopoverContent({
  selection,
  eventSlug,
  closePopover,
}: {
  selection: Selection;
  eventSlug: string;
  closePopover: () => void;
}) {
  const [pending, setPending] = useState(false);
  const [order, setOrder] = useState({
    item: {},
    name: "",
    modifiers: [],
    note: "",
  });

  return (
    <PopoverContent className="flex flex-col items-center space-y-4 w-full">
      <h2 className="text-xl mx-auto mb-2">Create a custom order</h2>
      <p>Only use this feature if a attendee faces issues with their phone</p>

      <form
        className="flex flex-col space-y-4 w-full"
        onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
          setPending(true);
          e.preventDefault();

          const body = {
            event: eventSlug,
            order: {
              status: "queued",
              key: `${new Date().toISOString()}`, //Replace with UUID at some point
              manual: true,
              address: "Manual Order",
              name: order?.name,
              item: order.item,
              //@ts-ignore
              originalText: `Manual Order: ${order?.name} ordered ${order?.item?.shortTitle}  ${order.modifiers?.length > 0 ? `with ${order?.modifiers?.map((m) => m?.value).join(", ")}` : ""} ${order?.note && `with note: ${order?.note}`}`,
            },
          };

          if (order?.modifiers?.length > 0) {
            //@ts-ignore
            body.order.modifiers = order?.modifiers.map(
              //@ts-ignore
              (modifier) => modifier?.value,
            );
          }

          fetch("/api/order", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
          }).then((res) => {
            setPending(false);
            if (res.ok) {
              closePopover();
              setOrder({
                item: {},
                name: "",
                modifiers: [],
                note: "",
              });
            }
          });
        }}
      >
        <Label aria-required htmlFor="name">
          Name
        </Label>
        <Input
          id="name"
          required
          placeholder="Attendee name"
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setOrder({ ...order, name: e.target.value })
          }
        />

        <Label aria-required htmlFor="item">
          Order Item
        </Label>
        <Select
          required
          onValueChange={(value) => {
            const choice = selection.items.find((item) => item.title === value);
            if (choice) {
              setOrder({ ...order, item: choice });
            }
          }}
        >
          <SelectTrigger id="item" className="w-full">
            <SelectValue placeholder="What do you want to order?" />
          </SelectTrigger>
          <SelectContent>
            {selection.items.map((item) => (
              <SelectItem key={item.title} value={item.title}>
                {item.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selection.modifiers.length > 0 && (
          <>
            <Label htmlFor="modifiers">Modifiers</Label>
            <MultiSelect
              placeholder="No Extras"
              className="w-full"
              value={order.modifiers}
              id="modifiers"
              options={selection.modifiers.map((m) => {
                return { label: m, value: m };
              })}
              onChange={(selected) => {
                //@ts-ignore
                setOrder({ ...order, modifiers: selected });
              }}
            />
          </>
        )}

        <Label htmlFor="note">Note</Label>
        <Textarea
          className="min-h-[50px]"
          id="note"
          value={order.note}
          onChange={(e) => setOrder({ ...order, note: e.target.value })}
          name="note"
          placeholder="Without regular milk or similar..."
        />
        <Button
          type="submit"
          disabled={pending}
          className="w-full bg-slate-200 hover:bg-slate-400 "
        >
          {pending ? "Creating..." : "Create Order"}
        </Button>
      </form>
    </PopoverContent>
  );
}
