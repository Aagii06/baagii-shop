"use client";

import { useEffect, useState } from "react";

function getMsUntilMidnight() {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return midnight.getTime() - now.getTime();
}

function formatDuration(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds]
    .map((n) => n.toString().padStart(2, "0"))
    .join(":");
}

export default function CountdownBadge() {
  const [msLeft, setMsLeft] = useState<number | null>(null);

  useEffect(() => {
    setMsLeft(getMsUntilMidnight());
    const interval = setInterval(() => {
      setMsLeft(getMsUntilMidnight());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <span className="bg-amber-100 text-amber-700 text-sm font-semibold px-3 py-1.5 rounded-lg tabular-nums">
      {msLeft === null ? "--:--:--" : formatDuration(msLeft)}
    </span>
  );
}
