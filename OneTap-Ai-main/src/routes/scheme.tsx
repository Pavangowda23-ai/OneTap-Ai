import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { useApp } from "@/lib/app-context";
import { t } from "@/lib/i18n";
import { getSchemeSteps } from "@/lib/ai-functions";
import { useTTSPlayer } from "@/hooks/useTTSPlayer";
import { LangToggle } from "@/components/LangToggle";
import { ProfileSection } from "@/components/ProfileSection";

const search = z.object({
  name: z.string(),
  url: z.string().optional().default(""),
});

export const Route = createFileRoute("/scheme")({
  validateSearch: (s) => search.parse(s),
  component: SchemeDetail,
});

type Steps = {
  officialUrl: string;
  eligibility: string[];
  documents: string[];
  howToApply: string[];
  nextActions: string[];
};

function SchemeDetail() {
  const { name, url } = Route.useSearch();
  const { lang } = useApp();
  const navigate = useNavigate();
  const [data, setData] = useState<Steps | null>(null);

  useEffect(() => {
    setData(null);
    getSchemeSteps({ data: { schemeName: name, lang } })
      .then((d) => setData(d as Steps))
      .catch(() => setData({ officialUrl: url, eligibility: [], documents: [], howToApply: [], nextActions: [] }));
  }, [name, lang, url]);

  const link = data?.officialUrl || url;

  return (
    <div className="min-h-screen bg-background pb-32">
      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <button onClick={() => navigate({ to: "/home" })} className="text-sm font-semibold text-primary whitespace-nowrap">
              {t.back[lang]}
            </button>
            <ProfileSection />
          </div>
          <Link to="/home" className="text-sm font-extrabold text-primary truncate hidden xs:block">OneTap AI</Link>
          <LangToggle />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        <h1 className="text-2xl font-extrabold text-foreground">{name}</h1>

        {link && (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-center rounded-2xl bg-primary text-primary-foreground py-4 font-bold shadow-lg"
          >
            {t.officialLink[lang]} — {t.applyNow[lang]}
          </a>
        )}

        {!data && (
          <div className="text-center py-12 text-muted-foreground">
            <div className="text-4xl mb-2 animate-pulse">✨</div>
            {t.loading[lang]}
          </div>
        )}

        {data && (
          <>
            <StepBlock icon="✅" title={t.eligibility[lang]} items={data.eligibility} lang={lang} />
            <StepBlock icon="📄" title={t.documents[lang]} items={data.documents} lang={lang} />
            <StepBlock icon="📝" title={t.howToApply[lang]} items={data.howToApply} lang={lang} numbered />
            <StepBlock icon="➡️" title={t.nextActions[lang]} items={data.nextActions} lang={lang} />
          </>
        )}
      </main>
    </div>
  );
}

function StepBlock({
  icon,
  title,
  items,
  lang,
  numbered,
}: {
  icon: string;
  title: string;
  items: string[];
  lang: import("@/lib/i18n").Lang;
  numbered?: boolean;
}) {
  if (!items?.length) return null;
  const fullText = `${title}. ${items.join(". ")}`;
  const { isPlaying, isPaused, play } = useTTSPlayer(fullText);
  const label = isPlaying
    ? "⏸ " + t.listen[lang].replace("🔊 ", "")
    : isPaused
      ? "▶ " + t.listen[lang].replace("🔊 ", "")
      : t.listen[lang];
  return (
    <section className="rounded-2xl bg-card border-2 border-border p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-bold flex items-center gap-2 text-card-foreground">
          <span className="text-xl">{icon}</span>
          {title}
        </h2>
        <button
          onClick={() => play(fullText, lang)}
          className="rounded-full bg-accent text-accent-foreground px-3 py-1.5 text-xs font-semibold"
        >
          {label}
        </button>
      </div>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex gap-3 text-sm text-card-foreground">
            <span className="font-bold text-primary min-w-[1.5rem]">
              {numbered ? `${i + 1}.` : "•"}
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
