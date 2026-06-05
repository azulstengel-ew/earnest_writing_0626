import { useRef, useState } from "react";
import { Bookmark, Trash2, Send, FlaskConical, Loader2, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { THEME_CONFIGS, useProjects, type Project, type ResearchSnippet } from "@/lib/projects-store";
import { askResearch, type ChatMessage } from "@/lib/research-fn";

type Message = ChatMessage & { id: string };

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function SnippetCard({
  snippet,
  accent,
  onDelete,
}: {
  snippet: ResearchSnippet;
  accent: string;
  onDelete: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(`Q: ${snippet.question}\n\nA: ${snippet.answer}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="group rounded-lg border border-border/60 bg-card p-4">
      <p className="text-xs font-medium text-muted-foreground line-clamp-2">{snippet.question}</p>
      <p className="mt-2 text-sm leading-relaxed line-clamp-4">{snippet.answer}</p>
      <div className="mt-3 flex items-center justify-between">
        <span className="text-[11px] text-muted-foreground">{timeAgo(snippet.savedAt)}</span>
        <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={copy}
            title="Copy"
            className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            {copied ? <Check className="h-3.5 w-3.5" style={{ color: accent }} /> : <Copy className="h-3.5 w-3.5" />}
          </button>
          <button
            onClick={onDelete}
            title="Delete"
            className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function ResearchView({ project }: { project: Project }) {
  const { saveResearchSnippet, deleteResearchSnippet } = useProjects();
  const theme = THEME_CONFIGS[project.theme ?? "books-stories"];
  const snippets = project.researchSnippets ?? [];

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () =>
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);

  const send = async () => {
    const q = input.trim();
    if (!q || loading) return;
    setInput("");
    setError(null);

    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: q };
    const history: Message[] = [...messages, userMsg];
    setMessages(history);
    scrollToBottom();
    setLoading(true);

    try {
      const answer = await askResearch({
        data: {
          messages: history.map(({ role, content }) => ({ role, content })),
          theme: project.theme ?? "books-stories",
          projectTitle: project.title,
        },
      });
      const assistantMsg: Message = { id: crypto.randomUUID(), role: "assistant", content: answer };
      setMessages((prev) => [...prev, assistantMsg]);
      scrollToBottom();
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const saveLatestAnswer = () => {
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
    if (!lastUser || !lastAssistant) return;
    saveResearchSnippet(project.id, {
      question: lastUser.content,
      answer: lastAssistant.content,
    });
    setSavedIds((prev) => new Set([...prev, lastAssistant.id]));
  };

  const lastAssistantMsg = [...messages].reverse().find((m) => m.role === "assistant");
  const canSave =
    lastAssistantMsg &&
    !savedIds.has(lastAssistantMsg.id) &&
    !loading;

  const placeholders: Record<string, string> = {
    "books-stories": "What were Victorian mourning customs?",
    "screenplays-tv": "What's the typical runtime for a network pilot?",
    "copywriting": "What's the average email open rate in retail?",
    "social-media": "What's the best time to post on Instagram in 2025?",
    "ads-campaigns": "What's the average CPM for display ads?",
    "dissertations": "Who are the key theorists in post-colonial studies?",
    "personal-journaling": "What's the difference between memoir and autobiography?",
    "poetry-verse": "What is sprung rhythm in poetry?",
  };

  const placeholder = placeholders[project.theme ?? "books-stories"] ?? "Ask a research question…";

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* ── Left: Chat ── */}
      <div className="flex flex-1 flex-col overflow-hidden border-r border-border/60">
        {/* Header */}
        <div className="border-b border-border/60 px-6 py-5">
          <div className="flex items-center gap-2">
            <FlaskConical className="h-4 w-4 text-muted-foreground" />
            <h1 className="font-serif text-2xl font-semibold tracking-tight">Research</h1>
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Ask anything. Save useful answers as snippets.
          </p>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center gap-3 py-16">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-full"
                style={{ backgroundColor: theme.accent + "18" }}
              >
                <FlaskConical className="h-5 w-5" style={{ color: theme.accent }} />
              </div>
              <div>
                <p className="font-serif text-lg">Your research companion.</p>
                <p className="mt-1 text-sm text-muted-foreground max-w-xs">
                  Ask factual questions, get direct answers tailored to{" "}
                  <span className="italic">{theme.label.toLowerCase()}</span> writing.
                </p>
              </div>
              <div className="mt-2 flex flex-wrap justify-center gap-2">
                {[placeholder, "What makes a reliable narrator?", "Suggest three search terms for this topic"].map((q) => (
                  <button
                    key={q}
                    onClick={() => { setInput(q); textareaRef.current?.focus(); }}
                    className="rounded-full border border-border/70 bg-card px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-accent/50 hover:text-foreground"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[82%] rounded-xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "text-white"
                    : "bg-card border border-border/60"
                }`}
                style={msg.role === "user" ? { backgroundColor: theme.accent } : undefined}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-card px-4 py-3 text-sm text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Thinking…
              </div>
            </div>
          )}

          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Save bar */}
        {canSave && (
          <div
            className="flex items-center justify-between px-6 py-2.5 text-xs border-t border-border/60"
            style={{ backgroundColor: theme.accent + "10" }}
          >
            <span className="text-muted-foreground">Save this answer to your snippets?</span>
            <button
              onClick={saveLatestAnswer}
              className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors hover:opacity-80"
              style={{ backgroundColor: theme.accent, color: theme.accentFg }}
            >
              <Bookmark className="h-3 w-3" /> Save snippet
            </button>
          </div>
        )}

        {/* Input */}
        <div className="border-t border-border/60 p-4">
          <div className="flex items-end gap-3 rounded-xl border border-border bg-card px-4 py-3 focus-within:border-accent/60 transition-colors">
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
              }}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={loading}
              className="flex-1 resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:opacity-50 leading-relaxed"
              style={{ minHeight: "24px" }}
            />
            <button
              onClick={send}
              disabled={!input.trim() || loading}
              className="flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-lg transition-colors disabled:opacity-40"
              style={{ backgroundColor: theme.accent, color: theme.accentFg }}
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
          <p className="mt-2 text-center text-[11px] text-muted-foreground">
            Press Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>

      {/* ── Right: Snippets ── */}
      <div className="flex w-72 flex-shrink-0 flex-col overflow-hidden">
        <div className="border-b border-border/60 px-5 py-5">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-base font-semibold">Saved snippets</h2>
            <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
              {snippets.length}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">One-click save from chat answers.</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {snippets.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
              <Bookmark className="h-6 w-6 text-muted-foreground/40" />
              <p className="text-xs text-muted-foreground">
                No snippets yet. Ask a question and save the answer.
              </p>
            </div>
          ) : (
            snippets.map((s) => (
              <SnippetCard
                key={s.id}
                snippet={s}
                accent={theme.accent}
                onDelete={() => deleteResearchSnippet(project.id, s.id)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
