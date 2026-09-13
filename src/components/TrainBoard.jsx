import { useState } from "react";

function changeNote(count) {
  if (count === 0) return "direct";
  if (count === 1) return "1 change";
  return `${count} changes`;
}

function transferNote(leg) {
  if (!leg.transfers?.length) return changeNote(leg.changes);
  const places = leg.transfers.map((t) => t.at).join(", ");
  return `${changeNote(leg.changes)} at ${places}`;
}

function seatLabel({ reservation, cost }) {
  if (!reservation && !cost) return "";
  if (reservation && cost) return `Seat ${reservation} · ${cost}`;
  if (reservation) return `Seat ${reservation}`;
  return `Seat ${cost}`;
}

function seatTotal(leg) {
  const priced = (leg.segments ?? []).filter((s) => s.cost);
  if (!priced.length) {
    return seatLabel(leg);
  }
  if (priced.length === 1) {
    return seatLabel(priced[0]);
  }
  const bits = priced.map((s) => s.cost.replace(/^from\s+/i, ""));
  return `Seats ${bits.join(" + ")}`;
}

function SeatBadge({ reservation, cost }) {
  const label = seatLabel({ reservation, cost });
  if (!label) return null;
  const tone = reservation === "required" ? "is-required" : reservation ? "is-optional" : "";
  return <span className={`rail-seat ${tone}`.trim()}>{label}</span>;
}

/** Prefer precise Maps queries for known stations. */
const STATION_QUERIES = {
  "Lisboa Oriente": "Lisboa Oriente railway station Lisbon",
  Entroncamento: "Entroncamento railway station Portugal",
  Badajoz: "Badajoz railway station Spain",
  "Madrid-Atocha Cercanias": "Madrid Atocha Cercanías station",
  "Madrid-Puerta De Atocha": "Madrid Puerta de Atocha railway station",
  Girona: "Girona railway station Spain",
  "Port-Bou": "Portbou railway station Spain",
  Narbonne: "Narbonne railway station France",
  "Bordeaux St Jean": "Bordeaux Saint-Jean railway station",
  "Paris Montparnasse": "Paris Montparnasse railway station",
  "Paris Est": "Gare de l'Est Paris",
  Strasbourg: "Strasbourg railway station France",
  Offenburg: "Offenburg Hauptbahnhof",
  "Baden-Baden": "Baden-Baden railway station",
  "Bremen Hbf": "Bremen Hauptbahnhof",
  "Koeln Hbf": "Köln Hauptbahnhof",
  "Arth-Goldau": "Arth-Goldau railway station",
  Lugano: "Lugano railway station Switzerland",
  "Milano Centrale": "Milano Centrale railway station",
  "Venezia S. Lucia": "Venezia Santa Lucia railway station",
  "Trieste Centrale": "Trieste Centrale railway station",
  "Villa Opicina": "Villa Opicina railway station",
  Ljubljana: "Ljubljana railway station",
  Rijeka: "Rijeka railway station Croatia",
  Lupoglav: "Lupoglav railway station Croatia",
  Pula: "Pula railway station Croatia",
  Ostarije: "Ostarije railway station Croatia",
  Split: "Split railway station Croatia",
  "Zagreb Glavni Kol.": "Zagreb Glavni kolodvor",
  "Zidani Most": "Zidani Most railway station",
  Maribor: "Maribor railway station",
  "Graz Hbf": "Graz Hauptbahnhof",
  "Wien Hbf": "Wien Hauptbahnhof",
  "Budapest-Kelenföld": "Budapest Kelenföld railway station",
};

