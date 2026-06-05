import { useState } from "react";
import { Plus, Trash2, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useProjects, type Citation, type Project } from "@/lib/projects-store";

// ── Citation formatters ──────────────────────────────────────────────────────

function formatAPA(c: Citation): string {
  const authors = c.authors || "Unknown";
  const year = c.year ? `(${c.year})` : "";
  const title = c.title || "Untitled";
  const journal = c.journal ? `. ${c.journal}` : "";
  const pages = c.pages ? `, ${c.pages}` : "";
  const doi = c.doi
    ? `. https://doi.org/${c.doi}`
    : c.url
    ? `. ${c.url}`
    : "";
  return `${authors} ${year}. ${title}${journal}${pages}${doi}`;
}

function formatMLA(c: Citation): string {
  const authors = c.authors || "Unknown";
  const title = `"${c.title || "Untitled"}"`;
  const journal = c.journal ? `${c.journal},` : "";
  const year = c.year || "";
  const pages = c.pages ? `pp. ${c.pages}.` : "";
  return `${authors}. ${title} ${journal} ${year}${pages ? ", " + pages : "."}`.trim();
}

function formatHarvard(c: Citation): string {
  const authors = c.authors || "Unknown";
  const year = c.year ? `(${c.year})` : "";
  const title = `'${c.title || "Untitled"}'`;
  const journal = c.journal ? `, ${c.journal}` : "";
  const pages = c.pages ? `, pp.${c.pages}` : "";
  return `${authors} ${year} ${title}${journal}${pages}.`;
}

function formatChicago(c: Citation): string {
  const authors = c.authors || "Unknown";
  const title = `"${c.title || "Untitled"}"`;
  const journal = c.journal ? `${c.journal}` : "";
  const year = c.year || "";
  const pages = c.pages ? `: ${c.pages}` : "";
  return `${authors}. ${title} ${journal}${year ? " (" + year + ")" : ""}${pages}.`;
}

function formatCitation(c: Citation): string {
  switch (c.style) {
    case "apa":
      return formatAPA(c);
    case "mla":
      return formatMLA(c);
    case "harvard":
      return formatHarvard(c);
    case "chicago":
      return formatChicago(c);
    default:
      return formatAPA(c);
  }
}

// ── Component ────────────────────────────────────────────────────────────────

type FormState = {
  authors: string;
  title: string;
  year: string;
  journal: string;
  urlOrDoi: string;
  pages: string;
  style: Citation["style"];
};

const EMPTY_FORM: FormState = {
  authors: "",
  title: "",
  year: "",
  journal: "",
  urlOrDoi: "",
  pages: "",
  style: "apa",
};

export function CitationsView({ project }: { project: Project }) {
  const { addCitation, deleteCitation } = useProjects();
  const citations = project.citations ?? [];
  const [showForm, setShowForm] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const set = (field: keyof FormState, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  const handleAdd = () => {
    if (!form.title.trim()) return;
    const isDoi = form.urlOrDoi.trim().startsWith("10.");
    addCitation(project.id, {
      authors: form.authors,
      title: form.title,
      year: form.year,
      journal: form.journal,
      doi: isDoi ? form.urlOrDoi.trim() : undefined,
      url: !isDoi && form.urlOrDoi.trim() ? form.urlOrDoi.trim() : undefined,
      pages: form.pages,
      style: form.style,
    });
    setForm(EMPTY_FORM);
    setShowForm(false);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/60 px-8 py-5">
        <div>
          <h1 className="font-serif text-2xl font-semibold tracking-tight">
            Citations
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {citations.length} source{citations.length !== 1 ? "s" : ""} —
            hover a citation to copy it
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => setShowForm((v) => !v)}
          className="bg-accent text-accent-foreground hover:bg-accent/90"
        >
          <Plus className="h-4 w-4" />
          Add source
        </Button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="border-b border-border/60 bg-card/40 p-6">
          <h2 className="mb-4 font-serif text-lg font-semibold">New source</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1.5">
              <Label>Author(s)</Label>
              <Input
                placeholder="Smith, J., & Jones, A."
                value={form.authors}
                onChange={(e) => set("authors", e.target.value)}
              />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Title *</Label>
              <Input
                placeholder="Title of the work"
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Year</Label>
              <Input
                placeholder="2024"
                value={form.year}
                onChange={(e) => set("year", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Journal / Publisher</Label>
              <Input
                placeholder="Nature, Oxford UP…"
                value={form.journal}
                onChange={(e) => set("journal", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Pages</Label>
              <Input
                placeholder="12–34"
                value={form.pages}
                onChange={(e) => set("pages", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>DOI or URL</Label>
              <Input
                placeholder="10.1000/xyz or https://…"
                value={form.urlOrDoi}
                onChange={(e) => set("urlOrDoi", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Citation style</Label>
              <Select
                value={form.style}
                onValueChange={(v) => set("style", v as Citation["style"])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="apa">APA 7th</SelectItem>
                  <SelectItem value="mla">MLA 9th</SelectItem>
                  <SelectItem value="harvard">Harvard</SelectItem>
                  <SelectItem value="chicago">Chicago 17th</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAdd}
              disabled={!form.title.trim()}
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              Save source
            </Button>
          </div>
        </div>
      )}

      {/* Citation list */}
      <div className="flex-1 overflow-y-auto p-6 space-y-3">
        {citations.length === 0 && !showForm && (
          <div className="flex h-40 flex-col items-center justify-center text-sm text-muted-foreground">
            <p>No sources yet.</p>
            <p className="mt-1 text-xs">Add your first source above.</p>
          </div>
        )}
        {citations.map((c) => {
          const formatted = formatCitation(c);
          return (
            <div
              key={c.id}
              className="group rounded-xl border border-border/60 bg-card p-4 transition-colors hover:border-accent/40"
            >
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground line-clamp-1">
                    {c.title}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                    {formatted}
                  </p>
                  <span className="mt-2 inline-block rounded-full bg-secondary px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                    {c.style.toUpperCase()}
                  </span>
                </div>
                <div className="flex flex-shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    onClick={() => copyToClipboard(formatted, c.id)}
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
                    title="Copy citation"
                  >
                    {copiedId === c.id ? (
                      <Check className="h-3.5 w-3.5 text-green-600" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                  <button
                    onClick={() => deleteCitation(project.id, c.id)}
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-destructive"
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
