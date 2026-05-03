import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import type { Lang } from "./i18n";
import { stopSpeak } from "./speech";

export type ResultScheme = { name: string; url?: string };

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  userType: string | null;
  setUserType: (s: string | null) => void;
  need: string | null;
  setNeed: (s: string | null) => void;
  userName: string;
  setUserName: (n: string) => void;
  userPhone: string;
  setUserPhone: (p: string) => void;
  userEmail: string;
  setUserEmail: (e: string) => void;
  profileOpen: boolean;
  setProfileOpen: (o: boolean) => void;
  chatSessions: ChatSession[];
  setChatSessions: (s: ChatSession[]) => void;
  currentSessionId: string | null;
  setCurrentSessionId: (id: string | null) => void;
};

export type ChatSession = {
  id: string;
  title: string;
  messages: { role: "user" | "assistant"; content: string }[];
  status: "active" | "archived";
  createdAt: number;
};

const AppCtx = createContext<Ctx | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");
  const [userType, setUserType] = useState<string | null>(null);
  const [need, setNeed] = useState<string | null>(null);
  const [lastResults, setLastResults] = useState<ResultScheme[]>([]);
  const [userName, setUserNameState] = useState("");
  const [userPhone, setUserPhoneState] = useState("");
  const [userEmail, setUserEmailState] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const [chatSessions, setChatSessionsState] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const sLang = localStorage.getItem("lang") as Lang | null;
      if (sLang) setLangState(sLang);
      
      try {
        const saved = JSON.parse(localStorage.getItem("onetap_user") || "{}");
        if (saved.name) setUserNameState(saved.name);
        if (saved.phone) setUserPhoneState(saved.phone);
        if (saved.email) setUserEmailState(saved.email);
      } catch { /* ignore */ }

      try {
        const savedSessions = JSON.parse(localStorage.getItem("chat_sessions") || "[]");
        setChatSessionsState(savedSessions);
        // If there's an old single-chat history, migrate it? 
        // No, let's just start fresh or migrate if possible.
        const oldHistory = localStorage.getItem("chat_history");
        if (oldHistory && savedSessions.length === 0) {
           const msgs = JSON.parse(oldHistory);
           if (msgs.length > 0) {
             const session: ChatSession = {
               id: "session_" + Date.now(),
               title: msgs[0].content.slice(0, 20) + "...",
               messages: msgs,
               status: "active",
               createdAt: Date.now()
             };
             setChatSessionsState([session]);
             localStorage.setItem("chat_sessions", JSON.stringify([session]));
             localStorage.removeItem("chat_history");
           }
        }
      } catch { /* ignore */ }
    }
  }, []);

  const setChatSessions = (s: ChatSession[]) => {
    setChatSessionsState(s);
    if (typeof window !== "undefined") localStorage.setItem("chat_sessions", JSON.stringify(s));
  };

  const saveToStorage = (updates: Partial<{ name: string; phone: string; email: string }>) => {
    if (typeof window === "undefined") return;
    try {
      const current = JSON.parse(localStorage.getItem("onetap_user") || "{}");
      localStorage.setItem("onetap_user", JSON.stringify({ ...current, ...updates }));
    } catch { /* ignore */ }
  };

  const setLang = (l: Lang) => {
    stopSpeak();
    setLangState(l);
    if (typeof window !== "undefined") localStorage.setItem("lang", l);
  };

  const setUserName = (n: string) => {
    setUserNameState(n);
    saveToStorage({ name: n });
  };

  const setUserPhone = (p: string) => {
    setUserPhoneState(p);
    saveToStorage({ phone: p });
  };

  const setUserEmail = (e: string) => {
    setUserEmailState(e);
    saveToStorage({ email: e });
  };

  return (
    <AppCtx.Provider
      value={{
        lang,
        setLang,
        userType,
        setUserType,
        need,
        setNeed,
        lastResults,
        setLastResults,
        userName,
        setUserName,
        userPhone,
        setUserPhone,
        userEmail,
        setUserEmail,
        profileOpen,
        setProfileOpen,
        chatSessions,
        setChatSessions,
        currentSessionId,
        setCurrentSessionId,
      }}
    >
      {children}
    </AppCtx.Provider>
  );
}

export function useApp() {
  const c = useContext(AppCtx);
  if (!c) throw new Error("useApp outside provider");
  return c;
}
