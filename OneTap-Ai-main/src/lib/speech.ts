import { useEffect, useState } from "react";
import type { Lang } from "./i18n";
import { SPEECH_LANG } from "./i18n";

// ---------- Voice loading ----------
let voicesCache: SpeechSynthesisVoice[] = [];
let voicesReady = false;
const voiceListeners = new Set<() => void>();

function loadVoices() {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const v = window.speechSynthesis.getVoices();
  if (v && v.length) {
    voicesCache = v;
    voicesReady = true;
    voiceListeners.forEach((fn) => fn());
  }
}

if (typeof window !== "undefined" && "speechSynthesis" in window) {
  loadVoices();
  window.speechSynthesis.onvoiceschanged = () => loadVoices();
  setTimeout(loadVoices, 250);
  setTimeout(loadVoices, 1000);
}

function targetsFor(lang: Lang): string[] {
  const primary = SPEECH_LANG[lang] || "en-IN";
  const base = primary.split("-")[0];
  // Strictly only return the requested language and its base code
  return Array.from(new Set([primary, base]));
}

function pickVoice(lang: Lang): SpeechSynthesisVoice | null {
  if (typeof window === "undefined") return null;
  if (!voicesCache.length) return null;
  const targets = targetsFor(lang);
  
  // 1. Priority: Microsoft Online/Natural voices (Edge/Windows) - These are the BEST
  if (lang === "hi") {
    const msHi = voicesCache.find(v => (v.name.includes("Microsoft") || v.name.includes("Google")) && v.name.includes("Hindi"));
    if (msHi) return msHi;
  }
  if (lang === "kn") {
    const msKn = voicesCache.find(v => (v.name.includes("Microsoft") || v.name.includes("Google")) && (v.name.includes("Kannada") || v.lang.startsWith("kn")));
    if (msKn) return msKn;
  }

  // 2. Try exact matches on lang code (e.g. hi-IN)
  for (const target of targets) {
    const exact = voicesCache.find((v) => v.lang.toLowerCase().replace("_", "-") === target.toLowerCase());
    if (exact) return exact;
  }

  // 3. Special case for Hindi: Search for 'Hindi' in name
  if (lang === "hi") {
    const hindiVoice = voicesCache.find(v => 
      v.lang.startsWith("hi") || 
      v.name.toLowerCase().includes("hindi")
    );
    if (hindiVoice) return hindiVoice;
  }

  // 4. Special case for Kannada: Search for 'Kannada' in name
  if (lang === "kn") {
    const knVoice = voicesCache.find(v => 
      v.lang.startsWith("kn") || 
      v.name.toLowerCase().includes("kannada")
    );
    if (knVoice) return knVoice;
  }

  // 5. Try partial matches on lang code
  for (const target of targets) {
    const partial = voicesCache.find((v) => v.lang.toLowerCase().includes(target.toLowerCase()));
    if (partial) return partial;
  }

  console.warn(`No suitable voice found for language: ${lang}. To fix this, please install system-level speech packs for this language in your OS settings (Settings > Time & Language > Speech).`);
  return null;
}

// ---------- Player state ----------
type Status = "idle" | "playing" | "paused";
let status: Status = "idle";
let currentText = "";
let currentLang: Lang | null = null;
const stateListeners = new Set<(s: { status: Status; text: string }) => void>();

function emit() {
  stateListeners.forEach((fn) => fn({ status, text: currentText }));
}

function startUtterance(text: string, lang: Lang) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const synth = window.speechSynthesis;
  synth.cancel();

  const u = new SpeechSynthesisUtterance(text);
  const voice = pickVoice(lang);
  
  if (voice) {
    u.voice = voice;
    u.lang = voice.lang;
    console.log(`[TTS] Picking voice: ${voice.name} (${voice.lang})`);
  } else {
    u.lang = SPEECH_LANG[lang] || "en-IN";
    console.warn(`[TTS] No specific voice found for ${lang}, falling back to ${u.lang}`);
  }

  u.rate = 1.0;
  u.pitch = 1.0;
  u.volume = 1.0;

  u.onstart = () => {
    status = "playing";
    emit();
  };
  u.onend = () => {
    status = "idle";
    currentText = "";
    currentLang = null;
    emit();
  };
  u.onerror = (event) => {
    console.error("[TTS] Utterance error:", event);
    status = "idle";
    currentText = "";
    currentLang = null;
    emit();
  };

  currentText = text;
  currentLang = lang;
  
  setTimeout(() => {
    if (typeof window !== "undefined") {
      window.speechSynthesis.speak(u);
      if (window.speechSynthesis.paused) window.speechSynthesis.resume();
    }
  }, 100);
}

export function speak(text: string, lang: Lang) {
  if (typeof window === "undefined") return;
  if (!text || !text.trim()) return;
  
  const synth = window.speechSynthesis;
  if (currentText === text && currentLang === lang) {
    if (status === "playing") {
      synth.pause();
      status = "paused";
      emit();
      return;
    }
    if (status === "paused") {
      synth.resume();
      status = "playing";
      emit();
      return;
    }
  }

  if (!voicesReady) {
    loadVoices();
    if (!voicesReady) {
      const onReady = () => {
        voiceListeners.delete(onReady);
        startUtterance(text, lang);
      };
      voiceListeners.add(onReady);
      setTimeout(() => {
        if (voiceListeners.has(onReady)) {
          voiceListeners.delete(onReady);
          startUtterance(text, lang);
        }
      }, 1200);
      return;
    }
  }

  startUtterance(text, lang);
}

export function pauseSpeak() {
  if (typeof window === "undefined") return;
  if (status === "playing") {
    window.speechSynthesis.pause();
    status = "paused";
    emit();
  }
}

export function resumeSpeak() {
  if (typeof window === "undefined") return;
  if (status === "paused") {
    window.speechSynthesis.resume();
    status = "playing";
    emit();
  }
}

export function stopSpeak() {
  if (typeof window === "undefined") return;
  window.speechSynthesis.cancel();
  status = "idle";
  currentText = "";
  currentLang = null;
  emit();
}

export function hasVoice(lang: Lang): boolean {
  if (typeof window === "undefined") return false;
  if (!voicesReady) loadVoices();
  const v = pickVoice(lang);
  return !!v;
}

export function useSpeechState(text?: string) {
  const [s, setS] = useState<{ status: Status; text: string }>({
    status,
    text: currentText,
  });
  useEffect(() => {
    const fn = (next: { status: Status; text: string }) => setS(next);
    stateListeners.add(fn);
    return () => {
      stateListeners.delete(fn);
    };
  }, []);
  const isActive = !!text && s.text === text;
  return {
    status: isActive ? s.status : "idle",
    isPlaying: isActive && s.status === "playing",
    isPaused: isActive && s.status === "paused",
  };
}
