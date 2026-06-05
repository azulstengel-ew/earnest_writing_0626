import { useState } from "react";
import { Plus, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProjects, type Project, THEME_CONFIGS } from "@/lib/projects-store";

const PLATFORMS=["Instagram","TikTok","LinkedIn","X / Twitter","Threads","YouTube","Facebook"];
const STATUS=["Draft","Ready","Scheduled","Live","Archived"];
const MONTHS=["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const PC: Record<string,string>={Instagram:"#E1306C",TikTok:"#010101",LinkedIn:"#0077B5","X / Twitter":"#1DA1F2",Threads:"#000000",YouTube:"#FF0000",Facebook:"#1877F2"};

type Post={id:string;title:string;platform:string;status:string;scheduledDate:string;notes:string;};

function fmt(d:Date){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;}
function getGrid(ref:Date):(Date|null)[]{
  const first=new Date(ref.getFullYear(),ref.getMonth(),1);
  const last=new Date(ref.getFullYear(),ref.getMonth()+1,0);
  const cells:(Date|null)[]=[];
  for(let i=0;i<first.getDay();i++)cells.push(null);
  for(let d=1;d<=last.getDate();d++)cells.push(new Date(ref.getFullYear(),ref.getMonth(),d));
  while(cells.length%7!==0)cells.push(null);
  return cells;
}

export function ContentCalendarView({ project }: { project: Project }) {
  const { updateProject }=useProjects();
  const ac=THEME_CONFIGS[project.theme]?.accent??"#00C2A8";
  const posts:Post[]=(project as any).contentPosts??[];
  const [ref,setRef]=useState(new Date());
  const [showAdd,setShowAdd]=useState(false);
  const [sel,setSel]=useState<string|null>(null);
  const [editId,setEditId]=useState<string|null>(null);
  const [form,setForm]=useState({title:"",platform:"Instagram",status:"Draft",scheduledDate:fmt(new Date()),notes:""});

  const save=(u:Post[])=>updateProject(project.id,{contentPosts:u} as any);
  const addPost=()=>{
    if(!form.title.trim())return;
    save([...posts,{...form,id:crypto.randomUUID()}]);
    setForm({title:"",platform:"Instagram",status:"Draft",scheduledDate:fmt(new Date()),notes:""});
    setShowAdd(false);
  };

  const grid=getGrid(ref);
  const todayStr=fmt(new Date());
  const pbd:Record<string,Post[]>={};
  posts.forEach(p=>{if(!pbd[p.scheduledDate])pbd[p.scheduledDate]=[];pbd[p.scheduledDate].push(p);});

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-border/60 px-8 py-5">
        <div>
          <h1 className="font-serif text-2xl font-semibold tracking-tight">Content calendar</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">{posts.length} posts planned</p>
        </div>
        <Button size="sm" onClick={()=>setShowAdd(v=>!v)} className="bg-accent text-accent-foreground hover:bg-accent/90"><Plus className="h-4 w-4"/> Schedule post</Button>
      </div>
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto px-8 py-6">
          {showAdd&&(
            <div className="mb-6 rounded-xl border border-border/60 bg-card p-4 space-y-3 max-w-lg">
              <Input autoFocus placeholder="Post title or topic" value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))}/>
              <div className="grid grid-cols-2 gap-3">
                <select value={form.platform} onChange={e=>setForm(f=>({...f,platform:e.target.value}))} className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent">{PLATFORMS.map(p=><option key={p}>{p}</option>)}</select>
                <select value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))} className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent">{STATUS.map(s=><option key={s}>{s}</option>)}</select>
              </div>
              <Input type="date" value={form.scheduledDate} onChange={e=>setForm(f=>({...f,scheduledDate:e.target.value}))}/>
              <Input placeholder="Notes (optional)" value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))}/>
              <div className="flex gap-2 justify-end">
                <Button variant="ghost" size="sm" onClick={()=>setShowAdd(false)}>Cancel</Button>
                <Button size="sm" disabled={!form.title.trim()} onClick={addPost} className="bg-accent text-accent-foreground hover:bg-accent/90">Save</Button>
              </div>
            </div>
          )}
          <div className="flex items-center justify-between mb-4 max-w-lg">
            <button onClick={()=>setRef(new Date(ref.getFullYear(),ref.getMonth()-1,1))} className="p-1.5 rounded-md text-muted-foreground hover:bg-secondary"><ChevronLeft className="h-4 w-4"/></button>
            <h2 className="font-serif text-lg font-semibold">{MONTHS[ref.getMonth()]} {ref.getFullYear()}</h2>
            <button onClick={()=>setRef(new Date(ref.getFullYear(),ref.getMonth()+1,1))} className="p-1.5 rounded-md text-muted-foreground hover:bg-secondary"><ChevronRight className="h-4 w-4"/></button>
          </div>
          <div className="grid grid-cols-7 max-w-lg mb-1">{DAYS.map(d=><div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">{d}</div>)}</div>
          <div className="grid grid-cols-7 gap-1 max-w-lg">
            {grid.map((date,i)=>{
              if(!date)return<div key={i} className="aspect-square"/>;
              const ds=fmt(date);
              const dp=pbd[ds]??[];
              const isToday=ds===todayStr;
              const isSel=ds===sel;
              return(
                <div key={ds} onClick={()=>setSel(isSel?null:ds)}
                  className="aspect-square flex flex-col items-start justify-start p-1 rounded-lg cursor-pointer hover:bg-secondary/60 transition-colors"
                  style={{border:isSel?`2px solid ${ac}`:isToday?`1px solid ${ac}50`:"1px solid transparent",background:isSel?ac+"10":undefined}}>
                  <span className="text-xs text-muted-foreground">{date.getDate()}</span>
                  <div className="flex flex-wrap gap-0.5 mt-0.5">
                    {dp.slice(0,3).map(p=><div key={p.id} className="h-2 w-2 rounded-full" style={{background:PC[p.platform]??ac}} title={p.platform}/>)}
                    {dp.length>3&&<span className="text-[8px] text-muted-foreground">+{dp.length-3}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        {sel&&(
          <div className="w-72 flex-shrink-0 border-l border-border/60 overflow-y-auto p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-sm">{new Date(sel+"T12:00").toLocaleDateString(undefined,{weekday:"long",month:"long",day:"numeric"})}</h3>
              <button onClick={()=>setSel(null)} className="text-muted-foreground hover:text-foreground text-xs">✕</button>
            </div>
            {(pbd[sel]??[]).length===0&&<p className="text-xs text-muted-foreground italic">No posts scheduled.</p>}
            {(pbd[sel]??[]).map(post=>(
              <div key={post.id} className="group rounded-lg border border-border/60 bg-card p-3 mb-2">
                {editId===post.id?(
                  <div className="space-y-2">
                    <Input value={post.title} onChange={e=>save(posts.map(p=>p.id===post.id?{...p,title:e.target.value}:p))} className="text-sm"/>
                    <select value={post.status} onChange={e=>save(posts.map(p=>p.id===post.id?{...p,status:e.target.value}:p))} className="w-full rounded border border-border bg-background px-2 py-1 text-xs outline-none">{STATUS.map(s=><option key={s}>{s}</option>)}</select>
                    <Button size="sm" onClick={()=>setEditId(null)} className="w-full bg-accent text-accent-foreground hover:bg-accent/90 text-xs">Done</Button>
                  </div>
                ):(
                  <div onClick={()=>setEditId(post.id)} className="cursor-pointer">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="h-2.5 w-2.5 rounded-full" style={{background:PC[post.platform]??ac}}/>
                      <span className="text-xs font-medium text-muted-foreground">{post.platform}</span>
                      <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-secondary text-muted-foreground">{post.status}</span>
                      <button onClick={e=>{e.stopPropagation();save(posts.filter(p=>p.id!==post.id));}} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"><Trash2 className="h-3 w-3"/></button>
                    </div>
                    <p className="text-sm">{post.title}</p>
                    {post.notes&&<p className="text-xs text-muted-foreground mt-1">{post.notes}</p>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
