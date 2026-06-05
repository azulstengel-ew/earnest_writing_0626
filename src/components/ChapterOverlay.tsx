import { useEffect, useMemo, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
} from "docx";
import { saveAs } from "file-saver";
import { Bold, Italic, Heading, Quote, X, Download, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  THEME_CONFIGS,
  type Chapter, type Project, type Sticky, type StickyColor,
  type ArgumentEntry, type ChapterBrief, type ChapterVariations,
  useProjects,
} from "@/lib/projects-store";

const STICKY_COLORS: Record<StickyColor, string> = {
  yellow: "#FFF3B0", coral: "#FFC1B4", sage: "#CFE3CF",
  powder: "#C9DCEA", lavender: "#DCD3EC",
};
const COLOR_ORDER: StickyColor[] = ["yellow", "coral", "sage", "powder", "lavender"];

const PLATFORM_LIMITS: Record<string, number> = {
  instagram: 2200, tiktok: 2200, linkedin: 3000,
  twitter: 280, threads: 500, youtube: 5000, facebook: 63206,
};

const MOODS = [
  { id: "great",  color: "#4A7C3F", label: "Great"    },
  { id: "good",   color: "#7AB648", label: "Good"     },
  { id: "okay",   color: "#E8A020", label: "Okay"     },
  { id: "low",    color: "#C8394A", label: "Low"      },
  { id: "hard",   color: "#2E6DA4", label: "Hard day" },
];

function countWords(s: string) {
  return s.trim() ? s.trim().split(/\s+/).length : 0;
}

function countSyllables(word: string): number {
  word = word.toLowerCase().trim();
  if (!word) return 0;
  if (word.length <= 3) return 1;
  word = word.replace(/(?:[^laeiouy]|ed|[^laeiouy]e)$/, "");
  word = word.replace(/^y/, "");
  const m = word.match(/[aeiouy]{1,2}/g);
  return m ? m.length : 1;
}

function countLineSyllables(line: string): number {
  return line.trim().split(/\s+/).reduce((s, w) => s + countSyllables(w), 0);
}

const COMMON_WORDS = [
  "light","night","might","right","sight","flight","tight","bright","white",
  "time","rhyme","climb","prime","find","mind","kind","wind","line","fine",
  "mine","vine","divine","shine","blue","true","through","knew","new","few",
  "dew","grew","love","above","dove","shove","move","prove","heart","start",
  "part","art","smart","dark","spark","mark","lark","far","star","fire",
  "desire","higher","wire","entire","inspire","day","say","way","play","stay",
  "grey","they","weigh","rain","pain","main","gain","train","plain","lane",
  "name","same","came","flame","game","soul","whole","role","toll","cold",
  "bold","gold","hold","old","told","door","more","shore","core","before",
  "store","floor","dream","seem","team","stream","gleam","tree","free","sea",
  "be","see","me","we","write","quite","blood","flood","mood","food","brood",
  "spring","bring","sing","ring","king","thing","wing","sting","long","song",
  "strong","wrong","belong","among","tongue","young","breath","death","beneath",
];

function findRhymes(word: string): string[] {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!w) return [];
  const end3 = w.slice(-3);
  const end2 = w.slice(-2);
  return COMMON_WORDS
    .filter((r) => r !== w && (r.endsWith(end3) || r.endsWith(end2)))
    .slice(0, 8);
}

type AllTab = "Write" | "Ideas" | "Notes" | "Brief" | "A/B" | "Hashtags" | "Variations" | "Argument";

