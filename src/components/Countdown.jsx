import { useEffect, useRef, useState } from "react";
import { pad } from "../lib/time.js";

const UNITS = [
  { key: "days", label: "Days", max: 30 },
  { key: "hours", label: "Hours", max: 24 },
  { key: "minutes", label: "Minutes", max: 60 },
  { key: "seconds", label: "Seconds", max: 60 },
];

const RING = 2 * Math.PI * 42;

function factsFor(unit, parts) {
  const { days, totalSeconds } = parts;
  switch (unit) {
    case "days":
      return `${days} sunrise${days === 1 ? "" : "s"} until wheels-up day`;
    case "hours":
      return `${Math.floor(totalSeconds / 3600).toLocaleString()} hours on the clock`;
    case "minutes":
      return `${Math.floor(totalSeconds / 60).toLocaleString()} minutes of waiting`;
    case "seconds":
      return `${totalSeconds.toLocaleString()} seconds left on the clock`;
    default:
      return "";
  }
}

function Flap({ value }) {
  const [tick, setTick] = useState(false);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return undefined;
    }
    setTick(true);
    const id = setTimeout(() => setTick(false), 160);
    return () => clearTimeout(id);
  }, [value]);

  return (
    <span className={`flap ${tick ? "is-tick" : ""}`}>
      <span className="flap-face">{value}</span>
    </span>
  );
}

function Unit({ unit, value, max, active, onSelect, parts }) {
  const digits = pad(value, 2).split("");
  const ratio = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0;

  return (
    <button
      type="button"
      className={`unit ${active ? "is-active" : ""}`}
      onClick={() => onSelect(unit.key)}
      aria-pressed={active}
      aria-label={`${value} ${unit.label}`}
    >
      <span className="unit-clock">
        <svg className="unit-ring" viewBox="0 0 100 100" aria-hidden="true">
          <circle className="unit-ring-track" cx="50" cy="50" r="42" />
          <g transform="rotate(-90 50 50)">
            <circle
              className="unit-ring-fill"
              cx="50"
              cy="50"
              r="42"
              strokeDasharray={`${ratio * RING} ${RING}`}
            />
          </g>
        </svg>
        <span className="unit-digits">
          {digits.map((digit, i) => (
            <Flap key={`${unit.key}-${i}`} value={digit} />
          ))}
        </span>
      </span>
      <span className="unit-label">{unit.label}</span>
      <span className={`unit-fact ${active ? "is-on" : ""}`}>
        {factsFor(unit.key, parts)}
      </span>
    </button>
  );
}

export default function Countdown({ parts, gone }) {
  const [focus, setFocus] = useState("days");

  if (gone) {
    return (
      <div className="countdown is-gone">
        <p className="gone-kicker">Status</p>
        <h2 className="gone-title">Departed</h2>
        <p className="gone-copy">Midnight hit. Lisbon is tonight.</p>
      </div>
    );
  }

  return (
    <div className="countdown">
      <p className="countdown-kicker">T-minus midnight · Sept 28</p>
      <div className="units" role="group" aria-label="Countdown">
        {UNITS.map((unit) => (
          <Unit
            key={unit.key}
            unit={unit}
            value={parts[unit.key]}
            max={unit.max}
            active={focus === unit.key}
            onSelect={setFocus}
            parts={parts}
          />
        ))}
      </div>
      <p className="countdown-hint">Tap a unit. Ring is how much of that slice is still left.</p>
    </div>
  );
}
