export async function getRecommendations(
  userLat: number,
  userLng: number,
  stations: any[]
) {
  const res = await fetch(
    "http://localhost:3000/recommend",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userLat,
        userLng,
        stations,
      }),
    }
  );

  if (!res.ok) {
    throw new Error("API Error");
  }

  return res.json();
}