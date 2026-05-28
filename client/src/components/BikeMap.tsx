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
    if (!mapRef.current || !window.kakao) return;

    // 🗺️ 지도 생성
    const map = new window.kakao.maps.Map(
      mapRef.current,
      {
        center: new window.kakao.maps.LatLng(
          userLocation?.lat || 37.5665,
          userLocation?.lng || 126.978
        ),

        level: 4,
      }
    );

    mapInstance.current = map;

    // 👤 내 위치 마커
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

    // 🚲 따릉이 마커
    stations.forEach((station) => {
      const position = new window.kakao.maps.LatLng(
        station.lat,
        station.lon
      );

      // 🚦 혼잡도 색상
      const color =
        station.bikeCount >= 10
          ? "green"
          : station.bikeCount >= 5
          ? "yellow"
          : "red";

      // 🎨 마커 이미지
      const imageSrc =
        color === "green"
          ? "https://maps.google.com/mapfiles/ms/icons/green-dot.png"
          : color === "yellow"
          ? "https://maps.google.com/mapfiles/ms/icons/yellow-dot.png"
          : "https://maps.google.com/mapfiles/ms/icons/red-dot.png";

      const imageSize =
        new window.kakao.maps.Size(32, 32);

      const markerImage =
        new window.kakao.maps.MarkerImage(
          imageSrc,
          imageSize
        );

      // 📍 마커 생성
      const marker = new window.kakao.maps.Marker({
        map,
        position,
        image: markerImage,
      });

      // ℹ️ 정보창
      const info = new window.kakao.maps.InfoWindow({
        content: `
          <div style="padding:6px;font-size:12px;">
            <strong>${station.name}</strong><br/>
            🚲 ${station.bikeCount}대<br/>
            📍 ${station.distance}m
          </div>
        `,
      });

      // 🖱️ 마커 클릭
      window.kakao.maps.event.addListener(
        marker,
        "click",
        () => {
          info.open(map, marker);
        }
      );
    });
  }, [stations, userLocation]);

  // 👤 내 위치 이동 시 지도 중심 이동
  useEffect(() => {
    if (!mapInstance.current || !userLocation)
      return;

    const moveLatLng =
      new window.kakao.maps.LatLng(
        userLocation.lat,
        userLocation.lng
      );

    // 지도 중심 이동
    mapInstance.current.setCenter(moveLatLng);

    // 내 위치 마커 이동
    if (userMarker.current) {
      userMarker.current.setPosition(moveLatLng);
    }
  }, [userLocation]);

  // 🚀 카드 클릭 시 해당 따릉이로 이동
  useEffect(() => {
    if (
      !selectedStation ||
      !mapInstance.current
    )
      return;

    const moveLatLng =
      new window.kakao.maps.LatLng(
        selectedStation.lat,
        selectedStation.lon
      );

    // 📍 부드럽게 이동
    mapInstance.current.panTo(moveLatLng);

    // 🔍 확대
    mapInstance.current.setLevel(3);
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