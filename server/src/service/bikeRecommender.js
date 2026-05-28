// server/src/services/bikeRecommender.js

// 1. 거리 계산 (Haversine)
export function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c * 1000; // meter
}

// 2. 추천 점수 계산
export function getScore(station, userLat, userLng) {
  const distance = getDistance(
    userLat,
    userLng,
    station.lat,
    station.lon
  );

  const bikeCount = station.parkingBikeTotCnt;

  let score = 0;

  // 거리 점수
  if (distance < 200) score += 50;
  else if (distance < 500) score += 30;
  else if (distance < 1000) score += 10;

  // 자전거 수 점수
  if (bikeCount >= 10) score += 30;
  else if (bikeCount >= 5) score += 20;
  else if (bikeCount > 0) score += 5;

  // 너무 멀면 감점
  // 거리 패널티 강화
  score -= distance / 50;

  // 자전거 0개 완전 제외
  if (bikeCount === 0) score -= 100;

  return {
    ...station,
    distance: Math.round(distance),
    score,
  };
}

// 3. 추천 리스트 생성 (TOP 3)
export function recommendStations(data, userLat, userLng) {
  return data
    .map((station) =>
      getScore(station, userLat, userLng)
    )
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

// 4. 설명 생성 (GPT 없이)
export function makeExplanation(station) {
  return `
📍 ${station.stationName}

🚲 거리: ${station.distance}m
🚴 자전거: ${station.parkingBikeTotCnt}대

👉 추천 이유:
- ${station.distance < 300 ? "매우 가까움" : "적당한 거리"}
- ${station.parkingBikeTotCnt >= 10 ? "자전거 여유 많음" : "이용 가능"}
  `.trim();
}