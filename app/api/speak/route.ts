import { getApiKeys } from "@/lib/config";
import { synthesizeSpeech } from "@/lib/elevenlabs";

export async function POST(request: Request) {
  // Check API key
  let apiKey: string;
  try {
    const keys = getApiKeys(["elevenlabs"]);
    apiKey = keys.elevenLabsApiKey;
  } catch {
    return Response.json(
      { error: "Server configuration error: ELEVENLABS_API_KEY is not set" },
      { status: 500 },
    );
  }

  // Parse body
  let body: { text?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "A text string is required" },
      { status: 400 },
    );
  }

  if (body.text === undefined || body.text === null) {
    return Response.json(
      { error: "A text string is required" },
      { status: 400 },
    );
  }

  if (typeof body.text !== "string" || body.text.trim() === "") {
    return Response.json(
      { error: "Text must not be empty" },
      { status: 400 },
    );
  }

  // Call ElevenLabs
  try {
    const { audio, contentType } = await synthesizeSpeech(apiKey, body.text);
    return new Response(new Uint8Array(audio), {
      status: 200,
      headers: { "Content-Type": contentType },
    });
  } catch {
    return Response.json(
      { error: "Upstream service failure: unable to synthesize speech" },
      { status: 502 },
    );
  }
}
