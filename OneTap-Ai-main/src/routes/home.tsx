import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useApp } from "@/lib/app-context";
import { LangToggle } from "@/components/LangToggle";
import { ProfileSection } from "@/components/ProfileSection";
import { USER_TYPES, NEEDS, POPULAR, t } from "@/lib/i18n";
import { useTTSPlayer } from "@/hooks/useTTSPlayer";

export const Route = createFileRoute("/home")({
  component: Home,
});

function Home() {
  const { lang, userType, setUserType, need, setNeed } = useApp();
  const navigate = useNavigate();
  const canFind = userType && need;

  const whoText = `${t.whoAreYou[lang]}. ${USER_TYPES.map(u => u.label[lang]).join(", ")}`;
  const needText = `${t.whatNeed[lang]}. ${NEEDS.map(n => n.label[lang]).join(", ")}`;
  
  const whoTTS = useTTSPlayer(whoText);
  const needTTS = useTTSPlayer(needText);

  return (
    <div className="min-h-screen bg-background pb-32">
      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <ProfileSection />
            <div className="hidden xs:block min-w-0">
              <h1 className="text-sm font-extrabold text-primary leading-none">OneTap AI</h1>
            </div>
          </div>
          <LangToggle />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-8">
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-foreground">{t.whoAreYou[lang]}</h2>
            <button 
              onClick={() => whoTTS.play(whoText, lang)}
              className="rounded-full bg-secondary text-secondary-foreground px-3 py-1.5 text-xs font-bold flex items-center gap-1"
            >
              {whoTTS.isPlaying ? "⏸" : "🔊"} {t.listen[lang]}
            </button>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
            {USER_TYPES.map((u) => (
              <button
                key={u.id}
                onClick={() => setUserType(u.id)}
                className={`rounded-2xl border-2 p-3 flex flex-col items-center gap-1 transition ${
                  userType === u.id ? "border-primary bg-accent shadow-md" : "border-border bg-card"
                }`}
              >
                <span className="text-3xl">{u.icon}</span>
                <span className="text-xs font-semibold text-card-foreground">{u.label[lang]}</span>
              </button>
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-foreground">{t.whatNeed[lang]}</h2>
            <button 
              onClick={() => needTTS.play(needText, lang)}
              className="rounded-full bg-secondary text-secondary-foreground px-3 py-1.5 text-xs font-bold flex items-center gap-1"
            >
              {needTTS.isPlaying ? "⏸" : "🔊"} {t.listen[lang]}
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {NEEDS.map((n) => (
              <button
                key={n.id}
                onClick={() => setNeed(n.id)}
                className={`rounded-2xl border-2 p-4 flex flex-col items-center gap-2 transition ${
                  need === n.id ? "border-primary bg-accent shadow-md" : "border-border bg-card"
                }`}
              >
                <span className="text-4xl">{n.icon}</span>
                <span className="text-sm font-semibold text-card-foreground">{n.label[lang]}</span>
              </button>
            ))}
          </div>
        </section>

        <button
          disabled={!canFind}
          onClick={() => navigate({ to: "/results", search: { userType: userType!, need: need! } })}
          className="w-full rounded-2xl bg-primary text-primary-foreground py-5 text-lg font-bold shadow-lg disabled:opacity-40 disabled:shadow-none active:scale-[0.98] transition-transform"
        >
          {t.findSchemes[lang]} →
        </button>

        <section>
          <h3 className="text-sm font-bold mb-2 text-muted-foreground">{t.popularHelp[lang]}</h3>
          <div className="flex flex-wrap gap-2">
            {POPULAR.map((p, i) => (
              <span key={i} className="rounded-full bg-secondary text-secondary-foreground px-4 py-2 text-sm font-medium">
                {p[lang]}
              </span>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
