import { useEffect, useState } from "react";
import BikeMap from "../components/BikeMap";
import { getRecommendations } from "../api/bikeApi";

export default function Home() {
  const [stations, setStations] = useState<any[]>(
    []
  );

  const [userLocation, setUserLocation] =
    useState<{
      lat: number;
      lng: number;
    } | null>(null);

  // 🚀 GPS 추적 시작
  useEffect(() => {
    if (!navigator.geolocation) return;

    const watchId =
      navigator.geolocation.watchPosition(
        (pos) => {
          setUserLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        },
        (err) => {
          console.error(err);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 1000,
          timeout: 5000,
        }
      );

    return () =>
      navigator.geolocation.clearWatch(watchId);
  }, []);

  // 🚲 추천 불러오기
  async function load() {
    if (!userLocation) return;

    const res = await getRecommendations(
      userLocation.lat,
      userLocation.lng,
      []
    );

    setStations(res);
  }

  // 위치 바뀌면 자동 추천
  useEffect(() => {
    if (userLocation) {
      load();
    }
  }, [userLocation]);

  return (
    <div>
      <h1>🚲 따릉이 실시간 지도</h1>

      <BikeMap
        stations={stations}
        userLocation={userLocation}
      />
    </div>
  );
}