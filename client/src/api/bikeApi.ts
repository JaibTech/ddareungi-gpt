const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

export async function getRecommendations(
  userLat: number,
  userLng: number,
) {
  const res = await fetch(`${API_BASE_URL}/recommend`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      lat: userLat,
      lng: userLng,
    }),
  });

  if (!res.ok) {
    throw new Error("API Error");
  }

  return res.json();
}