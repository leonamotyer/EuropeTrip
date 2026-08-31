import { useEffect, useState } from "react";
import { remainingParts } from "../lib/time.js";

export function useCountdown(targetUtc) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!targetUtc) return undefined;
    const tick = () => setNow(Date.now());
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [targetUtc]);

  if (!targetUtc) {
    return remainingParts(0);
  }

  return remainingParts(Date.parse(targetUtc) - now);
}
