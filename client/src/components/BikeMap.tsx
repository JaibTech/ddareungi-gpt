stations.forEach((station) => {
  const stationLng = station.lon ?? station.lng;

  if (!station.lat || !stationLng) return;

  const position = new window.kakao.maps.LatLng(
    station.lat,
    stationLng
  );

  const marker = new window.kakao.maps.Marker({
    map,
    position,
  });

  const info = new window.kakao.maps.InfoWindow({
    content: `
      <div style="padding:10px;font-size:13px;min-width:170px;">
        <strong>${station.name}</strong><br/>
        🚲 ${station.bikeCount ?? 0}대<br/>
        📍 ${station.distance ?? 0}m<br/>
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