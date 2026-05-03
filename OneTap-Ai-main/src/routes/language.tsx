import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useApp } from "@/lib/app-context";
import { LANGUAGES, t } from "@/lib/i18n";

export const Route = createFileRoute("/language")({
  component: LanguagePicker,
});

function LanguagePicker() {
  const { lang, setLang } = useApp();
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background pb-32">
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <h1 className="text-xl font-extrabold text-primary">OneTap AI</h1>
          <p className="text-sm text-muted-foreground mt-1">{t.chooseLanguage[lang]}</p>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-5">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              onClick={() => setLang(l.code)}
              className={`rounded-2xl border-2 p-4 text-left transition ${
                lang === l.code
                  ? "border-primary bg-accent"
                  : "border-border bg-card"
              }`}
            >
              <div className="text-lg font-bold text-card-foreground">{l.native}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{l.en}</div>
            </button>
          ))}
        </div>

        <button
          onClick={() => navigate({ to: "/details" })}
          className="mt-6 w-full rounded-2xl bg-primary text-primary-foreground py-5 text-lg font-bold shadow-lg"
        >
          {t.continue[lang]} →
        </button>
      </main>
    </div>
  );
}
