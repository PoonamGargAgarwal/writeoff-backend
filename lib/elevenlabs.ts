const ELEVENLABS_BASE_URL = "https://api.elevenlabs.io/v1";
const DEFAULT_VOICE_ID = "21m00Tcm4TlvDq8ikWAM"; // Rachel

/**
 * Sends text to ElevenLabs API, returns audio buffer and content type.
 */
export async function synthesizeSpeech(
  apiKey: string,
  text: string,
): Promise<{ audio: Buffer; contentType: string }> {
  const res = await fetch(
    `${ELEVENLABS_BASE_URL}/text-to-speech/${DEFAULT_VOICE_ID}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": apiKey,
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_monolingual_v1",
      }),
    },
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`ElevenLabs API error (${res.status}): ${body}`);
  }

  const arrayBuffer = await res.arrayBuffer();
  const contentType = res.headers.get("content-type") ?? "audio/mpeg";

  return {
    audio: Buffer.from(arrayBuffer),
    contentType,
  };
}
