"use client";

import { ResponsiveFunnel } from "@nivo/funnel";

export default function FunnelChart({ funnel }: { funnel: any }) {
  return (
    <div className="w-full aspect-2/1">
      <ResponsiveFunnel
        data={funnel}
        margin={{ top: 40, right: 0, bottom: 40, left: 40 }}
        valueFormat=">-.4s"
        colors={{ scheme: "spectral" }}
        borderWidth={20}
        labelColor={{
          from: "color",
          modifiers: [["darker", 3]],
        }}
        beforeSeparatorLength={100}
        beforeSeparatorOffset={20}
        afterSeparatorLength={100}
        afterSeparatorOffset={20}
        currentPartSizeExtension={10}
        currentBorderWidth={40}
        motionConfig="wobbly"
      />
    </div>
  );
}
