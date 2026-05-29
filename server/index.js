import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import {
  recommendStations,
  makeExplanation,
} from "./src/service/bikeRecommender.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Ddareungi API is running");
});

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

const SEOUL_API_KEY = process.env.SEOUL_BIKE_API_KEY;


async function getBikeData() {
  if (!SEOUL_API_KEY) {
    throw new Error("SEOUL_BIKE_API_KEY is missing");
  }

  const url = `http://openapi.seoul.go.kr:8088/${SEOUL_API_KEY}/json/bikeList/1/1000/`;

  const res = await fetch(url);
  const text = await res.text();

  if (!res.ok) {
    console.error("SEOUL API HTTP ERROR:", text);
    throw new Error(`Seoul API HTTP error: ${res.status}`);
  }

  if (text.trim().startsWith("<")) {
    console.error("SEOUL API HTML RESPONSE:", text.slice(0, 500));
    throw new Error("Seoul API returned HTML instead of JSON");
  }

  const data = JSON.parse(text);

  return data?.rentBikeStatus?.row || [];
}


app.post("/recommend", async (req, res) => {
  try {
    const { lat, lng } = req.body;

    if (!lat || !lng) {
      return res.status(400).json({
        error: "missing location",
      });
    }

    const rawData = await getBikeData();

    const stations = rawData.map((item) => ({
      stationName: item.stationName,
      lat: parseFloat(item.stationLatitude),
      lon: parseFloat(item.stationLongitude),
      parkingBikeTotCnt: parseInt(item.parkingBikeTotCnt, 10),
    }));

    const results = recommendStations(stations, lat, lng);

    const response = results.map((station) => ({
      name: station.stationName,
      distance: station.distance,
      bikeCount: station.parkingBikeTotCnt,
      score: station.score,
      reason: makeExplanation(station),
      lat: station.lat,
      lng: station.lon,
      mapUrl: `https://ddareungi-gpt-iod2.vercel.app/?lat=${station.lat}&lng=${station.lon}`,
    }));

    return res.json({
      stations: response,
    });
  } catch (err) {
    console.error("RECOMMEND ERROR:", err);

    return res.status(500).json({
      error: "Server error",
      message: err.message,
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`SERVER RUNNING ON ${PORT}`);
});