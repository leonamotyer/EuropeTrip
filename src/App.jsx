import { useState } from "react";
import Countdown from "./components/Countdown.jsx";
import DepartureBoard from "./components/DepartureBoard.jsx";
import Sky from "./components/Sky.jsx";
import FlightBoard from "./components/FlightBoard.jsx";
import TrainBoard from "./components/TrainBoard.jsx";
import { journeys } from "./data/trains.js";
import { trip } from "./data/trip.js";
import { useCountdown } from "./hooks/useTrip.js";

export default function App() {
  const parts = useCountdown(trip.targetUtc);
  const [selectedId, setSelectedId] = useState("pt");
  const gone = parts.remainingMs <= 0;

  return (
    <div className="page">
      <Sky />
      <main className="shell">
        <header className="mast">
          <p className="mast-route">
            {trip.flight} · {trip.landing}
          </p>
          <p className="mast-route mast-route-home">
            {trip.homeFlight} · {trip.homeLanding}
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

        <FlightBoard />
        <TrainBoard journeys={journeys} />
      </main>
    </div>
  );
}
