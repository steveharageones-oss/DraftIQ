/**
 * Optional LLM hook (OpenAI-compatible chat completions).
 *
 * Only used when the app has a key configured (AI_API_KEY). Without a key the
 * app runs entirely on the built-in heuristic engine, so nothing breaks and no
 * secrets are required to share the MVP.
 */

export interface LlmConfig {
  apiKey?: string;
  model?: string;
  baseUrl?: string;
}

export function isLlmEnabled(config: LlmConfig): boolean {
  return Boolean(config.apiKey);
}

/**
 * Ask the model to answer with a single JSON object. Returns parsed JSON, or
 * throws on transport/parse errors so callers can fall back to heuristics.
 */
export async function chatJson<T = unknown>(
  config: LlmConfig,
  system: string,
  user: string,
): Promise<T> {
  const apiKey = config.apiKey;
  if (!apiKey) throw new Error("No API key configured for LLM.");

  const baseUrl = (config.baseUrl ?? "https://api.openai.com/v1").replace(/\/$/, "");
  const model = config.model ?? "gpt-4o-mini";

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });

  if (!res.ok) {
    throw new Error(`LLM request failed: ${res.status}`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("LLM returned no content.");
  return JSON.parse(content) as T;
}
