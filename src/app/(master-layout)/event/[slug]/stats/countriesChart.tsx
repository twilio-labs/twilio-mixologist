"use client";

import { ResponsiveBar } from "@nivo/bar";

export default function CountriesChart({ countries = [] }: { countries: any }) {
  countries = countries.sort((a: any, b: any) => b.count - a.count);

  //only keep top 9 countries and group the rest
  if (countries.length > 14) {
    const rest = countries.slice(14);
    const restCount = rest.reduce(
      (acc: number, cur: any) => acc + cur.count,
      0,
    );
    countries = countries.slice(0, 14);
    countries.push({ name: "Others", count: restCount });
  }

  return (
    <div className="w-full aspect-[2/1]">
      <ResponsiveBar
        data={countries}
        keys={["count"]}
        indexBy="name"
        margin={{ top: 0, right: 0, bottom: 40, left: 40 }}
        padding={0.3}
        colors={["#2563eb"]}
        axisBottom={{
          tickSize: 0,
          tickPadding: 16,
        }}
        axisLeft={{
          tickSize: 0,
          tickValues: 4,
          tickPadding: 16,
        }}
        gridYValues={4}
        theme={{
          tooltip: {
            chip: {
              borderRadius: "9999px",
            },
            container: {
              fontSize: "12px",
              textTransform: "capitalize",
              borderRadius: "6px",
            },
          },
          grid: {
            line: {
              stroke: "#f3f4f6",
            },
          },
        }}
        // @ts-ignore
        tooltipLabel={({ id }) => `${id}`}
        enableLabel={false}
        role="application"
        ariaLabel="A bar chart showing data"
      />
    </div>
  );
}
