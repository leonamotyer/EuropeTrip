import { trainsTouching } from "../data/trains.js";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function weekdayIndex(weekday) {
  return WEEKDAYS.indexOf(weekday);
}

function TrainTimes({ iso, trains }) {
  if (!trains.length) return null;

  return (
    <ul className="cal-trains">
      {trains.map((train) => {
        const arrivingOnly = train.arriveIso === iso && train.departIso !== iso;
        return (
          <li key={train.id}>
            <span className="cal-train-times">
              {arrivingOnly
                ? `Arrive ${train.arrive}`
                : `${train.depart} → ${train.arrive}${train.arriveNextDay ? " +1" : ""}`}
            </span>
            <span className="cal-train-route">
              {train.from} → {train.to}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function CalendarMonth({ leg }) {
  const startPad = Math.max(0, weekdayIndex(leg.days[0]?.weekday));
  const blanks = Array.from({ length: startPad }, (_, i) => i);

  return (
    <div className="cal">
      <div className="cal-meta">
        <p className="cal-month">{leg.month}</p>
        <ul className="cal-stays">
          {(leg.stays ?? []).map((stay) => (
            <li key={stay.name} className="cal-stay-row">
              <p className="cal-stay">
                <strong>{stay.name}</strong>
                {stay.detail ? ` · ${stay.detail}` : ""}
              </p>
              <span className="cal-map-links">
                <a
                  className="cal-map"
                  href={stay.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Hostel
                </a>
                {stay.transit ? (
                  <a
                    className="cal-map"
                    href={stay.transit.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={stay.transit.name}
                  >
                    Station
                  </a>
                ) : null}
              </span>
            </li>
          ))}
        </ul>
        <p className="cal-shop">
          <strong>Buy: </strong>
          {leg.shopping}
        </p>
      </div>
      <div className="cal-weekdays" aria-hidden="true">
        {WEEKDAYS.map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>
      <div className="cal-grid">
        {blanks.map((i) => (
          <div key={`pad-${i}`} className="cal-blank" />
        ))}
        {leg.days.map((day) => {
          const dayTrains = trainsTouching(day.iso);
          const tag = dayTrains.length && day.tag !== "activity" ? "travel" : day.tag;
          return (
            <article
              key={day.iso}
              className={`cal-day is-${tag}${dayTrains.length ? " has-train" : ""}`}
            >
              <header className="cal-day-head">
                <span className="cal-day-dow">{day.weekday}</span>
                <span className="cal-day-n">{day.n}</span>
              </header>
              <h4>{day.title}</h4>
              <TrainTimes iso={day.iso} trains={dayTrains} />
              <p>{day.plan}</p>
              <span className="cal-day-cost">{day.cost}</span>
            </article>
          );
        })}
      </div>
    </div>
  );
}

export default function DepartureBoard({ legs, selectedId, onSelect }) {
  return (
    <section className="board" aria-label="Trip calendar">
      <header className="board-head">
        <span>Calendar</span>
        <span>Sep 28 – Oct 28 · 2026</span>
      </header>
      <ul className="board-list">
        {legs.map((leg) => {
          const active = leg.id === selectedId;
          return (
            <li key={leg.id} className={active ? "is-open" : ""}>
              <button
                type="button"
                className={`board-row ${active ? "is-active" : ""}`}
                onClick={() => onSelect(active ? null : leg.id)}
                aria-expanded={active}
              >
                <span className="board-code">{leg.code}</span>
                <span className="board-city">
                  <strong>{leg.city}</strong>
                  <em>
                    {leg.country} · {leg.nights}N
                  </em>
                </span>
                <span className="board-chips" aria-label={leg.dates}>
                  {leg.days.map((day) => {
                    const onRail = trainsTouching(day.iso).length > 0;
                    const tag = onRail && day.tag !== "activity" ? "travel" : day.tag;
                    return (
                      <span key={day.iso} className={`chip is-${tag}`}>
                        <em>{day.weekday.slice(0, 2)}</em>
                        {day.n}
                      </span>
                    );
                  })}
                </span>
              </button>
              {active ? <CalendarMonth leg={leg} /> : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
