import express from "express";
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
    // GPT Action 요청값
    const { lat, lng } = req.body;

    const userLat = lat;
    const userLng = lng;

    if (!userLat || !userLng) {
      return res
        .status(400)
        .json({ error: "missing location" });
    }

    // 1. 따릉이 API 호출
    const rawData = await getBikeData();

    // 2. 데이터 변환
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

    // 4. GPT 응답 구조
    const response = results.map((s) => ({
      name: s.stationName,
      distance: s.distance,
      bikeCount: s.parkingBikeTotCnt,
      score: s.score,
      reason: makeExplanation(s),

      lat: s.lat,
      lng: s.lon,

      mapUrl: `https://ddareungi-app.vercel.app/map?lat=${s.lat}&lng=${s.lon}`,
    }));

    res.json({
      stations: response,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: "Server error",
    });
  }
});

// 🚀 Railway / Render 대응
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`SERVER RUNNING ON ${PORT}`);
});