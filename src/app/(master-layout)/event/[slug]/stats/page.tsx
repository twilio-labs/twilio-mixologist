"use client";

import { isClientAuth } from "@/lib/customHooks";
import { useToast } from "@/components/ui/use-toast";
import {
  CardTitle,
  CardDescription,
  CardHeader,
  CardContent,
  Card,
} from "@/components/ui/card";

import { Coffee, CupSoda, Globe2Icon, User2Icon } from "lucide-react";
import OrdersChart from "./ordersChart";
import { modes } from "@/config/menus";
import FunnelChart from "./funnelChart";
import { MixologistStats } from "@/app/api/event/[slug]/stats/helper";
import { useEffect, useState } from "react";
import CountriesChart from "./countriesChart";
import { Privilege } from "@/middleware";

function StatsPage({ params }: { params: { slug: string } }) {
  const { toast } = useToast();
  const [stats, setStats] = useState<MixologistStats>();

  useEffect(() => {
    fetch(`/api/event/${params.slug}/stats`, {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setStats(data);
      })
      .catch((err) => {
        console.error(err);
        toast({
          title: "Error",
          description: "Failed to fetch data",
        });
      });
  }, []);

  return (
    <main className="p-4 md:p-6 lg:p-8 space-y-8">
      {!stats && (
        <div className="w-2/3 mx-auto h-10 bg-gray-300 rounded animate-pulse"></div>
      )}

      <div className="w-full">
        <h2 className="text-2xl font-semibold mb-6 text-center">
          Statistics for {params.slug}
        </h2>
        <section>
          {/* <header className="flex items-center h-16 px-4 shrink-0 md:px-6">
            <div className="flex items-center w-full gap-4 md:ml-auto md:gap-2 lg:gap-4">
              <form className="flex-1 ml-auto sm:flex-initial">
                <div className="relative">
                  <DatePickerWithRange
                    onChange={() => {
                      toast({
                        title: "Mock data",
                        description: "This page only shows mock data for now",
                      });
                    }}
                  />
                </div>
              </form>
              <Button
                className="rounded-full  hover:bg-slate-200 "
                onClick={() => {
                  toast({
                    title: "Mock data",
                    description: "This page only shows mock data for now",
                  });
                }}
              >
                <RefreshCwIcon />
              </Button>
            </div>
          </header> */}
          <main className="flex-1 p-6 space-y-4">
            <section className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">
                    Total Number of Orders
                  </CardTitle>
                </CardHeader>
                {stats ? (
                  <CardContent>
                    <p className="text-4xl font-bold">
                      {stats.cancelledCount + stats.deliveredCount}
                    </p>

                    <p className="text-sm text-gray-600">
                      {stats.cancelledCount || "No"} cancelled orders
                    </p>
                  </CardContent>
                ) : (
                  <CardContent>
                    <div className="w-2/3 mx-auto h-10 bg-gray-300 rounded animate-pulse"></div>
                  </CardContent>
                )}
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">
                    Unique Customers
                  </CardTitle>
                </CardHeader>
                {stats ? (
                  <CardContent>
                    <p className="text-4xl font-bold">{stats.customerCount}</p>
                  </CardContent>
                ) : (
                  <CardContent>
                    <div className="w-2/3 mx-auto h-10 bg-gray-300 rounded animate-pulse"></div>
                  </CardContent>
                )}
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">
                    Most Popular Beverage
                  </CardTitle>
                </CardHeader>
                {stats ? (
                  <CardContent>
                    <p className="text-4xl font-bold">
                      {stats.mostOrderedItem}
                    </p>
                    <p className="text-sm text-gray-600">
                      {stats.mostOrderedItemCount} orders
                    </p>
                  </CardContent>
                ) : (
                  <CardContent>
                    <div className="w-2/3 mx-auto h-10 bg-gray-300 rounded animate-pulse"></div>
                  </CardContent>
                )}
              </Card>
            </section>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <div className="flex flex-col space-y-0.5">
                  <CardTitle className="text-sm font-medium">Country</CardTitle>
                  <CardDescription className="text-xs">
                    Breakdown of country codes
                  </CardDescription>
                </div>
                <Globe2Icon className="w-4 h-4 text-gray-500 " />
              </CardHeader>
              <CardContent>
                <CountriesChart
                  countries={
                    stats?.countries &&
                    Object.entries(stats.countries).map(([key, value]) => ({
                      name: key,
                      count: value,
                    }))
                  }
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <div className="flex flex-col space-y-0.5">
                  <CardTitle className="text-sm font-medium">
                    Drinks Orders
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Breakdown of drinks orders
                  </CardDescription>
                </div>
                {stats?.mode === modes.smoothie ? (
                  <CupSoda className="w-4 h-4 text-gray-500 " />
                ) : (
                  <Coffee className="w-4 h-4 text-gray-500 " />
                )}
              </CardHeader>
              {stats ? (
                <CardContent>
                  <OrdersChart
                    orders={Object.entries(stats.orderItemCounter).map(
                      ([key, value]) => ({
                        name: key,
                        count: value,
                      }),
                    )}
                  />
                </CardContent>
              ) : (
                <CardContent>
                  <div className="w-2/3 mx-auto h-10 bg-gray-300 rounded animate-pulse"></div>
                </CardContent>
              )}
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <div className="flex flex-col space-y-0.5">
                  <CardTitle className="text-sm font-medium">
                    Attendee Funnel
                  </CardTitle>
                  <CardDescription className="text-xs">
                    See how many attendees are at each stage
                  </CardDescription>
                </div>
                <User2Icon className="w-4 h-4 text-gray-500 " />
              </CardHeader>
              {stats ? (
                <CardContent>
                  <FunnelChart funnel={stats.summedUpStages} />
                </CardContent>
              ) : (
                <CardContent>
                  <div className="w-2/3 mx-auto h-10 bg-gray-300 rounded animate-pulse"></div>
                </CardContent>
              )}
            </Card>
          </main>
        </section>
      </div>
    </main>
  );
}

export default isClientAuth([Privilege.ADMIN], StatsPage);
