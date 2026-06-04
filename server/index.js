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

const SEOUL_API_KEY = process.env.SEOUL_BIKE_API_KEY?.trim();
const KAKAO_REST_API_KEY = process.env.KAKAO_REST_API_KEY?.trim();

const CLIENT_URL = "https://ddareungi-gpt-iod2.vercel.app";

app.get("/", (req, res) => {
  res.send("Ddareungi API is running");
});

app.get("/health", (req, res) => {
  res.json({
    ok: true,
    version: "bike-pagination-debug-v2",
  });
});

async function fetchBikeRange(start, end) {
  const url = `http://openapi.seoul.go.kr:8088/${SEOUL_API_KEY}/json/bikeList/${start}/${end}/`;

  const res = await fetch(url);
  const text = await res.text();

  console.log(`\n===== 따릉이 API ${start}~${end} =====`);
  console.log("HTTP STATUS:", res.status);
  console.log("RESPONSE HEAD:", text.slice(0, 500));

  if (!res.ok) {
    return [];
  }

  if (text.trim().startsWith("<")) {
    console.error("HTML 응답:", text.slice(0, 500));
    return [];
  }

  let data;

  try {
    data = JSON.parse(text);
  } catch (err) {
    console.error("JSON 파싱 실패:", err);
    return [];
  }

  if (!data.rentBikeStatus) {
    console.error("rentBikeStatus 없음:", data);
    return [];
  }

  const rows = data.rentBikeStatus.row || [];

  console.log(`로드 성공 ${start}~${end}: ${rows.length}개`);

  return rows;
}

async function getBikeData() {
  if (!SEOUL_API_KEY) {
    throw new Error("SEOUL_BIKE_API_KEY is missing");
  }

  const ranges = [
    [1, 1000],
    [1001, 2000],
    [2001, 3000],
    [3001, 4000],
    [4001, 5000],
  ];

  let allRows = [];

  for (const [start, end] of ranges) {
    const rows = await fetchBikeRange(start, end);
    allRows.push(...rows);
  }

  const uniqueMap = new Map();

  for (const row of allRows) {
    if (row.stationId) {
      uniqueMap.set(row.stationId, row);
    } else if (row.stationName) {
      uniqueMap.set(row.stationName, row);
    }
  }

  allRows = [...uniqueMap.values()];

  console.log("따릉이 전체 로드 수:", allRows.length);

  return allRows;
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

  console.log("카카오 검색 결과:", {
    input: place,
    selected: first.place_name,
    address: first.address_name,
    lat: first.y,
    lng: first.x,
  });

  return {
    placeName: first.place_name,
    lat: Number(first.y),
    lng: Number(first.x),
    address: first.address_name,
  };
}

async function buildRecommendations(lat, lng) {
  const rawData = await getBikeData();

  console.log("검색 좌표:", lat, lng);
  console.log("rawData count:", rawData.length);

  const stations = rawData
    .map((item) => ({
      stationName: item.stationName,
      lat: parseFloat(item.stationLatitude),
      lon: parseFloat(item.stationLongitude),
      parkingBikeTotCnt: parseInt(item.parkingBikeTotCnt, 10) || 0,
    }))
    .filter(
      (station) =>
        station.stationName &&
        !Number.isNaN(station.lat) &&
        !Number.isNaN(station.lon)
    );

  console.log("stations count:", stations.length);

  const results = recommendStations(stations, lat, lng, 3);

  console.log("추천 결과:", results);

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
    )}&bikeCount=${station.parkingBikeTotCnt}&distance=${station.distance}`,
  }));

  return {
    stations: response,
  };
}

app.post("/recommend", async (req, res) => {
  try {
    console.log("REQ BODY:", req.body);

    const { lat, lng } = req.body;

    if (lat === undefined || lng === undefined) {
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
    console.log("REQ BODY:", req.body);

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