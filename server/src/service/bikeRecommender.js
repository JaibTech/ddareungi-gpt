export function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;

  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c * 1000;
}

export function getScore(station, userLat, userLng) {
  const distance = getDistance(
    userLat,
    userLng,
    station.lat,
    station.lon
  );

  const bikeCount = station.parkingBikeTotCnt;

  let score = 0;

  // 거리 우선 점수
  if (distance <= 200) score += 100;
  else if (distance <= 500) score += 80;
  else if (distance <= 1000) score += 50;
  else score -= 100;

  // 자전거 수 보조 점수
  if (bikeCount >= 10) score += 20;
  else if (bikeCount >= 5) score += 12;
  else if (bikeCount > 0) score += 5;
  else score -= 100;

  // 거리 패널티
  score -= distance / 30;

  return {
    ...station,
    distance: Math.round(distance),
    score,
  };
}

export function recommendStations(
  data,
  userLat,
  userLng,
  limit = 3
) {
  return data
    .map((station) =>
      getScore(station, userLat, userLng)
    )
    .filter((station) => station.distance <= 1000)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export function makeExplanation(station) {
  const walkMinute = Math.max(
    1,
    Math.round(station.distance / 80)
  );

  return `
📍 ${station.stationName}

🚲 이용 가능 자전거: ${station.parkingBikeTotCnt}대
📏 거리: 약 ${station.distance}m
🚶 도보: 약 ${walkMinute}분

👍 추천 이유:
- ${
    station.distance < 300
      ? "매우 가까움"
      : "1km 이내 접근 가능"
  }
- ${
    station.parkingBikeTotCnt >= 10
      ? "자전거 수가 충분히 많아 대여 가능성이 높음"
      : "현재 이용 가능한 자전거가 있음"
  }
  `.trim();
}