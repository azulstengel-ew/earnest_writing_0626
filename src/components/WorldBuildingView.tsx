import { useState } from "react";
import { Plus, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProjects, type Project } from "@/lib/projects-store";

const CATEGORIES = [
  { id: "world", label: "The world", description: "Geography, history, cosmology, rules of reality" },
  { id: "magic", label: "Magic & power systems", description: "How magic or technology works, its rules and limits" },
  { id: "factions", label: "Factions & groups", description: "Nations, organisations, guilds, families" },
  { id: "culture", label: "Culture & society", description: "Customs, religion, language, food, art" },
  { id: "history", label: "History & lore", description: "Events that shaped the world before the story begins" },
  { id: "other", label: "Other", description: "Anything that doesn't fit elsewhere" },
];

export function WorldBuildingView({ project }: { project: Project }) {
  const { updateProject } = useProjects();
  const entries = (project as any).worldEntries ?? [];
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddFor, setShowAddFor] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newBody, setNewBody] = useState("");

  const save = (updated: any[]) => updateProject(project.id, { worldEntries: updated } as any);
  const toggle = (id: string) => setExpanded(x => ({ ...x, [id]: x[id] === false ? true : false }));

  const addEntry = (category: string) => {
    if (!newName.trim()) return;
    save([...entries, { id: crypto.randomUUID(), category, name: newName.trim(), body: newBody.trim(), createdAt: new Date().toISOString() }]);
    setNewName(""); setNewBody(""); setShowAddFor(null);
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-border/60 px-8 py-5">
        <div>
          <h1 className="font-serif text-2xl font-semibold tracking-tight">World-building bible</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">{entries.length} {entries.length === 1 ? "entry" : "entries"} — the rules, places, and lore of your world</p>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-4">
        {CATEGORIES.map(cat => {
          const catEntries = entries.filter((e: any) => e.category === cat.id);
          const isOpen = expanded[cat.id] !== false;
          return (
            <div key={cat.id} className="rounded-xl border border-border/60 overflow-hidden">
              <button onClick={() => toggle(cat.id)} className="w-full flex items-center justify-between px-5 py-4 bg-card hover:bg-secondary/40 transition-colors text-left">
                <div>
                  <span className="font-medium text-foreground text-sm">{cat.label}</span>
                  <span className="ml-2 text-xs text-muted-foreground">{catEntries.length > 0 ? `${catEntries.length} entries` : cat.description}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={e => { e.stopPropagation(); setShowAddFor(showAddFor === cat.id ? null : cat.id); }} className="rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"><Plus className="h-3.5 w-3.5" /></button>
                  {isOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                </div>
              </button>
              {isOpen && (
                <div className="divide-y divide-border/40">
                  {showAddFor === cat.id && (
                    <div className="px-5 py-4 bg-secondary/20 space-y-3">
                      <Input autoFocus placeholder="Name (e.g. The Ashwood Forest)" value={newName} onChange={e => setNewName(e.target.value)} />
                      <textarea rows={3} placeholder="Describe it…" value={newBody} onChange={e => setNewBody(e.target.value)} className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent" />
                      <div className="flex gap-2 justify-end">
                        <Button variant="ghost" size="sm" onClick={() => { setShowAddFor(null); setNewName(""); setNewBody(""); }}>Cancel</Button>
                        <Button size="sm" disabled={!newName.trim()} onClick={() => addEntry(cat.id)} className="bg-accent text-accent-foreground hover:bg-accent/90">Add</Button>
                      </div>
                    </div>
                  )}
                  {catEntries.length === 0 && showAddFor !== cat.id && <div className="px-5 py-4 text-sm text-muted-foreground italic">Nothing here yet. Click + to add.</div>}
                  {catEntries.map((entry: any) => (
                    <div key={entry.id} className="px-5 py-4 group cursor-pointer" onClick={() => setEditingId(editingId === entry.id ? null : entry.id)}>
                      {editingId === entry.id ? (
                        <div className="space-y-2" onClick={e => e.stopPropagation()}>
                          <Input value={entry.name} onChange={e => save(entries.map((x: any) => x.id === entry.id ? { ...x, name: e.target.value } : x))} />
                          <textarea rows={4} value={entry.body} onChange={e => save(entries.map((x: any) => x.id === entry.id ? { ...x, body: e.target.value } : x))} className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent" />
                          <Button size="sm" onClick={() => setEditingId(null)} className="bg-accent text-accent-foreground hover:bg-accent/90">Done</Button>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-sm text-foreground">{entry.name}</p>
                            {entry.body ? <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{entry.body}</p> : <p className="mt-1 text-xs text-muted-foreground/50 italic">Click to add description…</p>}
                          </div>
                          <button onClick={e => { e.stopPropagation(); save(entries.filter((x: any) => x.id !== entry.id)); }} className="opacity-0 group-hover:opacity-100 p-0.5 text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
