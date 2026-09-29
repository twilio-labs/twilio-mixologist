"use client";

import { formatDistanceToNow } from "date-fns";
import { useEffect, useState } from "react";

export default function ClearedAgo({ timestamp }: { timestamp: string }) {
  const [, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  return <>{formatDistanceToNow(new Date(timestamp), { addSuffix: true })}</>;
}
