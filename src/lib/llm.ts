import Anthropic from "@anthropic-ai/sdk";

export const llmEnabled = () => Boolean(process.env.ANTHROPIC_API_KEY);

const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-5";

/** Extracts the first JSON object from a model response. */
function parseJson<T>(text: string): T | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1)) as T;
  } catch {
    return null;
  }
}

/**
 * Ask Claude for JSON matching the caller's description.
 * Returns null when no API key is configured or the call/parse fails,
 * so callers can fall back to the deterministic generator.
 */
export async function generateJson<T>(
  systemPrompt: string,
  userPrompt: string,
): Promise<T | null> {
  if (!llmEnabled()) return null;
  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 4096,
      system: `${systemPrompt}\n\nRespond with JSON only, no prose and no markdown fences.`,
      messages: [{ role: "user", content: userPrompt }],
    });
    const text = response.content
      .map((block) => (block.type === "text" ? block.text : ""))
      .join("");
    return parseJson<T>(text);
  } catch (error) {
    console.error("LLM generation failed, falling back:", error);
    return null;
  }
}
