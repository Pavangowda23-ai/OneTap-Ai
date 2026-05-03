import { createServerFn } from "@tanstack/react-start";

const MODEL = "llama3";
const URL = "http://localhost:11434/v1/chat/completions";

function safeJson<T>(content: string, fallback: T): T {
  if (!content) return fallback;
  // strip code fences
  let s = content.trim();
  s = s.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim();
  try {
    return JSON.parse(s) as T;
  } catch {
    // find first { ... last }
    const first = s.indexOf("{");
    const last = s.lastIndexOf("}");
    if (first !== -1 && last > first) {
      const slice = s.slice(first, last + 1);
      try {
        return JSON.parse(slice) as T;
      } catch {
        // remove trailing commas
        const cleaned = slice.replace(/,(\s*[}\]])/g, "$1");
        try {
          return JSON.parse(cleaned) as T;
        } catch {
          return fallback;
        }
      }
    }
    return fallback;
  }
}

async function callAI(messages: Array<{ role: string; content: string }>, json = false) {
  const res = await fetch(URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      messages,
      ...(json ? { response_format: { type: "json_object" } } : {}),
      stream: false,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`AI error ${res.status}: ${text}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

const LANG_NAME: Record<string, string> = { en: "English", hi: "Hindi", kn: "Kannada" };

export const recommendSchemes = createServerFn({ method: "POST" })
  .inputValidator((d: { userType: string; need: string; lang: string }) => d)
  .handler(async ({ data }) => {
    const langName = LANG_NAME[data.lang] || "English";
    const sys = `You are an Indian government scheme advisor for low-literacy users. Always respond in ${langName}. Use very simple short words. Return ONLY valid JSON.`;
    const user = `User type: ${data.userType}
Need: ${data.need}

Recommend Indian government schemes in 3 tiers. Return JSON:
{
  "best": [ { "id": "kebab-id", "name": "Scheme Name", "benefits": ["short benefit", "short benefit"], "officialUrl": "https://..." } ],
  "other": [ ... ],
  "helpful": [ ... ]
}

Rules:
- "best": 2-4 schemes most relevant
- "other": 3-5 related schemes
- "helpful": 2-3 general useful schemes
- Each scheme: 2-3 benefits, each benefit max 8 words, very simple ${langName}
- Real Indian schemes only (PM-KISAN, PMAY, Ayushman Bharat, etc.)
- officialUrl must be real .gov.in or .nic.in URL
- Names in ${langName} script when possible, but keep abbreviations like PM-KISAN`;

    const content = await callAI(
      [{ role: "system", content: sys }, { role: "user", content: user }],
      true,
    );
    return safeJson(content, { best: [], other: [], helpful: [] });
  });

export const explainScheme = createServerFn({ method: "POST" })
  .inputValidator((d: { schemeName: string; lang: string }) => d)
  .handler(async ({ data }) => {
    const langName = LANG_NAME[data.lang] || "English";
    const sys = `Explain in ${langName}. Use very simple short sentences a low-literacy person can understand. Maximum 4 sentences. No markdown.`;
    const content = await callAI([
      { role: "system", content: sys },
      { role: "user", content: `Explain the Indian government scheme "${data.schemeName}" simply. What is it, who can get it, and main benefit.` },
    ]);
    return { text: content };
  });

export const getSchemeSteps = createServerFn({ method: "POST" })
  .inputValidator((d: { schemeName: string; lang: string }) => d)
  .handler(async ({ data }) => {
    const langName = LANG_NAME[data.lang] || "English";
    const sys = `You explain Indian government schemes in very simple ${langName}. Return ONLY valid JSON.`;
    const user = `Scheme: ${data.schemeName}

Return JSON:
{
  "officialUrl": "https://...gov.in",
  "eligibility": ["short bullet", "short bullet"],
  "documents": ["doc", "doc"],
  "howToApply": ["Step 1: ...", "Step 2: ..."],
  "nextActions": ["action", "action"]
}

Each item max 12 words, very simple ${langName}. 3-5 items per list.`;
    const content = await callAI(
      [{ role: "system", content: sys }, { role: "user", content: user }],
      true,
    );
    return safeJson(content, {
      officialUrl: "",
      eligibility: [],
      documents: [],
      howToApply: [],
      nextActions: [],
    });
  });

export const chatAi = createServerFn({ method: "POST" })
  .inputValidator((d: { messages: Array<{ role: string; content: string }>; lang: string }) => d)
  .handler(async ({ data }) => {
    const langName = LANG_NAME[data.lang] || "English";
    const sys = `You are OneTap AI, a friendly guide for Indian government schemes. Reply in ${langName}. Use very short simple sentences. When relevant, suggest specific scheme names. Maximum 4 sentences per response. No markdown.`;
    const content = await callAI([
      { role: "system", content: sys },
      ...data.messages,
    ]);
    return { text: content };
  });
