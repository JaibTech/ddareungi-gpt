import { useEffect, useState } from "react";
import BikeMap from "../components/BikeMap";
import { getRecommendations } from "../api/bikeApi";

export default function Home() {
  const [stations, setStations] = useState<any[]>([]);

  const [userLocation, setUserLocation] =
    useState<{
      lat: number;
      lng: number;
    } | null>(null);

  const [selectedStation, setSelectedStation] =
    useState<any>(null);

  useEffect(() => {
    const params = new URLSearchParams(
      window.location.search
    );

    const lat = params.get("lat");
    const lng = params.get("lng");

    if (lat && lng) {
      const target = {
        lat: Number(lat),
        lng: Number(lng),
      };

      setUserLocation(target);

      setSelectedStation({
        name: "선택한 따릉이",
        lat: target.lat,
        lon: target.lng,
        bikeCount: 0,
        distance: 0,
      });

      return;
    }

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

  async function load() {
    if (!userLocation) return;

    const res = await getRecommendations(
      userLocation.lat,
      userLocation.lng,
      []
    );

    const result = res.stations ?? res;

    setStations(result);
  }

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
        selectedStation={selectedStation}
      />
    </div>
  );
}