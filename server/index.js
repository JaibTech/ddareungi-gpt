import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import fetch from "node-fetch";

import {
  recommendStations,
  makeExplanation,
} from "./src/services/bikeRecommender.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// 🔑 따릉이 API KEY (환경변수)
const SEOUL_API_KEY =
  process.env.SEOUL_BIKE_API_KEY;

/**
 * 🚲 실시간 따릉이 데이터 가져오기
 */
async function getBikeData() {
  const url = `http://openapi.seoul.go.kr:8088/${SEOUL_API_KEY}/json/bikeList/1/1000/`;

  const res = await fetch(url);
  const data = await res.json();

  return data?.rentBikeStatus?.row || [];
}

/**
 * 🚲 추천 API
 */
app.post("/recommend", async (req, res) => {
  try {
    const { userLat, userLng } = req.body;

    if (!userLat || !userLng) {
      return res
        .status(400)
        .json({ error: "missing location" });
    }

    // 1. 따릉이 API 호출
    const rawData = await getBikeData();

    // 2. 데이터 변환 (서울 API → 우리 구조)
    const stations = rawData.map((item) => ({
      stationName: item.stationName,
      lat: parseFloat(item.stationLatitude),
      lon: parseFloat(item.stationLongitude),
      parkingBikeTotCnt: parseInt(
        item.parkingBikeTotCnt
      ),
    }));

    // 3. 추천 계산
    const results = recommendStations(
      stations,
      userLat,
      userLng
    );

    // 4. 설명 추가
    const response = results.map((s) => ({
      name: s.stationName,
      distance: s.distance,
      bikeCount: s.parkingBikeTotCnt,
      score: s.score,
      reason: makeExplanation(s),

      // 추가
      lat: s.lat,
      lon: s.lon,
    }));

    res.json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Server error",
    });
  }
});

app.listen(3000, () => {
  console.log("SERVER RUNNING");
});