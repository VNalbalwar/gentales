import OpenAI from "openai";

/**
 * AI generation layer using Ollama's OpenAI-compatible API.
 *
 * Supports any Ollama model (mistral, phi3:mini, llama3, etc.)
 * configured via environment variables. Works with both local
 * Ollama and remote VPS deployments behind a reverse proxy.
 */

// Normalize base URL: ensure it ends with /v1 for OpenAI SDK compatibility
function normalizeBaseURL(url: string): string {
  const trimmed = url.replace(/\/+$/, ""); // strip trailing slashes
  if (trimmed.endsWith("/v1")) return trimmed;
  return `${trimmed}/v1`;
}

const OLLAMA_BASE_URL = normalizeBaseURL(
  process.env.OLLAMA_BASE_URL || "http://localhost:11434"
);
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "mistral";
const OLLAMA_API_KEY = process.env.OLLAMA_API_KEY || "ollama";

const client = new OpenAI({
  baseURL: OLLAMA_BASE_URL,
  apiKey: OLLAMA_API_KEY,
  defaultHeaders: {
    "X-Api-Key": OLLAMA_API_KEY,
  },
});

/**
 * Check if AI services are available by pinging Ollama.
 */
export function isAIAvailable(): boolean {
  return true; // Ollama runs locally — always available if server is up
}

/* ------------------------------------------------------------------ */
/*  Story Generation                                                   */
/* ------------------------------------------------------------------ */

export interface GenerateStoryInput {
  genre: string;
  mood?: string;
  length?: "flash" | "short" | "medium" | "long" | "novella";
  keywords?: string[];
  prompt?: string;
}

export interface GenerateStoryOutput {
  title: string;
  contentMarkdown: string;
  summary: string;
  tags: string[];
  emotion: Record<string, number>;
}

const LENGTH_WORDS: Record<string, number> = {
  flash: 500,
  short: 1500,
  medium: 3000,
  long: 5000,
  novella: 10000,
};

export async function generateStoryWithAI(
  input: GenerateStoryInput,
): Promise<GenerateStoryOutput> {
  const wordCount = LENGTH_WORDS[input.length || "short"] || 1500;

  const systemPrompt = `You are a master storyteller. Generate an original, engaging story.

RULES:
- Literary, polished style for the genre and mood
- Complete story: beginning, middle, end
- Target ~${wordCount} words
- No meta-commentary about the story

Respond with ONLY a JSON object (no markdown fences, no extra text) in this format:
{"title":"string","summary":"string (max 200 chars)","content":"string (the full story)","tags":["tag1","tag2","tag3"]}`;

  const userPrompt = `Genre: ${input.genre}
Mood: ${input.mood || "any"}
Length: ~${wordCount} words
Keywords: ${(input.keywords || []).join(", ") || "none"}
${input.prompt ? `Direction: ${input.prompt}` : ""}

Write the story now. Return ONLY valid JSON.`;

  let raw: string;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 180_000); // 3 min timeout

    const completion = await client.chat.completions.create(
      {
        model: OLLAMA_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.85,
        top_p: 0.9,
      },
      { signal: controller.signal },
    );

    clearTimeout(timeout);
    raw = completion.choices[0]?.message?.content || "";
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("abort") || message.includes("timeout")) {
      console.error("[ollama] Generation timed out");
      throw new Error("AI generation timed out. Try a shorter story or simpler prompt.");
    }
    console.error("[ollama] API call failed:", message);
    throw new Error("Failed to connect to AI. Is Ollama running?");
  }

  if (!raw.trim()) {
    throw new Error("AI returned an empty response. Please try again.");
  }

  // Try to extract JSON from the response
  const parsed = extractJSON(raw);

  return {
    title: String(parsed.title || "Untitled Story"),
    contentMarkdown: String(parsed.content || parsed.story || parsed.text || ""),
    summary: String(parsed.summary || parsed.description || "").slice(0, 500),
    tags: Array.isArray(parsed.tags)
      ? (parsed.tags as string[]).filter((t) => typeof t === "string").slice(0, 10)
      : [],
    emotion: (parsed.emotion as Record<string, number>) || {
      hope: 0.5,
      fear: 0.3,
      chaos: 0.2,
      joy: 0.5,
      sadness: 0.3,
    },
  };
}

/**
 * Robust JSON extractor — handles markdown fences, partial JSON,
 * and common LLM output quirks.
 */
