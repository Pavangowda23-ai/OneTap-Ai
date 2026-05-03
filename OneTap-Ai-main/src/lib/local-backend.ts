// Optional bridge to a local Node/Express + Ollama + Coqui backend.
// If the user sets `onetap_backend_url` in localStorage (e.g. "http://localhost:5000"),
// the frontend will use the local server for /tts and /ai instead of Lovable AI.

import type { Lang } from "./i18n";
import { COQUI_LANG } from "./i18n";

export function getBackendUrl(): string | null {
  if (typeof window === "undefined") return null;
  const v = localStorage.getItem("onetap_backend_url");
  return v && v.trim() ? v.replace(/\/+$/, "") : null;
}

export async function localTTS(text: string, lang: Lang): Promise<string | null> {
  const url = getBackendUrl();
  if (!url) return null;
  try {
    const res = await fetch(`${url}/tts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, lang: COQUI_LANG[lang] || "hi" }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { audio?: string; mime?: string };
    if (!data.audio) return null;
    return `data:${data.mime || "audio/wav"};base64,${data.audio}`;
  } catch {
    return null;
  }
}

export async function localChat(
  messages: Array<{ role: string; content: string }>,
  lang: Lang,
): Promise<string | null> {
  const url = getBackendUrl();
  if (!url) return null;
  try {
    const res = await fetch(`${url}/ai`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages, lang }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { text?: string };
    return data.text || null;
  } catch {
    return null;
  }
}
