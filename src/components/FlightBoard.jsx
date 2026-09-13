import { useState } from "react";
import { flights } from "../data/flights.js";

function airportMapsUrl(query) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function AirportLink({ query, label }) {
  return (
    <a
      className="rail-map"
      href={airportMapsUrl(query)}
      target="_blank"
      rel="noopener noreferrer"
      title={query}
      onClick={(event) => event.stopPropagation()}
    >
      {label}
    </a>
  );
}

function AirportMaps({ fromQuery, toQuery }) {
  if (!fromQuery && !toQuery) return null;
  return (
    <span className="rail-map-links">
      {fromQuery ? <AirportLink query={fromQuery} label="From" /> : null}
      {toQuery ? <AirportLink query={toQuery} label="To" /> : null}
    </span>
  );
}

function monthLabel(iso) {
  return Number(iso.slice(5, 7)) === 9 ? "Sep" : "Oct";
}

function joinMeta(parts) {
  return parts.filter(Boolean).join(" · ");
}

function summary(flight) {
  const seats = flight.segments.map((segment) => segment.seat).filter(Boolean);
  const overnight = (flight.transfers ?? [])
    .filter((transfer) => transfer.overnight)
    .map((transfer) => `overnight ${transfer.at}`);
  return joinMeta([
    flight.label,
    joinMeta([flight.airline, flight.pnr]),
    `${flight.segments.length} flight${flight.segments.length === 1 ? "" : "s"}`,
    flight.via.length ? `via ${flight.via.join(", ")}` : "",
    seats.length ? `seats ${seats.join(" + ")}` : "",
    ...overnight,
  ]);
}

function journeyDuration(flight) {
  return flight.segments.map((segment) => segment.duration).filter(Boolean).join(" + ");
}

function segmentMeta(segment) {
  if (!segment.flight && !segment.duration && !segment.distance && !segment.operator) return "";
  return joinMeta([segment.flight, segment.operator, segment.cabin, segment.duration, segment.distance]);
}

function isNextDay(departIso, arriveIso) {
  return Boolean(departIso && arriveIso && departIso !== arriveIso);
}

function FlightClock({ depart, arrive, departIso, arriveIso }) {
  if (!depart && !arrive) return null;
  const plus = isNextDay(departIso, arriveIso);
  return (
    <>
      {depart ? (
        <time dateTime={departIso ? `${departIso}T${depart}` : undefined}>{depart}</time>
      ) : null}
      {depart && arrive ? <span aria-hidden="true">→</span> : null}
      {arrive ? (
        <time dateTime={arriveIso ? `${arriveIso}T${arrive}` : undefined}>
          {arrive}
          {plus ? <small>+1</small> : null}
        </time>
      ) : null}
    </>
  );
}

export default function FlightBoard() {
  const [openId, setOpenId] = useState(null);

  return (
    <section className="rail" aria-label="Flight itinerary">
      <header className="rail-head">
        <span>Air</span>
        <span>Tap a route for seats and connections</span>
      </header>
      <ul className="rail-list">
        {flights.map((flight) => {
          const open = flight.id === openId;
          const duration = journeyDuration(flight);
          return (
            <li key={flight.id} className={open ? "is-open" : ""}>
              <button
                type="button"
                className={`rail-row ${open ? "is-active" : ""}`}
                onClick={() => setOpenId(open ? null : flight.id)}
                aria-expanded={open}
              >
                <span className="rail-when">
                  <em>{flight.weekday}</em>
                  {flight.n} {monthLabel(flight.departIso)}
                </span>
                <span className="rail-route">
                  <strong>
                    {flight.fromCode} {flight.from} → {flight.toCode} {flight.to}
                  </strong>
                  {duration ? <span className="rail-duration">{duration}</span> : null}
                  <em>{summary(flight)}</em>
                </span>
                <span className="rail-times">
                  <FlightClock
                    depart={flight.depart}
                    arrive={flight.arrive}
                    departIso={flight.departIso}
                    arriveIso={flight.arriveIso}
                  />
                  <span className="rail-chevron" aria-hidden="true">
                    ›
                  </span>
                </span>
              </button>
              {open ? (
                <ul className="rail-legs">
                  <li>
                    <ol className="rail-segments">
                      {flight.segments.map((segment, index) => {
                        const transfer = index > 0 ? flight.transfers[index - 1] : null;
                        const meta = segmentMeta(segment);
                        return (
                          <li key={segment.id}>
                            {transfer ? (
                              <p
                                className={`rail-change${transfer.overnight ? " is-overnight" : ""}${
                                  transfer.short ? " is-short" : ""
                                }`}
                              >
                                <span>
                                  Connection at{" "}
                                  <strong>
                                    {transfer.at} ({transfer.code})
                                  </strong>
                                </span>
                                {transfer.wait ? <span>{transfer.wait}</span> : null}
                                {transfer.overnight ? <em>Overnight</em> : null}
                              </p>
                            ) : null}
                            <div className="rail-segment">
                              <span className="rail-segment-route">
                                <strong>
                                  {segment.fromCode} {segment.from} → {segment.toCode} {segment.to}
                                </strong>
                                {meta ? <em>{meta}</em> : null}
                                {segment.seat ? (
                                  <span className="rail-seat">Seat {segment.seat}</span>
                                ) : null}
                                <AirportMaps
                                  fromQuery={segment.fromQuery}
                                  toQuery={segment.toQuery}
                                />
                              </span>
                              {(segment.depart || segment.arrive) ? (
                                <span className="rail-times">
                                  <FlightClock
                                    depart={segment.depart}
                                    arrive={segment.arrive}
                                    departIso={segment.departIso}
                                    arriveIso={segment.arriveIso}
                                  />
                                </span>
                              ) : null}
                            </div>
                          </li>
                        );
                      })}
                    </ol>
                  </li>
                </ul>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
