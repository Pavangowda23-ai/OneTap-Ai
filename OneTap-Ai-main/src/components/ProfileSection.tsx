import { useApp } from "@/lib/app-context";
import { t } from "@/lib/i18n";

export function ProfileSection() {
  const { lang, userName, setProfileOpen } = useApp();

  return (
    <button
      onClick={() => setProfileOpen(true)}
      className="flex items-center gap-2 rounded-full bg-secondary text-secondary-foreground px-3 py-1.5 text-sm font-bold border border-border hover:bg-accent transition-colors shrink-0"
    >
      👤 <span className="truncate max-w-[80px]">{userName || t.profile[lang]}</span>
    </button>
  );
}
