import { useEffect, useRef } from "react";

type Props = {
  stations: any[];

  userLocation: {
    lat: number;
    lng: number;
  } | null;

  selectedStation: any;
};

export default function BikeMap({
  stations,
  userLocation,
  selectedStation,
}: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const userMarker = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current || !window.kakao?.maps) return;

    const map = new window.kakao.maps.Map(mapRef.current, {
      center: new window.kakao.maps.LatLng(
        userLocation?.lat || 37.5665,
        userLocation?.lng || 126.978
      ),
      level: 4,
    });

    mapInstance.current = map;

    if (userLocation) {
      const pos = new window.kakao.maps.LatLng(
        userLocation.lat,
        userLocation.lng
      );

      const marker = new window.kakao.maps.Marker({
        map,
        position: pos,
      });

      userMarker.current = marker;
    }

    stations.forEach((station) => {
      const stationLng = station.lon ?? station.lng;

      if (!station.lat || !stationLng) return;

      const position = new window.kakao.maps.LatLng(
        station.lat,
        stationLng
      );

      const color =
        station.bikeCount >= 10
          ? "green"
          : station.bikeCount >= 5
          ? "yellow"
          : "red";

      const imageSrc =
        color === "green"
          ? "https://maps.google.com/mapfiles/ms/icons/green-dot.png"
          : color === "yellow"
          ? "https://maps.google.com/mapfiles/ms/icons/yellow-dot.png"
          : "https://maps.google.com/mapfiles/ms/icons/red-dot.png";

      const markerImage = new window.kakao.maps.MarkerImage(
        imageSrc,
        new window.kakao.maps.Size(32, 32)
      );

      const marker = new window.kakao.maps.Marker({
        map,
        position,
        image: markerImage,
      });

      const info = new window.kakao.maps.InfoWindow({
        content: `
          <div style="padding:10px;font-size:13px;min-width:180px;">
            <strong>${station.name}</strong><br/>
            🚲 ${station.bikeCount ?? "-"}대<br/>
            📍 ${station.distance ?? "-"}m<br/>
            <a
              href="https://map.kakao.com/link/to/${encodeURIComponent(
                station.name
              )},${station.lat},${stationLng}"
              target="_blank"
              style="display:inline-block;margin-top:8px;color:#2563eb;font-weight:bold;text-decoration:none;"
            >
              길찾기
            </a>
          </div>
        `,
      });

      window.kakao.maps.event.addListener(marker, "click", () => {
        info.open(map, marker);
      });
    });
  }, [stations, userLocation]);

  useEffect(() => {
    if (!mapInstance.current || !userLocation) return;

    const moveLatLng = new window.kakao.maps.LatLng(
      userLocation.lat,
      userLocation.lng
    );

    mapInstance.current.setCenter(moveLatLng);

    if (userMarker.current) {
      userMarker.current.setPosition(moveLatLng);
    }
  }, [userLocation]);

  useEffect(() => {
    if (!selectedStation || !mapInstance.current) return;

    const stationLng =
      selectedStation.lon ?? selectedStation.lng;

    if (!selectedStation.lat || !stationLng) return;

    const moveLatLng = new window.kakao.maps.LatLng(
      selectedStation.lat,
      stationLng
    );

    const marker = new window.kakao.maps.Marker({
      map: mapInstance.current,
      position: moveLatLng,
    });

    const info = new window.kakao.maps.InfoWindow({
      content: `
        <div style="padding:10px;font-size:13px;min-width:180px;">
          <strong>${selectedStation.name}</strong><br/>
          🚲 ${selectedStation.bikeCount ?? "-"}대<br/>
          📍 ${selectedStation.distance ?? "-"}m<br/>
          <a
            href="https://map.kakao.com/link/to/${encodeURIComponent(
              selectedStation.name
            )},${selectedStation.lat},${stationLng}"
            target="_blank"
            style="display:inline-block;margin-top:8px;color:#2563eb;font-weight:bold;text-decoration:none;"
          >
            길찾기
          </a>
        </div>
      `,
    });

    mapInstance.current.panTo(moveLatLng);
    mapInstance.current.setLevel(3);
    info.open(mapInstance.current, marker);
  }, [selectedStation]);

  return (
    <div
      ref={mapRef}
      style={{
        width: "100%",
        height: "500px",
      }}
    />
  );
}