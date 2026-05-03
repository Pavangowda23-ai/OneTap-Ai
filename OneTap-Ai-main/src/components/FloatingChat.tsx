import { useState, useRef, useEffect, useMemo } from "react";
import { useApp, type ChatSession } from "@/lib/app-context";
import { t, POPULAR } from "@/lib/i18n";
import { chatAi } from "@/lib/ai-functions";
import { useNavigate, useLocation } from "@tanstack/react-router";

type Msg = { role: "user" | "assistant"; content: string };

// Mocking localChat for now or importing if available
const localChat = async (msgs: Msg[], lang: string) => null;

export function FloatingChat() {
  const {
    lang,
    lastResults,
    chatSessions,
    setChatSessions,
    currentSessionId,
    setCurrentSessionId
  } = useApp();

  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"list" | "chat">("list");
  const [tab, setTab] = useState<"active" | "archived">("active");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const activeSession = useMemo(() =>
    chatSessions.find(s => s.id === currentSessionId),
    [chatSessions, currentSessionId]
  );

  useEffect(() => {
    if (activeSession) {
      setView("chat");
    } else {
      setView("list");
    }
  }, [currentSessionId, activeSession]);

  useEffect(() => {
    if (view === "chat") {
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [activeSession?.messages, loading, view]);

  const sysContext = useMemo(() => {
    if (!lastResults?.length) return "";
    return `\n\nAvailable schemes the user is looking at: ${lastResults
      .map((s) => s.name)
      .join(", ")}. When relevant, mention these scheme names exactly so the user can tap them.`;
  }, [lastResults]);

  const startNewChat = () => {
    const newId = "session_" + Date.now();
    const newSession: ChatSession = {
      id: newId,
      title: t.newChat[lang],
      messages: [],
      status: "active",
      createdAt: Date.now()
    };
    setChatSessions([newSession, ...chatSessions]);
    setCurrentSessionId(newId);
    setView("chat");
  };

  const send = async (text: string) => {
    if (!text.trim() || loading || !activeSession) return;

    const userMsg: Msg = { role: "user", content: text };
    const updatedMessages: Msg[] = [...activeSession.messages, userMsg];

    let newTitle = activeSession.title;
    if (newTitle === t.newChat[lang]) {
      newTitle = text.slice(0, 30) + (text.length > 30 ? "..." : "");
    }

    // Add user message and a placeholder for assistant
    setChatSessions(chatSessions.map(s =>
      s.id === activeSession.id ? { ...s, messages: [...updatedMessages, { role: "assistant", content: "" }], title: newTitle } : s
    ));

    setInput("");
    setLoading(true);

    try {
      const langName = (lang === "hi" ? "Hindi" : lang === "kn" ? "Kannada" : "English");
      const sysMsg = { role: "system", content: `You are OneTap AI, a friendly guide for Indian government schemes. Reply in ${langName}. Use very short simple sentences. Maximum 4 sentences. No markdown.${sysContext}` };
      const payload = [sysMsg, ...updatedMessages];

      // Direct streaming from local Ollama for "asap" speed
      const response = await fetch("http://localhost:11434/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "llama3",
          messages: payload,
          stream: true,
        }),
      });

      if (!response.ok) throw new Error("Ollama direct failed");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const dataStr = line.slice(6);
              if (dataStr === "[DONE]") break;
              try {
                const data = JSON.parse(dataStr);
                const delta = data.choices?.[0]?.delta?.content || "";
                fullContent += delta;

                // Update UI in real-time
                setChatSessions(prev => prev.map(s =>
                  s.id === activeSession.id
                    ? { ...s, messages: [...updatedMessages, { role: "assistant", content: fullContent }] }
                    : s
                ));
              } catch { /* skip partial JSON */ }
            }
          }
        }
      }
    } catch (err) {
      console.error("Streaming error:", err);
      // Fallback to non-streaming if needed
      try {
        const res = await chatAi({ data: { messages: updatedMessages, lang } });
        setChatSessions(prev => prev.map(s =>
          s.id === activeSession.id
            ? { ...s, messages: [...updatedMessages, { role: "assistant", content: res.text }] }
            : s
        ));
      } catch {
        setChatSessions(prev => prev.map(s =>
          s.id === activeSession.id
            ? { ...s, messages: [...updatedMessages, { role: "assistant", content: "⚠️ Error. Try again." }] }
            : s
        ));
      }
    } finally {
      setLoading(false);
    }
  };

  const deleteSession = (id: string) => {
    setChatSessions(chatSessions.filter(s => s.id !== id));
    if (currentSessionId === id) setCurrentSessionId(null);
    setDeletingId(null);
  };

  const archiveSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setChatSessions(chatSessions.map(s =>
      s.id === id ? { ...s, status: s.status === "active" ? "archived" : "active" } : s
    ));
  };

  const handleRename = () => {
    if (editingId && editingTitle.trim()) {
      setChatSessions(chatSessions.map(x => x.id === editingId ? { ...x, title: editingTitle.trim() } : x));
      setEditingId(null);
    }
  };

  const findMentions = (content: string) =>
    lastResults.filter((s) =>
      content.toLowerCase().includes(s.name.toLowerCase()),
    );

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-2xl transition hover:scale-110 active:scale-95"
      >
        <span className="text-2xl font-bold">💬</span>
      </button>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={() => setOpen(false)}
    >
      <div
        className="bg-card w-full sm:max-w-md h-[75vh] sm:h-[600px] rounded-t-[2.5rem] sm:rounded-[3rem] flex flex-col shadow-2xl border border-border animate-in slide-in-from-bottom duration-300 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-border flex items-center justify-between bg-card/80 backdrop-blur sticky top-0 z-10">
          <div className="flex items-center gap-3">
            {view === "chat" && (
              <button onClick={() => setCurrentSessionId(null)} className="text-xl p-2 -ml-2">←</button>
            )}
            <h2 className="text-lg font-black text-card-foreground">
              {view === "list" ? t.chats[lang] : activeSession?.title}
            </h2>
          </div>
          <button onClick={() => setOpen(false)} className="text-3xl p-2 -mr-2 text-muted-foreground hover:text-foreground">×</button>
        </div>

        {/* List View */}
        {view === "list" && (
          <div className="flex-1 flex flex-col overflow-hidden bg-muted/30">
            <div className="p-4">
              <button
                onClick={startNewChat}
                className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-black text-lg shadow-lg shadow-primary/20 flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
              >
                <span>+</span> {t.newChat[lang]}
              </button>
            </div>

            <div className="flex gap-4 px-6 mb-2 border-b border-border/50">
              <button
                onClick={() => setTab("active")}
                className={`pb-3 text-sm font-black transition-colors ${tab === "active" ? "text-primary border-b-4 border-primary" : "text-muted-foreground"}`}
              >
                {t.active[lang]}
              </button>
              <button
                onClick={() => setTab("archived")}
                className={`pb-3 text-sm font-black transition-colors ${tab === "archived" ? "text-primary border-b-4 border-primary" : "text-muted-foreground"}`}
              >
                {t.archived[lang]}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatSessions.filter(s => s.status === tab).length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-2 opacity-50">
                  <span className="text-4xl">💭</span>
                  <p className="text-sm font-bold">No chats yet</p>
                </div>
              )}
              {chatSessions.filter(s => s.status === tab).map(s => (
                <div
                  key={s.id}
                  onClick={() => setCurrentSessionId(s.id)}
                  className="bg-card border border-border p-4 rounded-[2rem] hover:border-primary transition-all cursor-pointer group shadow-sm hover:shadow-md relative"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xl shrink-0">💬</span>
                      <h3 className="font-bold text-card-foreground text-sm line-clamp-1">{s.title}</h3>
                    </div>
                    <div className="flex gap-3 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingId(s.id);
                          setEditingTitle(s.title);
                        }}
                        className="text-base p-1 hover:scale-125 transition-transform"
                      >✏️</button>
                      <button onClick={(e) => archiveSession(s.id, e)} className="text-base p-1 hover:scale-125 transition-transform" title={tab === "active" ? "Archive" : "Unarchive"}>
                        {tab === "active" ? "📦" : "📤"}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingId(s.id);
                        }}
                        className="text-base p-1 hover:scale-125 transition-transform text-destructive"
                      >🗑️</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Custom Rename Modal */}
            {editingId && (
              <div className="absolute inset-0 z-20 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                <div className="bg-card w-[280px] rounded-[2rem] p-5 shadow-2xl border border-border space-y-4" onClick={e => e.stopPropagation()}>
                  <h3 className="font-black text-center">Rename Chat</h3>
                  <input
                    autoFocus
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    className="w-full rounded-xl bg-muted px-4 py-2.5 text-sm font-bold outline-none border-2 border-primary"
                    onKeyDown={(e) => e.key === "Enter" && handleRename()}
                  />
                  <div className="flex gap-2">
                    <button onClick={() => setEditingId(null)} className="flex-1 py-2.5 rounded-xl bg-secondary text-sm font-bold">{t.close[lang]}</button>
                    <button onClick={handleRename} className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-black">Save</button>
                  </div>
                </div>
              </div>
            )}

            {/* Custom Delete Modal */}
            {deletingId && (
              <div className="absolute inset-0 z-20 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                <div className="bg-card w-[280px] rounded-[2rem] p-6 shadow-2xl border border-border space-y-4 text-center" onClick={e => e.stopPropagation()}>
                  <div className="text-3xl">⚠️</div>
                  <h3 className="font-black">Delete this chat?</h3>
                  <div className="flex flex-col gap-2">
                    <button onClick={() => deleteSession(deletingId)} className="w-full py-3 rounded-xl bg-destructive text-destructive-foreground text-sm font-black">Delete</button>
                    <button onClick={() => setDeletingId(null)} className="w-full py-2.5 rounded-xl bg-secondary text-sm font-bold">{t.close[lang]}</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Chat View */}
        {view === "chat" && activeSession && (
          <>
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4">
              {activeSession.messages.length === 0 && (
                <div className="space-y-4 py-4">
                  <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">{t.tryAsking[lang]}</p>
                  <div className="flex flex-wrap gap-2">
                    {POPULAR.map((p, i) => (
                      <button
                        key={i}
                        onClick={() => send(p[lang])}
                        className="rounded-2xl bg-secondary text-secondary-foreground px-5 py-3 text-sm font-bold border border-border/50 hover:bg-accent transition-colors"
                      >
                        {p[lang]}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {activeSession.messages.map((m, i) => {
                const mentions = m.role === "assistant" ? findMentions(m.content) : [];
                return (
                  <div key={i} className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}>
                    <div className={`max-w-[85%] rounded-[2rem] p-4 text-base font-medium shadow-sm ${m.role === "user"
                      ? "bg-primary text-primary-foreground rounded-tr-none"
                      : "bg-secondary text-secondary-foreground rounded-tl-none border border-border/50"
                      }`}>
                      {m.content}
                    </div>
                    {mentions.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {mentions.map((s) => (
                          <button
                            key={s.name}
                            onClick={() => navigate({ to: "/scheme", search: { name: s.name, url: s.officialUrl || "" } })}
                            className="rounded-xl bg-accent text-accent-foreground px-3 py-1.5 text-xs font-black shadow-sm"
                          >
                            🔗 {s.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
              {loading && (
                <div className="bg-secondary text-secondary-foreground rounded-[2rem] rounded-tl-none p-4 text-sm font-black animate-pulse border border-border/50">
                  {t.thinking[lang]}
                </div>
              )}
            </div>

            <div className="p-4 bg-card border-t border-border">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  send(input);
                }}
                className="relative flex items-center"
              >
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={t.typeMessage[lang]}
                  className="w-full rounded-2xl bg-muted px-5 py-4 pr-14 text-base font-bold outline-none focus:ring-4 focus:ring-primary/10 border-2 border-transparent focus:border-primary transition-all"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || loading}
                  className="absolute right-2 h-11 w-11 flex items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg disabled:opacity-30 transition-transform active:scale-90"
                >
                  <span className="text-xl">↑</span>
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
