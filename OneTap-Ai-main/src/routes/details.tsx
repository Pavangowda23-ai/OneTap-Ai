import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useApp } from "@/lib/app-context";
import { t } from "@/lib/i18n";

export const Route = createFileRoute("/details")({
  component: Details,
});

function Details() {
  const { lang, userName, setUserName, userPhone, setUserPhone, userEmail, setUserEmail } = useApp();
  const navigate = useNavigate();
  const [name, setName] = useState(userName);
  const [phone, setPhone] = useState(userPhone);
  const [email, setEmail] = useState(userEmail);

  useEffect(() => {
    setName(userName);
    setPhone(userPhone);
    setEmail(userEmail);
  }, [userName, userPhone, userEmail]);

  const valid = name.trim().length > 0 && phone.trim().length >= 6;

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    setUserName(name.trim());
    setUserPhone(phone.trim());
    setUserEmail(email.trim());
    navigate({ to: "/home" });
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <h1 className="text-xl font-extrabold text-primary">OneTap AI</h1>
          <p className="text-sm text-muted-foreground mt-1">{t.yourDetails[lang]}</p>
        </div>
      </header>

      <form onSubmit={onSubmit} className="max-w-md mx-auto px-4 py-6 space-y-4">
        <Field label={t.name[lang]}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full rounded-2xl border-2 border-border bg-card px-4 py-3 text-base outline-none focus:border-primary"
          />
        </Field>
        <Field label={t.phone[lang]}>
          <input
            type="tel"
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            className="w-full rounded-2xl border-2 border-border bg-card px-4 py-3 text-base outline-none focus:border-primary"
          />
        </Field>
        <Field label={t.email[lang]}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-2xl border-2 border-border bg-card px-4 py-3 text-base outline-none focus:border-primary"
          />
        </Field>

        <button
          type="submit"
          disabled={!valid}
          className="w-full rounded-2xl bg-primary text-primary-foreground py-5 text-lg font-bold shadow-lg disabled:opacity-40 disabled:shadow-none"
        >
          {t.continue[lang]} →
        </button>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-semibold text-foreground mb-1.5">{label}</span>
      {children}
    </label>
  );
}
