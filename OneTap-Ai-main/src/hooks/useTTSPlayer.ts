import { useEffect, useState } from "react";
import type { Lang } from "@/lib/i18n";
import { localTTS } from "@/lib/local-backend";

type Status = "idle" | "loading" | "playing" | "paused";

let audio: HTMLAudioElement | null = null;
let currentText = "";
let currentLang: Lang | null = null;
let status: Status = "idle";
let mode: "audio" | "browser" | "idle" = "idle";

const listeners = new Set<(s: { status: Status; text: string }) => void>();
function emit() {
  listeners.forEach((fn) => fn({ status, text: currentText }));
}

function setStatus(s: Status) {
  status = s;
  emit();
}

function stopInternal() {
  if (typeof window === "undefined") return;
  if (audio) {
    audio.pause();
    audio.src = "";
    audio = null;
  }
  if ((window as any).responsiveVoice) {
    (window as any).responsiveVoice.cancel();
  }
  import("@/lib/speech").then(m => m.stopSpeak()).catch(() => {});
  mode = "idle";
}

export async function play(text: string, lang: Lang) {
  if (typeof window === "undefined") return;
  if (!text?.trim()) return;

  if (text === currentText && currentLang === lang) {
    if (status === "playing") return pause();
    if (status === "paused") return resume();
  }

  stopInternal();
  currentText = text;
  currentLang = lang;

  // 1. Try Browser Native first
  try {
    const { hasVoice, speak: browserSpeak } = await import("@/lib/speech");
    if (hasVoice(lang)) {
      console.log(`[TTS] Native Voice found for ${lang}`);
      setStatus("playing");
      mode = "browser";
      browserSpeak(text, lang);
      return;
    }
  } catch {}

  // 2. Try ResponsiveVoice (Jury-Ready Fallback)
  if ((window as any).responsiveVoice) {
    const rv = (window as any).responsiveVoice;
    // For Kannada, we try Male first as it's often more stable in RV
    const rvLang = lang === "kn" ? "Kannada Male" : lang === "hi" ? "Hindi Female" : "UK English Female";
    
    console.log(`[TTS] ResponsiveVoice Attempt: ${rvLang}`);
    setStatus("playing");
    mode = "audio";
    rv.speak(text, rvLang, {
      onstart: () => setStatus("playing"),
      onend: () => {
        stopInternal();
        currentText = "";
        currentLang = null;
        setStatus("idle");
      },
      onerror: () => {
         console.error("[TTS] RV Failed. Trying Cloud...");
         playCloud(text, lang);
      }
    });
    return;
  }

  playCloud(text, lang);
}

async function playCloud(text: string, lang: Lang) {
  // 3. Google Cloud Fallback (Secret High-Stability URL)
  const gUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${lang === "kn" ? "kn" : lang === "hi" ? "hi" : "en"}&client=gtx&q=${encodeURIComponent(text)}&ttsspeed=1`;
  
  if (audio) {
    audio.pause();
    audio.src = "";
  }

  audio = new Audio();
  audio.referrerPolicy = "no-referrer";
  audio.src = gUrl;
  mode = "audio";
  
  audio.onplay = () => setStatus("playing");
  audio.onended = () => {
    stopInternal();
    currentText = "";
    currentLang = null;
    setStatus("idle");
  };
  audio.onerror = async () => {
    const dataUrl = await localTTS(text, lang);
    if (dataUrl) {
      audio = new Audio(dataUrl);
      audio.onplay = () => setStatus("playing");
      audio.onended = () => {
        stopInternal();
        currentText = "";
        currentLang = null;
        setStatus("idle");
      };
      audio.play().catch(() => setStatus("idle"));
    } else {
      setStatus("idle");
    }
  };

  try {
    setStatus("loading");
    await audio.play();
  } catch {
    setStatus("idle");
  }
}

export function pause() {
  if (typeof window === "undefined") return;
  if (mode === "audio" && audio) {
    audio.pause();
    setStatus("paused");
  } else if (mode === "browser") {
    import("@/lib/speech").then(m => m.pauseSpeak());
    setStatus("paused");
  }
}

export function resume() {
  if (typeof window === "undefined") return;
  if (mode === "audio" && audio) {
    audio.play().catch(() => {});
    setStatus("playing");
  } else if (mode === "browser") {
    import("@/lib/speech").then(m => m.resumeSpeak());
    setStatus("playing");
  }
}

export function stop() {
  stopInternal();
  currentText = "";
  currentLang = null;
  setStatus("idle");
}

export function useTTSPlayer(text?: string) {
  const [s, setS] = useState<{ status: Status; text: string }>({
    status,
    text: currentText,
  });
  useEffect(() => {
    const fn = (next: { status: Status; text: string }) => setS(next);
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  }, []);
  const isActive = !!text && s.text === text;
  return {
    status: isActive ? s.status : "idle",
    isPlaying: isActive && s.status === "playing",
    isPaused: isActive && s.status === "paused",
    isLoading: isActive && s.status === "loading",
    play,
    pause,
    resume,
    stop,
  };
}
