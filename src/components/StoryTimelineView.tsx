import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProjects, THEME_CONFIGS, type Project } from "@/lib/projects-store";

const TYPE_COLORS = {
  past:    { bg: "#E8ECF2", text: "#4A6090", label: "Before the story" },
  present: { bg: "#FDE8D2", text: "#B85A10", label: "During the story"  },
  future:  { bg: "#EEF6EC", text: "#2A4A24", label: "After the story"   },
};

export function StoryTimelineView({ project }: { project: Project }) {
  const { updateProject } = useProjects();
  const accentColor = THEME_CONFIGS[project.theme]?.accent ?? "#F47920";
  const events = (project as any).timelineEvents ?? [];
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState("present");
  const [editingId, setEditingId] = useState<string | null>(null);

  const save = (updated: any[]) => updateProject(project.id, { timelineEvents: updated } as any);

  const addEvent = () => {
    if (!newTitle.trim()) return;
    save([...events, { id: crypto.randomUUID(), title: newTitle.trim(), date: "", description: "", characters: "", chapterRef: "", type: newType }]);
    setNewTitle(""); setShowAdd(false);
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-border/60 px-8 py-5">
        <div>
          <h1 className="font-serif text-2xl font-semibold tracking-tight">Story timeline</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">{events.length} {events.length === 1 ? "event" : "events"} — when things happen in your world</p>
        </div>
        <Button size="sm" onClick={() => setShowAdd(v => !v)} className="bg-accent text-accent-foreground hover:bg-accent/90"><Plus className="h-4 w-4" /> Add event</Button>
      </div>
      <div className="flex-1 overflow-y-auto px-8 py-6">
        {showAdd && (
          <div className="mb-6 rounded-xl border border-border/60 bg-card p-4 space-y-3">
            <Input autoFocus placeholder="What happened?" value={newTitle} onChange={e => setNewTitle(e.target.value)} onKeyDown={e => e.key === "Enter" && addEvent()} />
            <select value={newType} onChange={e => setNewType(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent">
              <option value="past">Before the story</option>
              <option value="present">During the story</option>
              <option value="future">After the story</option>
            </select>
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" size="sm" onClick={() => { setShowAdd(false); setNewTitle(""); }}>Cancel</Button>
              <Button size="sm" disabled={!newTitle.trim()} onClick={addEvent} className="bg-accent text-accent-foreground hover:bg-accent/90">Add</Button>
            </div>
          </div>
        )}
        {events.length === 0 && !showAdd && (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <p className="font-serif text-lg text-foreground/60">No events yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Add the events that shape your story — before, during, and after.</p>
          </div>
        )}
        {events.map((event: any) => {
          const tc = TYPE_COLORS[event.type as keyof typeof TYPE_COLORS] ?? TYPE_COLORS.present;
          return (
            <div key={event.id} className="group flex gap-4 mb-4">
              <div className="flex flex-col items-center pt-1">
                <div className="h-3 w-3 rounded-full border-2 flex-shrink-0" style={{ borderColor: accentColor, background: "#FDFAF6" }} />
                <div className="flex-1 w-px mt-1" style={{ background: accentColor + "30" }} />
              </div>
              <div className="flex-1 rounded-xl border border-border/60 bg-card overflow-hidden">
                {editingId === event.id ? (
                  <div className="p-4 space-y-3">
                    <Input value={event.title} onChange={e => save(events.map((x: any) => x.id === event.id ? { ...x, title: e.target.value } : x))} placeholder="Event title" />
                    <Input value={event.date} onChange={e => save(events.map((x: any) => x.id === event.id ? { ...x, date: e.target.value } : x))} placeholder="In-world date (e.g. Year 3, midsummer)" />
                    <textarea rows={3} value={event.description} onChange={e => save(events.map((x: any) => x.id === event.id ? { ...x, description: e.target.value } : x))} placeholder="What happened? Who was involved?" className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent" />
                    <div className="grid grid-cols-2 gap-3">
                      <Input value={event.characters} onChange={e => save(events.map((x: any) => x.id === event.id ? { ...x, characters: e.target.value } : x))} placeholder="Characters involved" />
                      <Input value={event.chapterRef} onChange={e => save(events.map((x: any) => x.id === event.id ? { ...x, chapterRef: e.target.value } : x))} placeholder="Revealed in chapter" />
                    </div>
                    <select value={event.type} onChange={e => save(events.map((x: any) => x.id === event.id ? { ...x, type: e.target.value } : x))} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent">
                      <option value="past">Before the story</option>
                      <option value="present">During the story</option>
                      <option value="future">After the story</option>
                    </select>
                    <Button size="sm" onClick={() => setEditingId(null)} className="bg-accent text-accent-foreground hover:bg-accent/90">Done</Button>
                  </div>
                ) : (
                  <div className="p-4 cursor-pointer" onClick={() => setEditingId(event.id)}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-medium text-sm">{event.title || "Untitled event"}</h3>
                        {event.date && <span className="text-xs text-muted-foreground">{event.date}</span>}
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: tc.bg, color: tc.text }}>{tc.label}</span>
                      </div>
                      <div className="flex gap-0.5">
                    <button onClick={e => { e.stopPropagation(); const i=events.findIndex((x:any)=>x.id===event.id); if(i>0){const a=[...events];[a[i-1],a[i]]=[a[i],a[i-1]];save(a);} }} className="opacity-0 group-hover:opacity-100 p-0.5 text-muted-foreground hover:text-foreground" title="Move up">↑</button>
                    <button onClick={e => { e.stopPropagation(); const i=events.findIndex((x:any)=>x.id===event.id); if(i<events.length-1){const a=[...events];[a[i],a[i+1]]=[a[i+1],a[i]];save(a);} }} className="opacity-0 group-hover:opacity-100 p-0.5 text-muted-foreground hover:text-foreground" title="Move down">↓</button>
                    <button onClick={e => { e.stopPropagation(); save(events.filter((x:any)=>x.id!==event.id)); }} className="opacity-0 group-hover:opacity-100 p-0.5 text-muted-foreground hover:text-destructive" title="Delete"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                    </div>
                    {event.description && <p className="mt-1.5 text-sm text-muted-foreground line-clamp-2">{event.description}</p>}
                    {(event.characters || event.chapterRef) && (
                      <div className="mt-2 flex gap-3 text-xs text-muted-foreground/70">
                        {event.characters && <span>Characters: {event.characters}</span>}
                        {event.chapterRef && <span>· {event.chapterRef}</span>}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