export function ChapterOverlay({
  project, chapter, onClose,
}: {
  project: Project; chapter: Chapter; onClose: () => void;
}) {
  const { updateChapter } = useProjects();
  const theme = project.theme ?? "books-memoir";
  const cfg = THEME_CONFIGS[theme] ?? THEME_CONFIGS["books-memoir"];

  const tabs: AllTab[] = useMemo(() => {
    const base: AllTab[] = ["Write", "Ideas", "Notes"];
    if (theme === "copywriting") return [...base, "Brief", "A/B"];
    if (theme === "ads-campaigns") return [...base, "Variations"];
    if (theme === "social-media") return [...base, "Hashtags"];
    if (theme === "dissertation" || theme === "essays") return [...base, "Argument"];
    return base;
  }, [theme]);

  const [tab, setTab] = useState<AllTab>("Write");
  const [title, setTitle] = useState(chapter.title);
  const [body, setBody] = useState(chapter.body);
  const [notes, setNotes] = useState(chapter.notes);
  const [ideas, setIdeas] = useState<Sticky[]>(chapter.ideas);
  const [mood, setMood] = useState(chapter.mood ?? "");
  const [brief, setBrief] = useState<ChapterBrief>(
    chapter.brief ?? { objective: "", audience: "", tone: "", keyMessage: "", channel: "" }
  );
  const [variations, setVariations] = useState<ChapterVariations>(
    chapter.variations ?? { headlines: [], ctas: [] }
  );
  const [chapterArgs, setChapterArgs] = useState<ArgumentEntry[]>(chapter.arguments ?? []);
  const [platform, setPlatform] = useState(chapter.platform ?? "instagram");
  const [dirty, setDirty] = useState(false);
  const [rhymes, setRhymes] = useState<string[]>([]);
  const [rhymeWord, setRhymeWord] = useState("");
  const [copiedRhyme, setCopiedRhyme] = useState<string | null>(null);
  const [hashtagInput, setHashtagInput] = useState("");
  const [hashtagName, setHashtagName] = useState("");
  const [hashtagPlatform, setHashtagPlatform] = useState("instagram");

  const editorRef = useRef<HTMLDivElement>(null);
  const fontFamily = cfg.bodyFont;
  const words = useMemo(() => countWords(body), [body]);
  const charCount = body.length;
  const platformLimit = PLATFORM_LIMITS[platform] ?? 0;
  const isScreenplay = theme === "screenplays-tv";
  const isPoetry = theme === "poetry-verse";
  const isSocial = theme === "social-media";
  const isJournaling = theme === "journaling";

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: "Begin where you left off…" }),
    ],
    content: chapter.body,
    editorProps: {
      attributes: {
        spellcheck: "true",
        lang: "en",
        style: [
          "outline:none",
          "min-height:100%",
          `font-family:${isScreenplay ? "'Courier Prime','Courier New',monospace" : fontFamily}`,
          `font-size:${isScreenplay ? "14px" : "18px"}`,
          `line-height:${isScreenplay ? "1.5" : "1.9"}`,
          `max-width:${isScreenplay ? "600px" : "672px"}`,
          `padding:${isScreenplay ? "32px 80px 64px" : "64px 48px"}`,
          "margin:0 auto",
        ].join(";"),
      },
    },
    onUpdate: ({ editor }) => {
      setBody(editor.getText());
      setDirty(true);
    },
  });

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.spellcheck = true;
      editorRef.current.setAttribute("spellcheck", "true");
    }
  }, []);

  useEffect(() => {
    setTitle(chapter.title); setBody(chapter.body); setNotes(chapter.notes);
    setIdeas(chapter.ideas); setMood(chapter.mood ?? "");
    setBrief(chapter.brief ?? { objective: "", audience: "", tone: "", keyMessage: "", channel: "" });
    setVariations(chapter.variations ?? { headlines: [], ctas: [] });
    setChapterArgs(chapter.arguments ?? []);
    setPlatform(chapter.platform ?? "instagram");
    setDirty(false);
    editor?.commands.setContent(chapter.body ?? '');
    setTab("Write");
  }, [chapter.id]);

  useEffect(() => {
    if (!dirty) return;
    const id = setTimeout(() => {
      const status = words === 0 ? "not-started" : words >= chapter.target ? "done" : "in-progress";
      updateChapter(project.id, chapter.id, {
        title, body, notes, ideas, words, status, mood,
        brief, variations, arguments: chapterArgs, platform,
      });
      setDirty(false);
    }, 700);
    return () => clearTimeout(id);
  }, [dirty, title, body, notes, ideas, words, mood, brief, variations, chapterArgs, platform,
      project.id, chapter.id, chapter.target, updateChapter]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const exec = (cmd: string, val?: string) => {
    if (!editor) return;
    if (cmd === 'bold') editor.chain().focus().toggleBold().run();
    else if (cmd === 'italic') editor.chain().focus().toggleItalic().run();
    else if (val === 'h2') editor.chain().focus().toggleHeading({ level: 2 }).run();
    else if (val === 'blockquote') editor.chain().focus().toggleBlockquote().run();
  };

  const onBodyChange = () => {
    if (editorRef.current) { setBody(editorRef.current.innerText); setDirty(true); }
  };

  const handleEditorMouseUp = () => {
    if (!isPoetry) return;
    const sel = window.getSelection()?.toString().trim().split(/\s+/).pop() ?? "";
    if (sel && sel !== rhymeWord) { setRhymeWord(sel); setRhymes(findRhymes(sel)); }
  };

  const downloadDocx = async () => {
    const paragraphs = body.split(/\n+/).filter((l) => l.trim().length > 0);
    const doc = new Document({
      sections: [{ properties: {}, children: [
        new Paragraph({ heading: HeadingLevel.HEADING_1, alignment: AlignmentType.LEFT, children: [new TextRun({ text: title, bold: true })] }),
        new Paragraph({ children: [new TextRun("")] }),
        ...paragraphs.map((p) => new Paragraph({ children: [new TextRun(p)] })),
      ]}],
    });
    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${title.replace(/[^a-z0-9-_ ]/gi, "").trim() || "chapter"}.docx`);
  };

  const pageCount = Math.max(1, Math.round(words / 55));
  const charColor = platformLimit > 0
    ? charCount > platformLimit ? "#FF5050" : charCount > platformLimit * 0.8 ? "#E8A020" : "#6B7A99"
    : "#6B7A99";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8">
      <button type="button" aria-label="Close chapter"
        className="absolute inset-0 bg-foreground/30 backdrop-blur-md" onClick={onClose} />
      <div className="relative flex h-full max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-2xl">

        {/* Tabs */}
        <div className="flex items-center justify-between border-b border-border/60 px-6 pt-5 pb-3">
          <div className="inline-flex rounded-full border border-border/70 bg-background p-1">
            {tabs.map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
                  tab === t ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                {t}
              </button>
            ))}
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between gap-4 border-b border-border/60 px-6 py-3">
          <input value={title} onChange={(e) => { setTitle(e.target.value); setDirty(true); }}
            className="min-w-0 flex-1 bg-transparent font-serif text-lg font-semibold tracking-tight outline-none placeholder:text-muted-foreground"
            placeholder="Untitled chapter" />
          {tab === "Write" && (
            <div className="flex items-center gap-1">
              <ToolBtn onClick={() => exec("bold")} label="Bold"><Bold className="h-3.5 w-3.5" /></ToolBtn>
              <ToolBtn onClick={() => exec("italic")} label="Italic"><Italic className="h-3.5 w-3.5" /></ToolBtn>
              <ToolBtn onClick={() => exec("formatBlock", "h2")} label="Heading"><Heading className="h-3.5 w-3.5" /></ToolBtn>
              <ToolBtn onClick={() => exec("formatBlock", "blockquote")} label="Blockquote"><Quote className="h-3.5 w-3.5" /></ToolBtn>
              <span className="mx-1 h-5 w-px bg-border" />
              <Button variant="ghost" size="sm" onClick={downloadDocx} className="text-xs text-muted-foreground hover:text-foreground">
                <Download className="h-3.5 w-3.5" /> Word
              </Button>
            </div>
          )}
          <div className="flex items-center gap-3">
            {isSocial ? (
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium" style={{ color: charColor }}>
                  {charCount.toLocaleString()}{platformLimit > 0 ? ` / ${platformLimit.toLocaleString()}` : ""} chars
                </span>
                <Select value={platform} onValueChange={(v) => { setPlatform(v); setDirty(true); }}>
                  <SelectTrigger className="h-7 text-xs w-32"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.keys(PLATFORM_LIMITS).map((p) => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            ) : isScreenplay ? (
              <span className="hidden text-xs text-muted-foreground md:inline">~{pageCount} pages · ~{pageCount} min</span>
            ) : (
              <span className="hidden text-xs text-muted-foreground md:inline">{words.toLocaleString()} words</span>
            )}
            <Button size="sm" onClick={onClose} className="bg-accent text-accent-foreground hover:bg-accent/90">Done</Button>
          </div>
        </div>

        {/* Body */}
        <div className="relative flex-1 overflow-hidden bg-background">

          {tab === "Write" && (
            <div className="flex h-full">
              <div className="flex-1 overflow-y-auto">
                {isJournaling && (
                  <div className="flex items-center gap-3 px-12 pt-8 pb-0">
                    <span className="text-xs text-muted-foreground">Today I feel:</span>
                    {MOODS.map((m) => (
                      <button key={m.id} onClick={() => { setMood(m.id); setDirty(true); }} title={m.label}
                        className="h-6 w-6 rounded-full transition-all"
                        style={{ background: m.color, outline: mood === m.id ? `2px solid ${m.color}` : "none", outlineOffset: 2, opacity: mood && mood !== m.id ? 0.4 : 1 }} />
                    ))}
                    {mood && <span className="text-xs text-muted-foreground">{MOODS.find((m) => m.id === mood)?.label}</span>}
                  </div>
                )}
                {isScreenplay && (
                  <div className="flex items-center gap-2 px-12 pt-6 pb-0 text-xs text-muted-foreground">
                    <span className="rounded bg-secondary px-2 py-0.5">Tab</span>
                    <span>to cycle element type · Use INT./EXT. LOCATION — DAY/NIGHT for scene headings</span>
                  </div>
                )}
                <EditorContent editor={editor} className="h-full overflow-y-auto" />
              </div>
              {isPoetry && (
                <div className="w-48 flex-shrink-0 border-l border-border/60 bg-card/40 overflow-y-auto p-4">
                  <p className="mb-3 text-[10px] uppercase tracking-wider text-muted-foreground">Syllables per line</p>
                  {body.split("\n").map((line, i) => (
                    <div key={i} className="flex items-center justify-between py-0.5 text-xs">
                      <span className="flex-1 truncate text-muted-foreground">{line || "\u2014"}</span>
                      {line.trim() && <span className="ml-2 flex-shrink-0 font-mono text-accent">{countLineSyllables(line)}</span>}
                    </div>
                  ))}
                  {rhymes.length > 0 && (
                    <div className="mt-4 border-t border-border/60 pt-3">
                      <p className="mb-2 text-[10px] uppercase tracking-wider text-muted-foreground">Rhymes for \u201c{rhymeWord}\u201d</p>
                      <div className="flex flex-wrap gap-1.5">
                        {rhymes.map((r) => (
                          <button key={r} onClick={() => { navigator.clipboard.writeText(r).catch(() => {}); setCopiedRhyme(r); setTimeout(() => setCopiedRhyme(null), 1500); }}
                            className="rounded-full px-2 py-0.5 text-xs transition-colors"
                            style={{ background: copiedRhyme === r ? cfg.accent + "20" : "var(--secondary)", color: copiedRhyme === r ? cfg.accent : "var(--muted-foreground)" }}>
                            {copiedRhyme === r ? "copied!" : r}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {!rhymes.length && <p className="mt-4 text-[10px] text-muted-foreground/60">Select a word for rhyme suggestions</p>}
                </div>
              )}
            </div>
          )}

          {tab === "Ideas" && <IdeasCanvas ideas={ideas} setIdeas={(v) => { setIdeas(v); setDirty(true); }} />}

          {tab === "Notes" && (
            <textarea value={notes} onChange={(e) => { setNotes(e.target.value); setDirty(true); }}
              placeholder="Continuity notes, reminders, things to check\u2026 private to you."
              className="h-full w-full resize-none border-0 bg-background p-10 font-sans text-base leading-relaxed outline-none" />
          )}

          {tab === "Brief" && (
            <div className="h-full overflow-y-auto p-8">
              <h2 className="mb-6 font-serif text-xl font-semibold">Content brief</h2>
              <div className="max-w-xl space-y-4">
                {(["objective","audience","tone","keyMessage"] as const).map((field) => (
                  <div key={field} className="space-y-1.5">
                    <Label className="capitalize">{field === "keyMessage" ? "Key message" : field}</Label>
                    <Input value={brief[field] ?? ""}
                      onChange={(e) => { setBrief((b) => ({ ...b, [field]: e.target.value })); setDirty(true); }}
                      placeholder={field === "objective" ? "What should this copy achieve?" : field === "audience" ? "Who is reading this?" : field === "tone" ? "e.g. warm, direct, confident" : "The one thing readers should remember"} />
                  </div>
                ))}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Word count limit</Label>
                    <Input type="number" placeholder="e.g. 300" value={brief.wordLimit ?? ""}
                      onChange={(e) => { setBrief((b) => ({ ...b, wordLimit: e.target.value ? Number(e.target.value) : undefined })); setDirty(true); }} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Channel</Label>
                    <Select value={brief.channel || "web"} onValueChange={(v) => { setBrief((b) => ({ ...b, channel: v })); setDirty(true); }}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["web","email","print","social","other"].map((c) => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === "A/B" && (
            <div className="h-full overflow-y-auto p-8">
              <h2 className="mb-6 font-serif text-xl font-semibold">A/B versions</h2>
              <p className="mb-4 text-sm text-muted-foreground">Write two versions of this piece and track which is live.</p>
              <div className="grid grid-cols-2 gap-6">
                {(["A","B"] as const).map((label) => (
                  <div key={label} className="rounded-xl border border-border/60 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="font-semibold">Version {label}</span>
                    </div>
                    <textarea className="mb-3 h-48 w-full resize-none rounded-lg border border-border bg-background p-3 text-sm outline-none focus:border-accent"
                      placeholder={`Write version ${label}\u2026`} />
                    <Input placeholder="Notes on this version\u2026" className="text-xs" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "Variations" && (
            <div className="h-full overflow-y-auto p-8">
              <h2 className="mb-6 font-serif text-xl font-semibold">Headline & CTA variations</h2>
              <div className="space-y-8 max-w-2xl">
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-semibold">Headlines</h3>
                    <span className="text-xs text-muted-foreground">{variations.headlines.length} / 8</span>
                  </div>
                  <div className="space-y-2">
                    {variations.headlines.map((h, i) => {
                      const len = h.text.length;
                      const col = len > 60 ? "#FF5050" : len > 30 ? "#E8A020" : "#4A7C3F";
                      return (
                        <div key={h.id} className="flex items-center gap-2">
                          <input className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
                            value={h.text} placeholder={`Headline ${i + 1}`}
                            onChange={(e) => { setVariations((v) => ({ ...v, headlines: v.headlines.map((x) => x.id === h.id ? { ...x, text: e.target.value } : x) })); setDirty(true); }} />
                          <span className="w-8 text-right text-xs font-mono" style={{ color: col }}>{len}</span>
                          <button onClick={() => { setVariations((v) => ({ ...v, headlines: v.headlines.map((x) => x.id === h.id ? { ...x, isLive: !x.isLive } : { ...x, isLive: false }) })); setDirty(true); }}
                            className={`rounded-full px-2 py-0.5 text-xs whitespace-nowrap ${h.isLive ? "bg-green-100 text-green-700" : "bg-secondary text-muted-foreground"}`}>
                            {h.isLive ? "Live" : "Set live"}
                          </button>
                          <button onClick={() => { setVariations((v) => ({ ...v, headlines: v.headlines.filter((x) => x.id !== h.id) })); setDirty(true); }} className="text-muted-foreground hover:text-destructive">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  {variations.headlines.length < 8 && (
                    <button onClick={() => { setVariations((v) => ({ ...v, headlines: [...v.headlines, { id: crypto.randomUUID(), text: "", isLive: false }] })); setDirty(true); }}
                      className="mt-2 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                      <Plus className="h-3 w-3" /> Add headline
                    </button>
                  )}
                </div>
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-semibold">CTAs</h3>
                    <span className="text-xs text-muted-foreground">{variations.ctas.length} / 4</span>
                  </div>
                  <div className="space-y-2">
                    {variations.ctas.map((c, i) => {
                      const len = c.text.length;
                      return (
                        <div key={c.id} className="flex items-center gap-2">
                          <input className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
                            value={c.text} placeholder={`CTA ${i + 1}`}
                            onChange={(e) => { setVariations((v) => ({ ...v, ctas: v.ctas.map((x) => x.id === c.id ? { ...x, text: e.target.value } : x) })); setDirty(true); }} />
                          <span className="w-8 text-right text-xs font-mono" style={{ color: len > 15 ? "#E8A020" : "#4A7C3F" }}>{len}</span>
                          <button onClick={() => { setVariations((v) => ({ ...v, ctas: v.ctas.map((x) => x.id === c.id ? { ...x, isLive: !x.isLive } : { ...x, isLive: false }) })); setDirty(true); }}
                            className={`rounded-full px-2 py-0.5 text-xs whitespace-nowrap ${c.isLive ? "bg-green-100 text-green-700" : "bg-secondary text-muted-foreground"}`}>
                            {c.isLive ? "Live" : "Set live"}
                          </button>
                          <button onClick={() => { setVariations((v) => ({ ...v, ctas: v.ctas.filter((x) => x.id !== c.id) })); setDirty(true); }} className="text-muted-foreground hover:text-destructive">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  {variations.ctas.length < 4 && (
                    <button onClick={() => { setVariations((v) => ({ ...v, ctas: [...v.ctas, { id: crypto.randomUUID(), text: "", isLive: false }] })); setDirty(true); }}
                      className="mt-2 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                      <Plus className="h-3 w-3" /> Add CTA
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {tab === "Hashtags" && (
            <div className="h-full overflow-y-auto p-8">
              <h2 className="mb-6 font-serif text-xl font-semibold">Hashtag library</h2>
              <div className="max-w-xl space-y-4">
                <div className="rounded-xl border border-border/60 p-4 space-y-3">
                  <h3 className="text-sm font-semibold">Add a set</h3>
                  <Input placeholder="Set name (e.g. Travel content)" value={hashtagName} onChange={(e) => setHashtagName(e.target.value)} />
                  <Input placeholder="#hashtag1 #hashtag2 #hashtag3" value={hashtagInput} onChange={(e) => setHashtagInput(e.target.value)} />
                  <div className="flex gap-2">
                    <Select value={hashtagPlatform} onValueChange={setHashtagPlatform}>
                      <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.keys(PLATFORM_LIMITS).map((p) => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Button size="sm" disabled={!hashtagName.trim() || !hashtagInput.trim()}
                      onClick={() => { setHashtagName(""); setHashtagInput(""); }}
                      className="bg-accent text-accent-foreground hover:bg-accent/90">Save set</Button>
                  </div>
                </div>
                {(project.hashtagLibrary ?? []).map((hs) => (
                  <div key={hs.id} className="flex items-start justify-between rounded-xl border border-border/60 p-4">
                    <div>
                      <p className="text-sm font-medium">{hs.name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{hs.tags}</p>
                      <span className="mt-1 inline-block rounded-full bg-secondary px-2 py-0.5 text-[10px] capitalize text-muted-foreground">{hs.platform}</span>
                    </div>
                    <Button size="sm" variant="ghost" className="text-xs"
                      onClick={() => { const nb = body + (body.endsWith("\n") ? "" : "\n") + hs.tags; setBody(nb); if (editorRef.current) editorRef.current.innerText = nb; setDirty(true); }}>
                      Insert
                    </Button>
                  </div>
                ))}
                {!(project.hashtagLibrary ?? []).length && <p className="text-sm text-muted-foreground">No hashtag sets yet. Add one above.</p>}
              </div>
            </div>
          )}

          {tab === "Argument" && (
            <div className="h-full overflow-y-auto p-8">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="font-serif text-xl font-semibold">Argument tracker</h2>
                <Button size="sm"
                  onClick={() => { setChapterArgs((a) => [...a, { id: crypto.randomUUID(), claim: "", evidence: "", counter: "", response: "" }]); setDirty(true); }}
                  className="bg-accent text-accent-foreground hover:bg-accent/90">
                  <Plus className="h-4 w-4" /> Add argument
                </Button>
              </div>
              <div className="max-w-2xl space-y-4">
                {chapterArgs.length === 0 && <p className="text-sm text-muted-foreground">No arguments yet. Add one to track your claims and evidence.</p>}
                {chapterArgs.map((arg, i) => (
                  <div key={arg.id} className="rounded-xl border border-border/60 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Argument {i + 1}</span>
                      <button onClick={() => { setChapterArgs((a) => a.filter((x) => x.id !== arg.id)); setDirty(true); }} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                    {([
                      { key: "claim" as const, label: "Claim", placeholder: "What are you arguing?" },
                      { key: "evidence" as const, label: "Evidence", placeholder: "What supports this?" },
                      { key: "counter" as const, label: "Counter-argument", placeholder: "What might someone object?" },
                      { key: "response" as const, label: "Response", placeholder: "How do you address the objection?" },
                    ]).map(({ key, label, placeholder }) => (
                      <div key={key} className="space-y-1">
                        <Label className="text-xs text-muted-foreground">{label}</Label>
                        <textarea rows={2}
                          className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
                          placeholder={placeholder} value={arg[key]}
                          onChange={(e) => { setChapterArgs((a) => a.map((x) => x.id === arg.id ? { ...x, [key]: e.target.value } : x)); setDirty(true); }} />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pointer-events-none absolute bottom-4 right-5 flex items-center gap-2 text-xs text-muted-foreground">
            <span className={`h-2 w-2 rounded-full transition-colors ${dirty ? "bg-amber-500" : "bg-muted-foreground/40"}`} />
            <span>{dirty ? "saving\u2026" : "saved"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ToolBtn({ children, onClick, label }: { children: React.ReactNode; onClick: () => void; label: string }) {
  return (
    <button type="button" title={label} onMouseDown={(e) => e.preventDefault()} onClick={onClick}
      className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
      {children}
    </button>
  );
}

function IdeasCanvas({ ideas, setIdeas }: { ideas: Sticky[]; setIdeas: (v: Sticky[]) => void }) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragState = useRef<{ id: string; offX: number; offY: number } | null>(null);

  const addSticky = () => {
    const color = COLOR_ORDER[ideas.length % COLOR_ORDER.length];
    setIdeas([...ideas, { id: crypto.randomUUID(), text: "", color, x: 40 + (ideas.length % 5) * 30, y: 40 + (ideas.length % 5) * 30 }]);
  };

  const update = (id: string, patch: Partial<Sticky>) => setIdeas(ideas.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  const remove = (id: string) => setIdeas(ideas.filter((s) => s.id !== id));

  const onMouseDown = (e: React.MouseEvent, s: Sticky) => {
    const target = e.target as HTMLElement;
    if (target.tagName === "TEXTAREA" || target.tagName === "BUTTON") return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    dragState.current = { id: s.id, offX: e.clientX - rect.left - s.x, offY: e.clientY - rect.top - s.y };
  };

  useEffect(() => {
    const move = (e: MouseEvent) => {
      const d = dragState.current;
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!d || !rect) return;
      update(d.id, { x: Math.max(0, e.clientX - rect.left - d.offX), y: Math.max(0, e.clientY - rect.top - d.offY) });
    };
    const up = () => (dragState.current = null);
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    return () => { window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); };
  });

  return (
    <div ref={canvasRef} className="relative h-full w-full overflow-auto"
      style={{ backgroundColor: "#F0E6D2", backgroundImage: "radial-gradient(circle at 1px 1px, rgba(0,0,0,0.06) 1px, transparent 0)", backgroundSize: "16px 16px" }}>
      <button onClick={addSticky}
        className="absolute right-4 top-4 z-10 inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground shadow-md hover:bg-accent/90">
        <Plus className="h-3.5 w-3.5" /> Add note
      </button>
      {ideas.length === 0 && (
        <div className="pointer-events-none flex h-full items-center justify-center text-sm text-foreground/40">
          A blank corkboard. Tack up an idea.
        </div>
      )}
      {ideas.map((s) => (
        <div key={s.id} onMouseDown={(e) => onMouseDown(e, s)}
          className="absolute cursor-grab select-none rounded-sm p-3 shadow-md transition-shadow hover:shadow-lg active:cursor-grabbing"
          style={{ left: s.x, top: s.y, width: 180, minHeight: 160, backgroundColor: STICKY_COLORS[s.color], transform: `rotate(${(parseInt(s.id.slice(0, 2), 16) % 7) - 3}deg)` }}>
          <div className="flex justify-end">
            <button onClick={() => remove(s.id)} className="rounded p-0.5 text-foreground/40 hover:bg-foreground/10 hover:text-foreground/80" aria-label="Delete note">
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
          <textarea value={s.text} onChange={(e) => update(s.id, { text: e.target.value })}
            placeholder="An idea\u2026"
            className="h-32 w-full resize-none border-0 bg-transparent p-0 text-sm leading-snug text-foreground/90 outline-none placeholder:text-foreground/40"
            style={{ fontFamily: '"' + 'Cormorant Garamond' + '", Georgia, serif', fontSize: 15 }} />
        </div>
      ))}
    </div>
  );
}
