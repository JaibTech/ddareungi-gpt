export async function streamMessage(
  message: string,
  onChunk: (chunk: string) => void
) {
  const response = await fetch(
    "http://localhost:3000/chat",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
      }),
    }
  );

  const reader = response.body?.getReader();

  if (!reader) return;

  const decoder = new TextDecoder();

  while (true) {
    const { done, value } =
      await reader.read();

    if (done) break;

    const chunk = decoder.decode(value);

    onChunk(chunk);
  }
}