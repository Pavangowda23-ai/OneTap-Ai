import { Link } from "@tanstack/react-router";
import { useApp } from "@/lib/app-context";
import { t } from "@/lib/i18n";
import { useTTSPlayer } from "@/hooks/useTTSPlayer";
import { explainScheme } from "@/lib/ai-functions";
import { useRef, useState } from "react";

export type Scheme = {
  id: string;
  name: string;
  benefits: string[];
  officialUrl?: string;
};

export function SchemeCard({ scheme }: { scheme: Scheme }) {
  const { lang } = useApp();
  const [loading, setLoading] = useState(false);
  const cachedRef = useRef<string | null>(null);
  const [activeText, setActiveText] = useState<string>("");
  const { isPlaying, isPaused, isLoading, play } = useTTSPlayer(activeText);

  const handleListen = async () => {
    if (activeText && (isPlaying || isPaused)) {
      play(activeText, lang);
      return;
    }
    if (cachedRef.current) {
      setActiveText(cachedRef.current);
      play(cachedRef.current, lang);
      return;
    }
    setLoading(true);
    try {
      const { text } = await explainScheme({ data: { schemeName: scheme.name, lang } });
      const full = `${scheme.name}. ${text}`;
      cachedRef.current = full;
      setActiveText(full);
      play(full, lang);
    } catch {
      const fallback = `${scheme.name}. ${scheme.benefits.join(". ")}`;
      cachedRef.current = fallback;
      setActiveText(fallback);
      play(fallback, lang);
    } finally {
      setLoading(false);
    }
  };

  const busy = loading || isLoading;

  const listenLabel = busy
    ? "..."
    : isPlaying
      ? "⏸ " + t.listen[lang].replace("🔊 ", "")
      : isPaused
        ? "▶ " + t.listen[lang].replace("🔊 ", "")
        : t.listen[lang];

  return (
    <div
      id={`scheme-${slug(scheme.name)}`}
      className="rounded-2xl bg-card border-2 border-border p-5 shadow-sm scroll-mt-20"
    >
      <h3 className="text-lg font-bold text-card-foreground mb-3">{scheme.name}</h3>
      <ul className="space-y-1 mb-4">
        {scheme.benefits?.slice(0, 3).map((b, i) => (
          <li key={i} className="flex gap-2 text-sm text-muted-foreground">
            <span className="text-primary">✓</span>
            <span>{b}</span>
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-2">
        {scheme.officialUrl && (
          <a
            href={scheme.officialUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 min-w-[120px] text-center rounded-xl bg-primary text-primary-foreground px-4 py-2.5 font-semibold text-sm"
          >
            {t.applyNow[lang]}
          </a>
        )}
        <button
          onClick={handleListen}
          disabled={busy}
          className="rounded-xl bg-accent text-accent-foreground px-4 py-2.5 font-semibold text-sm disabled:opacity-60"
        >
          {listenLabel}
        </button>
        <Link
          to="/scheme"
          search={{ name: scheme.name, url: scheme.officialUrl ?? "" }}
          className="rounded-xl border-2 border-primary text-primary px-4 py-2.5 font-semibold text-sm"
        >
          {t.viewSteps[lang]}
        </Link>
      </div>
    </div>
  );
}

export function slug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
