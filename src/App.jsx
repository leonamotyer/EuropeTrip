import { useState } from "react";
import Countdown from "./components/Countdown.jsx";
import DepartureBoard from "./components/DepartureBoard.jsx";
import Sky from "./components/Sky.jsx";
import { useCountdown, useTrip } from "./hooks/useTrip.js";

export default function App() {
  const { trip, error } = useTrip();
  const parts = useCountdown(trip?.targetUtc);
  const [selectedId, setSelectedId] = useState("pt");
  const gone = Boolean(trip) && parts.remainingMs <= 0;

  if (error) {
    return (
      <main className="shell">
        <p className="error">API down. Run `npm run dev` so Express is on :3001.</p>
      </main>
    );
  }

  if (!trip) {
    return (
      <main className="shell">
        <p className="loading">Boarding pass printing…</p>
      </main>
    );
  }

  return (
    <div className="page">
      <Sky />
      <main className="shell">
        <header className="mast">
          <p className="mast-route">
            {trip.flight} · {trip.landing}
          </p>
          <h1>{trip.title}</h1>
          <p className="mast-sub">{trip.subtitle}</p>
          <p className="mast-when">
            {trip.targetLabel} · {trip.timezoneLabel}
          </p>
        </header>

        <Countdown parts={parts} gone={gone} />

        <DepartureBoard
          legs={trip.legs}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />

        <footer className="foot">
          <p>{trip.returnNote}</p>
          <p>Flights booked · Eurail purchased · countdown locked to midnight Edmonton</p>
        </footer>
      </main>
    </div>
  );
}
