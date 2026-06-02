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
const KAKAO_REST_API_KEY = process.env.KAKAO_REST_API_KEY;

const CLIENT_URL = "https://ddareungi-gpt-iod2.vercel.app";

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

async function searchPlace(place) {
  if (!KAKAO_REST_API_KEY) {
    throw new Error("KAKAO_REST_API_KEY is missing");
  }

  const query = `${place} 서울`;

  const url = `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(
    query
  )}`;

  const res = await fetch(url, {
    headers: {
      Authorization: `KakaoAK ${KAKAO_REST_API_KEY}`,
    },
  });

  const data = await res.json();

  if (!res.ok) {
    console.error("KAKAO API ERROR:", data);
    throw new Error(`Kakao API error: ${res.status}`);
  }

  if (!data.documents || data.documents.length === 0) {
    throw new Error(`장소를 찾을 수 없습니다: ${place}`);
  }

  const first = data.documents[0];

  return {
    placeName: first.place_name,
    lat: Number(first.y),
    lng: Number(first.x),
    address: first.address_name,
  };
}

async function buildRecommendations(lat, lng) {
  const rawData = await getBikeData();

  const stations = rawData.map((item) => ({
    stationName: item.stationName,
    lat: parseFloat(item.stationLatitude),
    lon: parseFloat(item.stationLongitude),
    parkingBikeTotCnt: parseInt(item.parkingBikeTotCnt, 10),
  }));

  const results = recommendStations(stations, lat, lng, 3);

  const response = results.map((station) => ({
    name: station.stationName,
    distance: station.distance,
    bikeCount: station.parkingBikeTotCnt,
    score: station.score,
    reason: makeExplanation(station),
    lat: station.lat,
    lng: station.lon,
    mapUrl: `${CLIENT_URL}/?lat=${station.lat}&lng=${station.lon}&name=${encodeURIComponent(
      station.stationName
    )}`,
  }));

  return {
    stations: response,
  };
}

app.post("/recommend", async (req, res) => {
  try {
    const { lat, lng } = req.body;

    if (!lat || !lng) {
      return res.status(400).json({
        error: "missing location",
      });
    }

    const result = await buildRecommendations(Number(lat), Number(lng));

    return res.json(result);
  } catch (err) {
    console.error("RECOMMEND ERROR:", err);

    return res.status(500).json({
      error: "Server error",
      message: err.message,
    });
  }
});

app.post("/recommendByPlace", async (req, res) => {
  try {
    const { place } = req.body;

    if (!place) {
      return res.status(400).json({
        error: "missing place",
      });
    }

    const location = await searchPlace(place);

    const result = await buildRecommendations(location.lat, location.lng);

    return res.json({
      place: location.placeName,
      address: location.address,
      lat: location.lat,
      lng: location.lng,
      ...result,
    });
  } catch (err) {
    console.error("RECOMMEND BY PLACE ERROR:", err);

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