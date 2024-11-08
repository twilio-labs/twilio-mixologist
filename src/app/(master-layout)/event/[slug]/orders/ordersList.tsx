"use client";

import { useState } from "react";
import { Privilege } from "@/middleware";
import { getCookie } from "cookies-next";
import { addMessageToConversation } from "@/lib/twilio";
import { Badge } from "@/components/ui/badge";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

import { Event } from "@/app/(master-layout)/event/[slug]/page";

import {
  getOrderCancelledMessage,
  getOrderReadyMessage,
  getOrderReadyReminderMessage,
} from "@/lib/templates";

import { Check, Trash2Icon, BellRing, UserCheck } from "lucide-react";

export default function OrdersList({
  ordersList,
  event,
  updateEvent,
  deleteOrder,
  updateOrder,
  updateOrderTTL,
}: {
  ordersList: any[];
  event: Event;
  updateEvent: (data: any) => void;
  deleteOrder: (index: number) => void;
  updateOrder: (index: number, data: any) => void;
  updateOrderTTL: (index: number, ttl: number) => void;
}) {
  const { toast } = useToast();
  const [noOfOrdersVisible, showMore] = useState<number>(50);

  const isPriviledged = [Privilege.ADMIN, Privilege.MIXOLOGIST].includes(
    getCookie("privilege") as Privilege,
  );
  const queue = ordersList.filter(
    (order) => order.data.status === "queued" || order.data.status === "ready",
  );
  const visibleQueue = listComponent(queue.toSpliced(noOfOrdersVisible));
  const delivered = listComponent(
    ordersList.filter((order) => order.data.status === "delivered"),
  );
  const cancelled = listComponent(
    ordersList.filter((order) => order.data.status === "cancelled"),
  );

  return (
    <>
      <Tabs defaultValue="queue" className="w-full">
        <TabsList className="flex">
          <TabsTrigger data-testid="queueTab" className="flex-1" value="queue">
            Queue
            {queue.length > 0 && <Badge className="ml-1">{queue.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger
            data-testid="cancelledTab"
            className="flex-1"
            value="cancelled"
          >
            Cancelled
            {event?.cancelledCount != undefined && (
              <Badge className="ml-1">{event?.cancelledCount}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger
            data-testid="deliveredTab"
            className="flex-1"
            value="delivered"
          >
            Delivered
            {event?.deliveredCount != undefined && (
              <Badge className="ml-1">{event?.deliveredCount}</Badge>
            )}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="queue">
          {visibleQueue}
          {queue.length > visibleQueue.length && (
            <Button
              className="w-full bg-slate-200 hover:bg-slate-300 items-center justify-center"
              onClick={() => {
                showMore(noOfOrdersVisible + 10);
              }}
            >
              Show More
            </Button>
          )}
        </TabsContent>
        <TabsContent value="cancelled">{cancelled}</TabsContent>
        <TabsContent value="delivered">{delivered}</TabsContent>
      </Tabs>
    </>
  );

  function listComponent(orders: any[]) {
    return orders.map((order) => {
      const { data, index, dateUpdated } = order;
      // TODO Nathaniel refactor this to make sure the height is always the same, no matter the status
      return (
        <div
          key={index}
          role="row"
          className={`${data.status === "ready" || data.status === "delivered" ? "bg-green-100" : "bg-slate-100"} ${data.status === "cancelled" ? "bg-red-100" : ""} border rounded-lg px-4 flex items-start gap-4 my-2  hover:bg-slate-200 h-32`}
        >
          <p className="text-2xl my-auto">#{index}</p>
          <div className="my-auto">
            <h3 className="font-semibold">{`${data.item.shortTitle} ${data?.modifiers ? ` with ${data.modifiers}` : ""}`}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Original Message - "{data?.originalText}"
            </p>
          </div>

          <div className="ml-auto flex flex-wrap items-center space-x-2 my-auto">
            <p>{data?.manual ? data?.name : data?.address}</p>
            <div className="flex flex-wrap justify-center">
              {isPriviledged && (
                <div>
                  {data.status === "ready" && !data?.manual && (
                    <Button
                      className="w-full hover:bg-yellow-300 items-center justify-center"
                      title="Send Reminder"
                      disabled={
                        Date.now() - dateUpdated < 3 * 60 * 1000 &&
                        data?.reminded
                      }
                      onClick={(
                        ev: React.MouseEvent<HTMLButtonElement, MouseEvent> & {
                          target: HTMLButtonElement;
                        },
                      ) => {
                        ev.target.disabled = true;
                        const message = getOrderReadyReminderMessage(
                          data.item.shortTitle,
                          index,
                          event.pickupLocation,
                        );
                        addMessageToConversation(data.key, message);
                        updateOrder(index, { reminded: true });
                        toast({
                          title: "Customer Reminded",
                          description: `Customer has been sent a message reminding them that their order is ready`,
                        });
                      }}
                    >
                      <BellRing />
                    </Button>
                  )}
                  {data.status == "queued" && (
                    <Button
                      className=" hover:bg-green-300 flex items-center justify-center"
                      title="Order Made"
                      onClick={(
                        ev: React.MouseEvent<HTMLButtonElement, MouseEvent> & {
                          target: HTMLButtonElement;
                        },
                      ) => {
                        ev.target.disabled = true;
                        updateOrder(index, { status: "ready" });

                        if (!data?.manual) {
                          const message = getOrderReadyMessage(
                            data.item.shortTitle,
                            index,
                            event.pickupLocation,
                          );
                          addMessageToConversation(data.key, message);
                        }

                        toast({
                          title: "Order Made",
                          description: data?.manual
                            ? "Please inform the customer that their order is ready."
                            : `Customer has been sent a message letting them know their order is ready`,
                        });
                      }}
                    >
                      <Check />
                    </Button>
                  )}
                  {data.status === "ready" && (
                    <Button
                      className="hover:bg-green-300 flex items-center justify-center"
                      title="Served to Customer"
                      onClick={async (
                        ev: React.MouseEvent<HTMLButtonElement, MouseEvent> & {
                          target: HTMLButtonElement;
                        },
                      ) => {
                        ev.target.disabled = true;
                        updateOrder(index, { status: "delivered" });
                        updateOrderTTL(index, 5 * 60);

                        await updateEvent({
                          deliveredCount:
                            Number(event?.deliveredCount || 0) + 1,
                        });
                        toast({
                          title: "Order Served",
                          description: `The Order was delivered`,
                        });
                      }}
                    >
                      <UserCheck />
                    </Button>
                  )}
                  {data.status !== "cancelled" &&
                    data.status !== "delivered" && (
                      <Button
                        className="hover:bg-red-300 flex items-center justify-center"
                        title="Delete Order"
                        onClick={async (
                          ev: React.MouseEvent<
                            HTMLButtonElement,
                            MouseEvent
                          > & {
                            target: HTMLButtonElement;
                          },
                        ) => {
                          ev.target.disabled = true;
                          updateOrder(index, { status: "cancelled" });
                          updateOrderTTL(index, 5 * 60);

                          await updateEvent({
                            cancelledCount:
                              Number(event?.cancelledCount || 0) + 1,
                          });

                          if (!data?.manual) {
                            const message = getOrderCancelledMessage(
                              data.item.shortTitle,
                              index,
                            );
                            addMessageToConversation(data.key, message);
                          }
                          toast({
                            title: "Order Cancelled",
                            description: data?.manual
                              ? "Please inform the customer that their order has been cancelled."
                              : `Customer has been sent a message to let them know order was cancelled.`,
                          });
                        }}
                      >
                        <Trash2Icon />
                      </Button>
                    )}
                </div>
              )}
            </div>
          </div>
        </div>
      );
    });
  }
}