function stationMapsUrl(station) {
  const query = STATION_QUERIES[station] ?? `${station} train station`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function StationMapLink({ station, label }) {
  return (
    <a
      className="rail-map"
      href={stationMapsUrl(station)}
      target="_blank"
      rel="noopener noreferrer"
      title={station}
      onClick={(event) => event.stopPropagation()}
    >
      {label}
    </a>
  );
}

function StationMaps({ from, to }) {
  return (
    <span className="rail-map-links">
      <StationMapLink station={from} label="From" />
      <StationMapLink station={to} label="To" />
    </span>
  );
}

function monthLabel(iso) {
  return Number(iso.slice(5, 7)) === 9 ? "Sep" : "Oct";
}

function toMinutes(hm) {
  const [hours, minutes] = hm.split(":").map(Number);
  return hours * 60 + minutes;
}

function dayOffset(startIso, endIso) {
  return Math.round(
    (Date.parse(`${endIso}T00:00:00`) - Date.parse(`${startIso}T00:00:00`)) / 86400000,
  );
}

function formatWait(totalMinutes) {
  if (totalMinutes < 60) return `${totalMinutes} min`;

  const days = Math.floor(totalMinutes / (24 * 60));
  const afterDays = totalMinutes % (24 * 60);
  const hours = Math.floor(afterDays / 60);
  const minutes = afterDays % 60;
  const parts = [];

  if (days) parts.push(`${days}d`);
  if (hours) parts.push(`${hours}h`);
  if (minutes) parts.push(`${minutes}m`);
  return parts.join(" ");
}

/** Short city/station label for layover copy. */
function placeLabel(station) {
  const shortcuts = [
    ["Madrid", "Madrid"],
    ["Bordeaux", "Bordeaux"],
    ["Paris", "Paris"],
    ["Arth-Goldau", "Arth-Goldau"],
    ["Zagreb", "Zagreb"],
    ["Baden-Baden", "Baden-Baden"],
    ["Bremen", "Bremen"],
    ["Ljubljana", "Ljubljana"],
    ["Pula", "Pula"],
    ["Split", "Split"],
    ["Venezia", "Venice"],
    ["Lisboa", "Lisbon"],
  ];
  for (const [needle, label] of shortcuts) {
    if (station.includes(needle)) return label;
  }
  return station;
}

/** Wait from one train's arrival to the next train's departure. */
function waitBetween(prev, next) {
  const days = dayOffset(prev.arriveIso, next.departIso);
  const minutes = toMinutes(next.depart) - toMinutes(prev.arrive) + days * 24 * 60;
  if (minutes < 0) return null;

  const overnight = days > 0 && minutes < 24 * 60;
  const place = placeLabel(prev.to);
  const clock = formatWait(minutes);

  return {
    place,
    minutes,
    overnight,
    clock,
    short: `Next train ${clock}`,
    label:
      overnight
        ? `Overnight stop · ${place} · ${clock}`
        : minutes < 24 * 60
          ? `Layover · ${place} · ${clock}`
          : `Next train in ${clock} · ${place}`,
  };
}

function overnightNotes(journey) {
  const notes = [];
  for (let i = 1; i < journey.legs.length; i += 1) {
    const wait = waitBetween(journey.legs[i - 1], journey.legs[i]);
    if (wait?.overnight) {
      notes.push(`overnight ${wait.place} ${wait.clock}`);
    }
  }
  for (const leg of journey.legs) {
    if (leg.arriveNextDay || dayOffset(leg.departIso, leg.arriveIso) > 0) {
      notes.push(`night train ${leg.duration}`);
    }
  }
  return notes;
}

/** Door-to-door time from first depart to last arrive. */
function journeyDuration(journey) {
  const first = journey.legs[0];
  const last = journey.legs[journey.legs.length - 1];
  const days = dayOffset(first.departIso, last.arriveIso);
  const minutes = toMinutes(last.arrive) - toMinutes(first.depart) + days * 24 * 60;
  return formatWait(Math.max(0, minutes));
}

function DurationBadge({ label }) {
  if (!label) return null;
  return <span className="rail-duration">{label}</span>;
}

function summary(journey) {
  const nights = overnightNotes(journey);
  const nightBit = nights.length ? ` · ${nights.join(" · ")}` : "";

  if (journey.legs.length === 1) {
    const [leg] = journey.legs;
    const seats = seatTotal(leg);
    return `${transferNote(leg)}${seats ? ` · ${seats}` : ""}${nightBit}`;
  }
  const legHours = journey.legs.map((leg) => leg.duration).join(" + ");
  const hops = `${journey.legs.length} trains`;
  const via = journey.via.length ? ` · via ${journey.via.join(", ")}` : "";
  const seats = journey.legs.map(seatTotal).filter(Boolean);
  const seatBit = seats.length ? ` · ${seats.join(" · ")}` : "";
  return `${legHours} · ${hops}${via}${seatBit}${nightBit}`;
}

function NextTrainBadge({ wait }) {
  if (!wait) {
    return <span className="rail-next is-last">Last train</span>;
  }
  return (
    <span className={`rail-next${wait.overnight ? " is-overnight" : ""}`}>
      {wait.short}
      <em>{wait.place}</em>
    </span>
  );
}

function TrainSegments({ leg }) {
  const segments = leg.segments ?? [];
  const transfers = leg.transfers ?? [];
  if (!segments.length) return null;

  return (
    <ol className="rail-segments">
      {segments.map((segment, index) => (
        <li key={`${segment.from}-${segment.depart}`}>
          {index > 0 && transfers[index - 1] ? (
            <p
              className={`rail-change${transfers[index - 1].short ? " is-short" : ""}`}
            >
              <span>
                Change at <strong>{transfers[index - 1].at}</strong>
              </span>
              <span>{transfers[index - 1].wait}</span>
              {transfers[index - 1].short ? <em>Short transfer</em> : null}
              <StationMapLink station={transfers[index - 1].at} label="Station" />
            </p>
          ) : null}
          <div className="rail-segment">
            <span className="rail-segment-route">
              <strong>
                {segment.from} → {segment.to}
              </strong>
              <em>{segment.train || "Train"}</em>
              <DurationBadge label={segment.duration} />
              <SeatBadge reservation={segment.reservation} cost={segment.cost} />
              <StationMaps from={segment.from} to={segment.to} />
            </span>
            <span className="rail-times">
              <time>{segment.depart}</time>
              <span aria-hidden="true">→</span>
              <time>
                {segment.arrive}
                {segment.arriveNextDay ? <small>+1</small> : null}
              </time>
            </span>
          </div>
        </li>
      ))}
    </ol>
  );
}

function hasTransferDetails(leg) {
  return (leg.segments?.length ?? 0) > 1;
}

function TrainLeg({ leg, afterLeg, open, onToggle }) {
  const expandable = hasTransferDetails(leg);

  return (
    <li className={open ? "is-leg-open" : ""}>
      {expandable ? (
        <button
          type="button"
          className={`rail-leg rail-leg-toggle ${open ? "is-active" : ""}`}
          onClick={onToggle}
          aria-expanded={open}
        >
          <span className="rail-leg-route">
            <strong>
              {leg.from} → {leg.to}
            </strong>
            <DurationBadge label={leg.duration} />
            <em>
              {transferNote(leg)}
              {leg.arriveNextDay || dayOffset(leg.departIso, leg.arriveIso) > 0
                ? " · overnight train"
                : ""}
              {" · tap for transfers"}
            </em>
            {seatTotal(leg) ? (
              <span
                className={`rail-seat${
                  leg.reservation === "required" ? " is-required" : ""
                }`}
              >
                {seatTotal(leg)}
              </span>
            ) : null}
            <NextTrainBadge wait={afterLeg} />
          </span>
          <span className="rail-times">
            <time dateTime={`${leg.departIso}T${leg.depart}`}>{leg.depart}</time>
            <span aria-hidden="true">→</span>
            <time dateTime={`${leg.arriveIso}T${leg.arrive}`}>
              {leg.arrive}
              {leg.arriveNextDay ? <small>+1</small> : null}
            </time>
            <span className="rail-chevron" aria-hidden="true">
              ›
            </span>
          </span>
        </button>
      ) : (
        <div className="rail-leg">
          <span className="rail-leg-route">
            <strong>
              {leg.from} → {leg.to}
            </strong>
            <DurationBadge label={leg.duration} />
            <em>
              {transferNote(leg)}
              {leg.arriveNextDay || dayOffset(leg.departIso, leg.arriveIso) > 0
                ? " · overnight train"
                : ""}
            </em>
            {seatTotal(leg) ? (
              <span
                className={`rail-seat${
                  leg.reservation === "required" ? " is-required" : ""
                }`}
              >
                {seatTotal(leg)}
              </span>
            ) : null}
            <StationMaps from={leg.from} to={leg.to} />
            <NextTrainBadge wait={afterLeg} />
          </span>
          <span className="rail-times">
            <time dateTime={`${leg.departIso}T${leg.depart}`}>{leg.depart}</time>
            <span aria-hidden="true">→</span>
            <time dateTime={`${leg.arriveIso}T${leg.arrive}`}>
              {leg.arrive}
              {leg.arriveNextDay ? <small>+1</small> : null}
            </time>
          </span>
        </div>
      )}
      {expandable && open ? (
        <div className="rail-leg-detail">
          <StationMaps from={leg.from} to={leg.to} />
          <TrainSegments leg={leg} />
        </div>
      ) : null}
    </li>
  );
}

export default function TrainBoard({ journeys }) {
  const [openId, setOpenId] = useState(null);
  const [openLegId, setOpenLegId] = useState(null);

  function toggleJourney(id) {
    setOpenId((current) => {
      const next = current === id ? null : id;
      if (next !== current) setOpenLegId(null);
      return next;
    });
  }

  return (
    <section className="rail" aria-label="Train timetable">
      <header className="rail-head">
        <span>Rail</span>
        <span>Tap a route · tap a train for transfers</span>
      </header>
      <ul className="rail-list">
        {journeys.map((journey, journeyIndex) => {
          const open = journey.id === openId;
          const nextJourney = journeys[journeyIndex + 1];
          const afterJourney = nextJourney
            ? waitBetween(journey.legs[journey.legs.length - 1], nextJourney.legs[0])
            : null;

          return (
            <li key={journey.id} className={open ? "is-open" : ""}>
              <button
                type="button"
                className={`rail-row ${open ? "is-active" : ""}`}
                onClick={() => toggleJourney(journey.id)}
                aria-expanded={open}
              >
                <span className="rail-when">
                  <em>{journey.weekday}</em>
                  {journey.n} {monthLabel(journey.departIso)}
                </span>
                <span className="rail-route">
                  <strong>
                    {journey.from} → {journey.to}
                  </strong>
                  <DurationBadge label={journeyDuration(journey)} />
                  <em>{summary(journey)}</em>
                  <NextTrainBadge wait={afterJourney} />
                </span>
                <span className="rail-times">
                  <time dateTime={`${journey.departIso}T${journey.depart}`}>
                    {journey.depart}
                  </time>
                  <span aria-hidden="true">→</span>
                  <time dateTime={`${journey.arriveIso}T${journey.arrive}`}>
                    {journey.arrive}
                    {journey.arriveDaysLater ? (
                      <small>+{journey.arriveDaysLater}</small>
                    ) : null}
                  </time>
                  <span className="rail-chevron" aria-hidden="true">
                    ›
                  </span>
                </span>
              </button>
              {open ? (
                <ul className="rail-legs">
                  {journey.legs.map((leg, index) => {
                    const nextLeg = journey.legs[index + 1];
                    const afterLeg = nextLeg
                      ? waitBetween(leg, nextLeg)
                      : afterJourney;
                    return (
                      <TrainLeg
                        key={leg.id}
                        leg={leg}
                        afterLeg={afterLeg}
                        open={openLegId === leg.id}
                        onToggle={() =>
                          setOpenLegId((current) => (current === leg.id ? null : leg.id))
                        }
                      />
                    );
                  })}
                </ul>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
