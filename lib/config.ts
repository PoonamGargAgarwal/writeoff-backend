export interface ApiKeys {
  anthropicApiKey: string;
  elevenLabsApiKey: string;
}

/**
 * Reads API keys from environment variables.
 * Only validates the keys specified in the `required` array.
 * Throws with a descriptive message if a required key is missing.
 */
export function getApiKeys(
  required: ("anthropic" | "elevenlabs")[],
): ApiKeys {
  const anthropicApiKey = process.env.ANTHROPIC_API_KEY ?? "";
  const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY ?? "";

  if (required.includes("anthropic") && !anthropicApiKey) {
    throw new Error(
      "Server configuration error: ANTHROPIC_API_KEY is not set",
    );
  }

  if (required.includes("elevenlabs") && !elevenLabsApiKey) {
    throw new Error(
      "Server configuration error: ELEVENLABS_API_KEY is not set",
    );
  }

  return { anthropicApiKey, elevenLabsApiKey };
}
