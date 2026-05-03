import { useApp } from "@/lib/app-context";
import { LANGUAGES } from "@/lib/i18n";

export function LangToggle() {
  const { lang, setLang } = useApp();
  const current = LANGUAGES.find((l) => l.code === lang) ?? LANGUAGES[0];
  return (
    <select
      value={lang}
      onChange={(e) => setLang(e.target.value as typeof lang)}
      className="rounded-full bg-secondary text-secondary-foreground text-sm font-semibold px-3 py-1.5 outline-none border border-border max-w-[140px]"
      aria-label="Language"
      title={current.en}
    >
      {LANGUAGES.map((l) => (
        <option key={l.code} value={l.code}>
          {l.native} ({l.en})
        </option>
      ))}
    </select>
  );
}
