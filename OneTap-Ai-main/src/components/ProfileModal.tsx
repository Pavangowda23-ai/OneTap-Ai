import { useEffect, useState } from "react";
import { useApp } from "@/lib/app-context";
import { t } from "@/lib/i18n";

export function ProfileModal() {
  const { lang, profileOpen, setProfileOpen, userName, setUserName, userPhone, setUserPhone, userEmail, setUserEmail } = useApp();
  const [name, setName] = useState(userName);
  const [phone, setPhone] = useState(userPhone);
  const [email, setEmail] = useState(userEmail);

  useEffect(() => {
    if (profileOpen) {
      setName(userName);
      setPhone(userPhone);
      setEmail(userEmail);
    }
  }, [profileOpen, userName, userPhone, userEmail]);

  const handleSave = () => {
    setUserName(name);
    setUserPhone(phone);
    setUserEmail(email);
    setProfileOpen(false);
  };

  if (!profileOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
      onClick={() => setProfileOpen(false)}
    >
      <div 
        className="bg-card w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl border border-border animate-in fade-in zoom-in duration-300 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-black text-card-foreground">👤 {t.profile[lang]}</h2>
          <button onClick={() => setProfileOpen(false)} className="text-3xl text-muted-foreground hover:text-foreground">×</button>
        </div>

        <div className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-black text-muted-foreground ml-1 uppercase tracking-wider">{t.name[lang]}</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. John Doe"
              className="w-full rounded-2xl bg-muted px-5 py-4 text-lg font-bold outline-none focus:ring-4 focus:ring-primary/20 border-2 border-transparent focus:border-primary transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-black text-muted-foreground ml-1 uppercase tracking-wider">{t.phone[lang]}</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 9876543210"
              className="w-full rounded-2xl bg-muted px-5 py-4 text-lg font-bold outline-none focus:ring-4 focus:ring-primary/20 border-2 border-transparent focus:border-primary transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-black text-muted-foreground ml-1 uppercase tracking-wider">{t.email[lang]}</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. john@example.com"
              className="w-full rounded-2xl bg-muted px-5 py-4 text-lg font-bold outline-none focus:ring-4 focus:ring-primary/20 border-2 border-transparent focus:border-primary transition-all"
            />
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3">
          <button
            onClick={handleSave}
            className="w-full rounded-2xl bg-primary text-primary-foreground py-5 font-black text-lg shadow-xl shadow-primary/30 active:scale-95 transition-transform"
          >
            {t.saveDetails[lang]}
          </button>
          <button
            onClick={() => setProfileOpen(false)}
            className="w-full rounded-2xl bg-secondary text-secondary-foreground py-4 font-bold text-base"
          >
            {t.close[lang]}
          </button>
        </div>
      </div>
    </div>
  );
}
