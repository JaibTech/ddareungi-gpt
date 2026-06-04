import { useEffect, useState } from "react";
import BikeMap from "../components/BikeMap";
import { getRecommendations } from "../api/bikeApi";

export default function Home() {
  const [stations, setStations] = useState<any[]>([]);

  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  const [selectedStation, setSelectedStation] = useState<any>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    const bikeCount = params.get("bikeCount");
    const distance = params.get("distance");

    const stationsParam = params.get("stations");

    if (stationsParam) {
      try {
        const parsedStations = JSON.parse(decodeURIComponent(stationsParam));

        setStations(parsedStations);

        if (parsedStations.length > 0) {
          const first = parsedStations[0];

          setUserLocation({
            lat: first.lat,
            lng: first.lng,
          });

          setSelectedStation({
            name: first.name,
            lat: first.lat,
            lon: first.lng,
            bikeCount: bikeCount ? Number(bikeCount) : 0,
            distance: distance ? Number(distance) : 0,
          });
        }

        return;
      } catch (err) {
        console.error(err);
      }
    }

    const lat = params.get("lat");
    const lng = params.get("lng");
    const name = params.get("name") || "선택한 따릉이";

    if (lat && lng) {
      const targetLat = Number(lat);
      const targetLng = Number(lng);

      setUserLocation({
        lat: targetLat,
        lng: targetLng,
      });

      setSelectedStation({
        name,
        lat: targetLat,
        lon: targetLng,
        bikeCount: 0,
        distance: 0,
      });

      return;
    }

    if (!navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
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

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  useEffect(() => {
    async function load() {
      if (!userLocation) return;

      try {
        const res = await getRecommendations(
          userLocation.lat,
          userLocation.lng,
          []
        );

        setStations(res.stations ?? res);
      } catch (err) {
        console.error("추천 조회 실패:", err);
      }
    }

    load();
  }, [userLocation]);

  return (
    <div>
      <h1>🚲 따릉이 실시간 지도</h1>

      <BikeMap
        stations={stations}
        userLocation={userLocation}
        selectedStation={selectedStation}
      />
    </div>
  );
}