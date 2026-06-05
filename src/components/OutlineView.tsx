import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProjects, type Project } from "@/lib/projects-store";

export function OutlineView({ project }: { project: Project }) {
  const { updateProject } = useProjects();
  const items = (project as any).outlineItems ?? [];
  const [editingId, setEditingId] = useState<string | null>(null);

  const save = (u: any[]) => updateProject(project.id, { outlineItems: u } as any);
  const add = (level: number) => save([...items, { id: crypto.randomUUID(), text: "", level, notes: "" }]);
  const update = (id: string, patch: any) => save(items.map((i: any) => i.id===id ? {...i,...patch} : i));
  const remove = (id: string) => save(items.filter((i: any) => i.id!==id));
  const move = (id: string, dir: number) => {
    const idx=items.findIndex((i: any)=>i.id===id);
    if (idx+dir<0||idx+dir>=items.length) return;
    const n=[...items]; [n[idx],n[idx+dir]]=[n[idx+dir],n[idx]]; save(n);
  };
  const indent = (id: string, dir: number) => {
    const item=items.find((i: any)=>i.id===id);
    if (!item) return;
    update(id, { level: Math.max(0,Math.min(2,item.level+dir)) });
  };

  const STYLES = [
    { label:"Section", pl:"pl-0", text:"text-base font-semibold", prefix:"§" },
    { label:"Subsection", pl:"pl-6", text:"text-sm font-medium", prefix:"›" },
    { label:"Point", pl:"pl-12", text:"text-sm", prefix:"·" },
  ];

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-border/60 px-8 py-5">
        <div>
          <h1 className="font-serif text-2xl font-semibold tracking-tight">Outline</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">{items.length} items — build your structure before you write</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => add(1)}>+ Subsection</Button>
          <Button size="sm" onClick={() => add(0)} className="bg-accent text-accent-foreground hover:bg-accent/90">+ Section</Button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-8 py-6">
        {items.length === 0 && (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <p className="font-serif text-lg text-foreground/60">No outline yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Add a section to start building your structure.</p>
          </div>
        )}
        <div className="space-y-1 max-w-2xl">
          {items.map((item: any) => {
            const s=STYLES[item.level]??STYLES[0];
            return (
              <div key={item.id} className={`group flex items-start gap-2 rounded-lg px-3 py-2 hover:bg-secondary/40 transition-colors ${s.pl}`}>
                <span className="mt-0.5 text-muted-foreground/50 text-sm flex-shrink-0 w-4">{s.prefix}</span>
                <div className="flex-1 min-w-0">
                  {editingId===item.id ? (
                    <div className="space-y-2">
                      <Input autoFocus value={item.text} onChange={e=>update(item.id,{text:e.target.value})} onKeyDown={e=>{if(e.key==="Escape")setEditingId(null)}} className={`${s.text} border-0 border-b rounded-none px-0 focus-visible:ring-0 bg-transparent`} placeholder={`${s.label} title…`} />
                      <Input value={item.notes} onChange={e=>update(item.id,{notes:e.target.value})} onBlur={()=>setEditingId(null)} className="text-xs border-0 border-b rounded-none px-0 focus-visible:ring-0 bg-transparent text-muted-foreground" placeholder="Notes (optional)…" />
                    </div>
                  ) : (
                    <div onClick={()=>setEditingId(item.id)} className="cursor-text">
                      <p className={`${s.text} text-foreground`}>{item.text||<span className="text-muted-foreground/40 italic">Untitled {s.label.toLowerCase()}</span>}</p>
                      {item.notes&&<p className="text-xs text-muted-foreground mt-0.5">{item.notes}</p>}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  <button onClick={()=>indent(item.id,-1)} className="p-1 text-muted-foreground hover:text-foreground rounded text-xs" title="Outdent">←</button>
                  <button onClick={()=>indent(item.id,1)} className="p-1 text-muted-foreground hover:text-foreground rounded text-xs" title="Indent">→</button>
                  <button onClick={()=>move(item.id,-1)} className="p-1 text-muted-foreground hover:text-foreground rounded text-xs" title="Move up">↑</button>
                  <button onClick={()=>move(item.id,1)} className="p-1 text-muted-foreground hover:text-foreground rounded text-xs" title="Move down">↓</button>
                  <button onClick={()=>remove(item.id)} className="p-1 text-muted-foreground hover:text-destructive rounded"><Trash2 className="h-3 w-3" /></button>
                </div>
              </div>
            );
          })}
        </div>
        {items.length>0&&(
          <div className="mt-4 flex gap-4 max-w-2xl">
            <button onClick={()=>add(0)} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"><Plus className="h-3 w-3"/>Add section</button>
            <button onClick={()=>add(1)} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"><Plus className="h-3 w-3"/>Add subsection</button>
            <button onClick={()=>add(2)} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"><Plus className="h-3 w-3"/>Add point</button>
          </div>
        )}
      </div>
    </div>
  );
}
