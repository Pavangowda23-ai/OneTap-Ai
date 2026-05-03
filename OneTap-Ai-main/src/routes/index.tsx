import { createFileRoute, Link } from "@tanstack/react-router";
import { useApp } from "@/lib/app-context";
import { t } from "@/lib/i18n";

export const Route = createFileRoute("/")({
  component: Splash,
});

function Splash() {
  const { lang } = useApp();
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-accent flex flex-col items-center justify-center px-6 text-center">
      <div className="w-28 h-28 rounded-3xl bg-primary text-primary-foreground flex items-center justify-center text-5xl shadow-2xl mb-6">
        🌿
      </div>
      <h1 className="text-4xl font-extrabold text-primary">OneTap AI</h1>
      <p className="mt-3 text-base text-muted-foreground max-w-sm">
        {t.tagline[lang]}
      </p>
      <Link
        to="/language"
        className="mt-10 w-full max-w-sm rounded-2xl bg-primary text-primary-foreground py-5 text-lg font-bold shadow-lg"
      >
        {t.getStarted[lang]} →
      </Link>
    </div>
  );
}
