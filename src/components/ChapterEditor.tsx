import { useEffect, useMemo, useRef, useState } from "react";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
} from "docx";
import pkg from "file-saver";
const { saveAs } = pkg as { saveAs: (blob: Blob, name: string) => void };
import {
  Bold,
  Italic,
  Heading,
  Quote,
  Download,
  ArrowLeft,
  MessageSquare,
  FileText,
  X,
  Check,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  THEME_CONFIGS,
  type Chapter,
  type Project,
  type Comment,
  useProjects,
} from "@/lib/projects-store";

type RightTab = "notes" | "comments";

function countWords(s: string) {
  return s.trim() ? s.trim().split(/\s+/).length : 0;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function ChapterEditor({
  project,
  chapter,
  onClose,
}: {
  project: Project;
  chapter: Chapter;
  onClose: () => void;
}) {
  const { updateChapter, addComment, resolveComment, deleteComment } = useProjects();
  const [rightTab, setRightTab] = useState<RightTab>("notes");
  const [title, setTitle] = useState(chapter.title);
  const [body, setBody] = useState(chapter.body);
  const [notes, setNotes] = useState(chapter.notes);
  const [dirty, setDirty] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [selection, setSelection] = useState<string>("");
  const [addingComment, setAddingComment] = useState(false);
  const [commentText, setCommentText] = useState("");
  const editorRef = useRef<HTMLDivElement>(null);
  const fontFamily = THEME_CONFIGS[project.theme ?? "books-stories"].bodyFont;
  const words = useMemo(() => countWords(body), [body]);
  const activeComments = chapter.comments.filter((c) => !c.resolved);
  const resolvedComments = chapter.comments.filter((c) => c.resolved);

  useEffect(() => {
    setTitle(chapter.title);
    setBody(chapter.body);
    setNotes(chapter.notes);
    setDirty(false);
    if (editorRef.current) {
      editorRef.current.innerText = chapter.body;
    }
  }, [chapter.id]);

  useEffect(() => {
    if (!dirty) return;
    const id = setTimeout(async () => {
      const status =
        words === 0 ? "not-started" : words >= chapter.target ? "done" : "in-progress";
      try {
        await updateChapter(project.id, chapter.id, { title, body, notes, words, status });
        setSaveError(false);
      } catch {
        setSaveError(true);
      }
      setDirty(false);
    }, 700);
    return () => clearTimeout(id);
  }, [dirty, title, body, notes, words, project.id, chapter.id, chapter.target, updateChapter]);

  const exec = (cmd: string, value?: string) => {
    document.execCommand(cmd, false, value);
    editorRef.current?.focus();
    onBodyChange();
  };

  const onBodyChange = () => {
    if (editorRef.current) {
      setBody(editorRef.current.innerText);
      setDirty(true);
    }
  };

  const onNotesChange = (v: string) => {
    setNotes(v);
    setDirty(true);
  };

  const handleEditorMouseUp = () => {
    const sel = window.getSelection();
    const text = sel?.toString().trim() ?? "";
    setSelection(text);
    if (text.length > 0) {
      setRightTab("comments");
    }
  };

  const handleAddComment = () => {
    if (!commentText.trim()) return;
    addComment(project.id, chapter.id, {
      anchorText: selection,
      text: commentText.trim(),
    });
    setCommentText("");
    setSelection("");
    setAddingComment(false);
  };

  const downloadDocx = async () => {
    const paragraphs = body.split(/\n+/).filter((l) => l.trim().length > 0);
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              heading: HeadingLevel.HEADING_1,
              alignment: AlignmentType.LEFT,
              children: [new TextRun({ text: title, bold: true })],
            }),
            new Paragraph({ children: [new TextRun("")] }),
            ...paragraphs.map((p) => new Paragraph({ children: [new TextRun(p)] })),
          ],
        },
      ],
    });
    const blob = await Packer.toBlob(doc);
    const safe = title.replace(/[^a-z0-9-_ ]/gi, "").trim() || "chapter";
    saveAs(blob, `${safe}.docx`);
  };

  return (
    <div className="flex h-full flex-1 overflow-hidden">
      {/* ── Editor column ── */}
      <div className="flex flex-1 flex-col overflow-hidden border-r border-border/60">
        {/* Top bar */}
        <div className="flex items-center gap-3 border-b border-border/60 bg-card px-5 py-3">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Chapters</span>
          </button>
          <span className="text-muted-foreground/40">›</span>
          <input
            value={title}
            onChange={(e) => { setTitle(e.target.value); setDirty(true); }}
            className="min-w-0 flex-1 bg-transparent font-serif text-base font-semibold outline-none placeholder:text-muted-foreground"
            placeholder="Chapter title"
          />
          <span className="text-xs text-muted-foreground">{words.toLocaleString()} words</span>
          {saveError && (
            <span className="text-xs text-destructive" title="Save failed — check your connection">
              Not saved
            </span>
          )}
          <span
            className={`h-2 w-2 rounded-full transition-colors ${saveError ? "bg-destructive" : dirty ? "bg-amber-500" : "bg-emerald-500/60"}`}
            title={saveError ? "Save failed" : dirty ? "Saving…" : "Saved"}
          />
        </div>

        {/* Formatting toolbar */}
        <div className="flex items-center gap-1 border-b border-border/60 bg-card/60 px-5 py-2">
          <ToolBtn onClick={() => exec("bold")} label="Bold"><Bold className="h-3.5 w-3.5" /></ToolBtn>
          <ToolBtn onClick={() => exec("italic")} label="Italic"><Italic className="h-3.5 w-3.5" /></ToolBtn>
          <ToolBtn onClick={() => exec("formatBlock", "h2")} label="Heading"><Heading className="h-3.5 w-3.5" /></ToolBtn>
          <ToolBtn onClick={() => exec("formatBlock", "blockquote")} label="Blockquote"><Quote className="h-3.5 w-3.5" /></ToolBtn>
          <span className="mx-2 h-4 w-px bg-border" />
          <button
            onClick={() => { setRightTab("comments"); setAddingComment(true); }}
            disabled={!selection}
            className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-40"
            title={selection ? `Comment on: "${selection.slice(0, 30)}…"` : "Select text to comment"}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            Comment
          </button>
          <div className="ml-auto flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={downloadDocx} className="text-xs text-muted-foreground">
              <Download className="h-3.5 w-3.5" /> Word
            </Button>
          </div>
        </div>

        {/* Writing area */}
        <div className="flex-1 overflow-y-auto bg-background">
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            onInput={onBodyChange}
            onMouseUp={handleEditorMouseUp}
            onKeyUp={handleEditorMouseUp}
            className="mx-auto min-h-full max-w-2xl px-12 py-14 outline-none"
            style={{ fontFamily, fontSize: "18px", lineHeight: 1.9 }}
            data-placeholder="Begin where you left off…"
          />
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="flex w-72 flex-shrink-0 flex-col bg-card/40">
        {/* Tab toggle */}
        <div className="flex border-b border-border/60">
          {(["notes", "comments"] as RightTab[]).map((t) => (
            <button
              key={t}
              onClick={() => setRightTab(t)}
              className={`flex-1 py-3 text-xs font-medium uppercase tracking-wider transition-colors ${
                rightTab === t
                  ? "border-b-2 border-accent text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "notes" ? (
                <span className="flex items-center justify-center gap-1.5"><FileText className="h-3.5 w-3.5" />Notes</span>
              ) : (
                <span className="flex items-center justify-center gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5" />
                  Comments {activeComments.length > 0 && <span className="ml-0.5 rounded-full bg-accent px-1.5 text-[10px] text-accent-foreground">{activeComments.length}</span>}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Notes tab */}
        {rightTab === "notes" && (
          <textarea
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            placeholder="Continuity notes, reminders, things to check…"
            className="flex-1 resize-none border-0 bg-transparent p-5 text-sm leading-relaxed text-foreground outline-none placeholder:text-muted-foreground/60"
          />
        )}

        {/* Comments tab */}
        {rightTab === "comments" && (
          <div className="flex flex-1 flex-col overflow-hidden">
            {/* Add comment area */}
            <div className="border-b border-border/60 p-4">
              {selection && !addingComment && (
                <div className="mb-3 rounded-md bg-accent/10 border border-accent/20 px-3 py-2 text-xs">
                  <p className="text-muted-foreground mb-1">Selected:</p>
                  <p className="italic text-foreground line-clamp-2">"{selection}"</p>
                </div>
              )}
              {addingComment || selection ? (
                <div className="space-y-2">
                  {selection && (
                    <div className="rounded-md bg-accent/10 border border-accent/20 px-3 py-2 text-xs">
                      <p className="text-muted-foreground mb-0.5">On:</p>
                      <p className="italic text-foreground line-clamp-2">"{selection}"</p>
                    </div>
                  )}
                  <textarea
                    autoFocus
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Add a comment…"
                    rows={3}
                    className="w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleAddComment();
                      if (e.key === "Escape") { setAddingComment(false); setSelection(""); setCommentText(""); }
                    }}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleAddComment} disabled={!commentText.trim()} className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90 text-xs">
                      Add comment
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => { setAddingComment(false); setSelection(""); setCommentText(""); }} className="text-xs">
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Select text in the editor, then click <strong>Comment</strong> in the toolbar.</p>
              )}
            </div>

            {/* Comment list */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {activeComments.length === 0 && resolvedComments.length === 0 && (
                <p className="text-center text-xs text-muted-foreground py-6">No comments yet.</p>
              )}
              {activeComments.map((c) => (
                <CommentCard
                  key={c.id}
                  comment={c}
                  onResolve={() => resolveComment(project.id, chapter.id, c.id)}
                  onDelete={() => deleteComment(project.id, chapter.id, c.id)}
                />
              ))}
              {resolvedComments.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Resolved</p>
                  {resolvedComments.map((c) => (
                    <CommentCard
                      key={c.id}
                      comment={c}
                      resolved
                      onDelete={() => deleteComment(project.id, chapter.id, c.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CommentCard({
  comment,
  resolved = false,
  onResolve,
  onDelete,
}: {
  comment: Comment;
  resolved?: boolean;
  onResolve?: () => void;
  onDelete: () => void;
}) {
  return (
    <div className={`rounded-lg border p-3 text-sm ${resolved ? "border-border/40 opacity-60" : "border-border/70 bg-background"}`}>
      {comment.anchorText && (
        <p className="mb-2 rounded bg-amber-50 border-l-2 border-amber-400 pl-2 pr-1 py-1 text-xs italic text-amber-900 line-clamp-2">
          "{comment.anchorText}"
        </p>
      )}
      <p className="text-foreground leading-snug">{comment.text}</p>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground">{timeAgo(comment.createdAt)}</span>
        <div className="flex gap-1">
          {!resolved && onResolve && (
            <button onClick={onResolve} title="Resolve" className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-emerald-600">
              <Check className="h-3 w-3" />
            </button>
          )}
          <button onClick={onDelete} title="Delete" className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-destructive">
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

function ToolBtn({ children, onClick, label }: { children: React.ReactNode; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      title={label}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
    >
      {children}
    </button>
  );
}
