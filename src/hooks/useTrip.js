import { useEffect, useState } from "react";
import { remainingParts } from "../lib/time.js";

export function useTrip() {
  const [trip, setTrip] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/trip")
      .then((res) => {
        if (!res.ok) throw new Error(`Trip API ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (!cancelled) setTrip(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { trip, error };
}

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
