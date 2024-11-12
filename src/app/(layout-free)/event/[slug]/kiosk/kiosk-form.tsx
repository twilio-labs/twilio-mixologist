"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Selection } from "../../../../../components/menu-select";

import { MenuItem as MenuItemInterface } from "@/config/menus";
import MultiSelect from "@/components/ui/multi-select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import MenuItem from "@/app/(layout-free)/event/[slug]/menu/menu-item";
import { Checkbox } from "@/components/ui/checkbox";
import { MessageCircleMoreIcon, MessageSquareIcon } from "lucide-react";

export default function OrderForm({
  selection,
  eventSlug,
}: {
  selection: Selection;
  eventSlug: string;
}) {
  const [pending, setPending] = useState(false);

  const { toast } = useToast();
  const [order, setOrder] = useState<{
    item: MenuItemInterface;
    phone: string;
    event: string;
    modifiers: any[];
    whatsapp: boolean;
    agreed: boolean;
  }>({
    item: {
      title: "",
      shortTitle: "",
      description: "",
    },
    event: eventSlug,
    phone: "",
    modifiers: [],
    whatsapp: false,
    agreed: false,
  });

  const incomplete =
    !order.item || !order.phone || !order.agreed || !order.item?.title;

  return (
    <div className="text-3xl flex flex-col space-y-12 w-full my-auto">
      <div className={`grid grid-cols-3 gap-8 select-none`}>
        {selection?.items.map((item: MenuItemInterface, index: Number) => (
          <div
            key={`${item.title}-${index}`}
            onClick={() => {
              setOrder({ ...order, item: item });
            }}
            className={`p-10 rounded-lg mb-2 ${item.title === order.item?.title ? "bg-gray-400" : "bg-gray-200"}   `}
          >
            <MenuItem
              title={item.title}
              shortTitle={item.shortTitle}
              description={item.description}
            />
          </div>
        ))}
      </div>
      {selection.modifiers.length > 0 && (
        <>
          <Label className="text-3xl" htmlFor="modifiers">
            Would you like any extras?
          </Label>
          <MultiSelect
            placeholder=""
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
      <Label className="text-3xl" aria-required htmlFor="phone">
        Phone number
      </Label>
      <div className="flex items-center space-x-2 my-4 mt-20 align-sp">
        <Input
          id="phone"
          className="text-3xl w-4/5"
          type="tel"
          required
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setOrder({ ...order, phone: e.target.value })
          }
        />
        <span
          className="text-2xl whitespace-nowrap mx-8 cursor-pointer"
          onClick={() => {
            setOrder({ ...order, whatsapp: !order.whatsapp });
          }}
        >
          {order.whatsapp ? "Via WhatsApp" : "Via SMS"}
        </span>

        <button
          title="Use WhatsApp"
          className={`rounded-lg p-1 bg-green-500 hover:bg-green-300`}
          onClick={() => {
            setOrder({ ...order, whatsapp: !order.whatsapp });
          }}
        >
          {order.whatsapp ? (
            <MessageCircleMoreIcon className={`h-12 w-12 text-white`} />
          ) : (
            <MessageSquareIcon className={`h-12 w-12 text-white`} />
          )}
        </button>
      </div>

      <div className="flex items-center space-x-2 my-4 mt-20">
        <Checkbox
          id="privacy"
          checked={order.agreed}
          onCheckedChange={(checked: boolean) => {
            setOrder({ ...order, agreed: checked });
          }}
        />
        <label htmlFor="privacy" className="font-medium leading-none ">
          I consent that Twilio can reach out to me with regard to my coffee
          order. All data will be deleted after the event.
        </label>
      </div>

      <Button
        onClick={(e) => {
          setPending(true);

          const body = {
            phone: order?.phone,
            whatsapp: order?.whatsapp,
            item: order.item,
            event: eventSlug,
          };

          if (order?.modifiers?.length > 0) {
            //@ts-ignore
            body.modifiers = order?.modifiers.map(
              //@ts-ignore
              (modifier) => modifier?.value,
            );
          }

          fetch("/api/kioskOrder", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
          }).then((res) => {
            setPending(false);
            if (res.ok) {
              setOrder({
                item: {
                  title: "",
                  shortTitle: "",
                  description: "",
                },
                event: eventSlug,
                phone: "",
                modifiers: [],
                agreed: false,
                whatsapp: false,
              });

              toast({
                title: "Order Created",
                // @ts-ignore
                description: `Your order for a ${order.item.title} has been created. Check your phone for the confirmation.`,
              });
            }
          });
        }}
        type="submit"
        disabled={pending || incomplete}
        className="text-3XL uppercase p-8 w-full bg-slate-300 hover:bg-slate-400 "
      >
        {pending ? "Creating..." : "Create Order"}
      </Button>
    </div>
  );
}
