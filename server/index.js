import cors from "cors";
import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { trip } from "./trip.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = Number(process.env.PORT) || 3001;

app.use(cors());

app.get("/api/trip", (_req, res) => {
  res.json(trip);
});

app.get("/api/countdown", (_req, res) => {
  const target = Date.parse(trip.targetUtc);
  const now = Date.now();
  res.json({
    now,
    target,
    remainingMs: Math.max(0, target - now),
    timezone: trip.timezone,
  });
});

const dist = path.join(__dirname, "..", "dist");
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(path.join(dist, "index.html"));
  });
}

app.listen(PORT, () => {
  console.log(`Europe 2026 API http://localhost:${PORT}`);
});
