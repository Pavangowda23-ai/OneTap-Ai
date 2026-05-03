import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { useApp } from "@/lib/app-context";
import { t } from "@/lib/i18n";
import { recommendSchemes } from "@/lib/ai-functions";
import { SchemeCard, type Scheme } from "@/components/SchemeCard";
import { LangToggle } from "@/components/LangToggle";
import { ProfileSection } from "@/components/ProfileSection";

const search = z.object({
  userType: z.string(),
  need: z.string(),
});

export const Route = createFileRoute("/results")({
  validateSearch: (s) => search.parse(s),
  component: Results,
});

type Recs = { best: Scheme[]; other: Scheme[]; helpful: Scheme[] };

function Results() {
  const { userType, need } = Route.useSearch();
  const { lang, setLastResults } = useApp();
  const navigate = useNavigate();
  const [data, setData] = useState<Recs | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setData(null);
    setError(null);
    recommendSchemes({ data: { userType, need, lang } })
      .then((r) => {
        const recs = r as Recs;
        setData(recs);
        const all = [...(recs.best || []), ...(recs.other || []), ...(recs.helpful || [])];
        setLastResults(all.map((s) => ({ name: s.name, url: s.officialUrl })));
      })
      .catch((e) => setError(String(e?.message ?? e)));
  }, [userType, need, lang, setLastResults]);

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
          <Link to="/home" className="text-sm font-extrabold text-primary hidden xs:block">OneTap AI</Link>
          <LangToggle />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-8">
        {!data && !error && (
          <div className="text-center py-16">
            <div className="text-5xl mb-4 animate-pulse">✨</div>
            <p className="text-muted-foreground">{t.loading[lang]}</p>
          </div>
        )}

        {error && (
          <div className="rounded-2xl border-2 border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        {data && (
          <>
            <Section title={t.bestForYou[lang]} schemes={data.best} />
            <Section title={t.otherRelevant[lang]} schemes={data.other} />
            <Section title={t.helpful[lang]} schemes={data.helpful} />
          </>
        )}
      </main>
    </div>
  );
}

function Section({ title, schemes }: { title: string; schemes: Scheme[] }) {
  if (!schemes?.length) return null;
  return (
    <section>
      <h2 className="text-lg font-bold mb-3 text-foreground">{title}</h2>
      <div className="space-y-3">
        {schemes.map((s, i) => (
          <SchemeCard key={s.id || i} scheme={s} />
        ))}
      </div>
    </section>
  );
}
