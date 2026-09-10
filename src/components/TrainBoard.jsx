import { useState } from "react";

function changeNote(count) {
  if (count === 0) return "direct";
  if (count === 1) return "1 change";
  return `${count} changes`;
}

function resNote(reservation) {
  if (!reservation) return "";
  return ` · res ${reservation}`;
}

function monthLabel(iso) {
  return Number(iso.slice(5, 7)) === 9 ? "Sep" : "Oct";
}

function toMinutes(hm) {
  const [hours, minutes] = hm.split(":").map(Number);
  return hours * 60 + minutes;
}

function waitLabel(prev, next) {
  const overnight = prev.arriveIso !== next.departIso;
  let wait = toMinutes(next.depart) - toMinutes(prev.arrive);
  if (overnight) wait += 24 * 60;
  const hours = Math.floor(wait / 60);
  const minutes = wait % 60;
  const clock = hours ? `${hours}h ${minutes}m` : `${minutes} min`;
  if (overnight) return `Overnight in ${prev.to} · ${clock}`;
  return `${clock} connection in ${prev.to}`;
}

function summary(journey) {
  if (journey.legs.length === 1) {
    const [leg] = journey.legs;
    return `${leg.duration} · ${changeNote(leg.changes)}${resNote(leg.reservation)}${leg.cost ? ` · ${leg.cost}` : ""}`;
  }
  const hops = `${journey.legs.length} trains`;
  const via = journey.via.length ? ` · via ${journey.via.join(", ")}` : "";
  return `${hops}${via}`;
}

export default function TrainBoard({ journeys }) {
  const [openId, setOpenId] = useState(null);

  return (
    <section className="rail" aria-label="Train timetable">
      <header className="rail-head">
        <span>Rail</span>
        <span>Tap a route · connections inside</span>
      </header>
      <ul className="rail-list">
        {journeys.map((journey) => {
          const open = journey.id === openId;
          return (
            <li key={journey.id} className={open ? "is-open" : ""}>
              <button
                type="button"
                className={`rail-row ${open ? "is-active" : ""}`}
                onClick={() => setOpenId(open ? null : journey.id)}
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
                  <em>{summary(journey)}</em>
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
                  {journey.legs.map((leg, index) => (
                    <li key={leg.id}>
                      {index > 0 ? (
                        <p className="rail-wait">{waitLabel(journey.legs[index - 1], leg)}</p>
                      ) : null}
                      <div className="rail-leg">
                        <span className="rail-leg-route">
                          <strong>
                            {leg.from} → {leg.to}
                          </strong>
                          <em>
                            {leg.duration} · {changeNote(leg.changes)}
                            {resNote(leg.reservation)}
                            {leg.cost ? ` · ${leg.cost}` : ""}
                          </em>
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
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