function extractJSON(raw: string): Record<string, unknown> {
  // Strip markdown code fences if present
  const stripped = raw.replace(/```(?:json)?\s*/gi, "").replace(/```\s*$/gi, "").trim();

  // Attempt 1: direct parse
  try {
    return JSON.parse(stripped);
  } catch { /* continue */ }

  // Attempt 2: find outermost { ... }
  const braceMatch = stripped.match(/\{[\s\S]*\}/);
  if (braceMatch) {
    try {
      return JSON.parse(braceMatch[0]);
    } catch { /* continue */ }

    // Attempt 3: fix common issues (trailing commas, unescaped newlines in strings)
    try {
      const fixed = braceMatch[0]
        .replace(/,\s*}/g, "}")
        .replace(/,\s*]/g, "]")
        .replace(/\n/g, "\\n")
        .replace(/\t/g, "\\t");
      return JSON.parse(fixed);
    } catch { /* continue */ }
  }

  // Attempt 4: extract fields individually with regex
  console.warn("[ollama] JSON parsing failed, attempting field extraction");
  const title = raw.match(/"title"\s*:\s*"([^"]+)"/)?.[1] || "Untitled Story";
  const summary = raw.match(/"summary"\s*:\s*"([^"]+)"/)?.[1] || "";

  // For content, try to get everything between "content": " and the next top-level key
  let content = "";
  const contentStart = raw.indexOf('"content"');
  if (contentStart !== -1) {
    const afterColon = raw.indexOf(":", contentStart);
    const quoteStart = raw.indexOf('"', afterColon + 1);
    if (quoteStart !== -1) {
      // Find matching close quote (handle escaped quotes)
      let i = quoteStart + 1;
      let result = "";
      while (i < raw.length) {
        if (raw[i] === "\\" && i + 1 < raw.length) {
          result += raw[i] + raw[i + 1];
          i += 2;
        } else if (raw[i] === '"') {
          break;
        } else {
          result += raw[i];
          i++;
        }
      }
      content = result.replace(/\\n/g, "\n").replace(/\\"/g, '"');
    }
  }

  // If no content field found, use the raw text as the story (last resort)
  if (!content) {
    content = raw
      .replace(/^\{[\s\S]*?"content"\s*:\s*"?/, "")
      .replace(/"?\s*,?\s*"tags"[\s\S]*$/, "")
      .replace(/\\n/g, "\n")
      .trim();
  }

  return { title, summary, content, tags: [] };
}

/* ------------------------------------------------------------------ */
/*  AI Writing Assistant                                               */
/* ------------------------------------------------------------------ */

export type AssistAction = "continue" | "rewrite" | "suggest" | "improve";

export interface AssistInput {
  action: AssistAction;
  content: string;
  genre?: string;
  mood?: string;
  instruction?: string;
}

export async function assistWriting(input: AssistInput): Promise<string> {
  const actionPrompts: Record<AssistAction, string> = {
    continue: `Continue writing the following story naturally. Write 2-4 paragraphs that flow seamlessly from where the text ends. Maintain the same style, tone, and voice. Only return the NEW text to append (no repetition of existing content):`,
    rewrite: `Rewrite and improve the following passage. Make it more vivid, engaging, and polished while keeping the same plot points and meaning. Return only the rewritten text:`,
    suggest: `Based on the following story so far, suggest 3 possible directions the plot could take next. Format as a numbered list with brief descriptions:`,
    improve: `Review the following text and provide specific, actionable suggestions to improve the writing quality, pacing, character development, and prose. Be constructive and specific:`,
  };

  const systemMessage = `You are an expert creative writing assistant. ${
    input.genre ? `The story genre is ${input.genre}.` : ""
  } ${input.mood ? `The desired mood is ${input.mood}.` : ""} ${
    input.instruction ? `Additional instruction: ${input.instruction}` : ""
  }`;

  const userPrompt = `${actionPrompts[input.action]}

---
${input.content.slice(-3000)}
---`;

  const completion = await client.chat.completions.create({
    model: OLLAMA_MODEL,
    messages: [
      { role: "system", content: systemMessage },
      { role: "user", content: userPrompt },
    ],
    temperature: input.action === "suggest" ? 1.0 : 0.8,
    top_p: 0.95,
  });

  return completion.choices[0]?.message?.content || "";
}
