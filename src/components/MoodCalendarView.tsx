import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { type Project, THEME_CONFIGS } from "@/lib/projects-store";

const MOODS = [
  { id:"great", color:"#4A7C3F", label:"Great" },
  { id:"good",  color:"#7AB648", label:"Good" },
  { id:"okay",  color:"#E8A020", label:"Okay" },
  { id:"low",   color:"#C8394A", label:"Low" },
  { id:"hard",  color:"#2E6DA4", label:"Hard day" },
];
const MONTHS=["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

function fmt(d: Date){ return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; }

function getMonthGrid(ref: Date): (Date|null)[] {
  const first=new Date(ref.getFullYear(),ref.getMonth(),1);
  const last=new Date(ref.getFullYear(),ref.getMonth()+1,0);
  const cells: (Date|null)[]= [];
  for(let i=0;i<first.getDay();i++) cells.push(null);
  for(let d=1;d<=last.getDate();d++) cells.push(new Date(ref.getFullYear(),ref.getMonth(),d));
  while(cells.length%7!==0) cells.push(null);
  return cells;
}

export function MoodCalendarView({ project }: { project: Project }) {
  const [ref,setRef]=useState(new Date());
  const accentColor=THEME_CONFIGS[project.theme]?.accent??"#7B5EA7";
  const moodMap: Record<string,string>={};
  project.chapters.forEach(ch=>{ if(ch.mood&&(ch as any).createdAt) moodMap[fmt(new Date((ch as any).createdAt))]=ch.mood; });
  const grid=getMonthGrid(ref);
  const todayStr=fmt(new Date());
  const monthStr=`${ref.getFullYear()}-${String(ref.getMonth()+1).padStart(2,"0")}`;
  const monthEntries=Object.entries(moodMap).filter(([d])=>d.startsWith(monthStr));
  const moodCounts=MOODS.map(m=>({...m,count:monthEntries.filter(([,v])=>v===m.id).length}));

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="border-b border-border/60 px-8 py-5">
        <h1 className="font-serif text-2xl font-semibold tracking-tight">Mood calendar</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">Your emotional landscape — one dot per entry</p>
      </div>
      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="max-w-lg">
          <div className="flex items-center justify-between mb-6">
            <button onClick={()=>setRef(new Date(ref.getFullYear(),ref.getMonth()-1,1))} className="p-1.5 rounded-md text-muted-foreground hover:bg-secondary"><ChevronLeft className="h-4 w-4"/></button>
            <h2 className="font-serif text-xl font-semibold">{MONTHS[ref.getMonth()]} {ref.getFullYear()}</h2>
            <button onClick={()=>setRef(new Date(ref.getFullYear(),ref.getMonth()+1,1))} className="p-1.5 rounded-md text-muted-foreground hover:bg-secondary"><ChevronRight className="h-4 w-4"/></button>
          </div>
          <div className="grid grid-cols-7 mb-2">
            {DAYS.map(d=><div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {grid.map((date,i)=>{
              if(!date) return <div key={i}/>;
              const dateStr=fmt(date);
              const mood=moodMap[dateStr];
              const mc=mood?MOODS.find(m=>m.id===mood):null;
              const isToday=dateStr===todayStr;
              return (
                <div key={dateStr} className="aspect-square flex flex-col items-center justify-center rounded-lg"
                  style={{background:mc?mc.color+"18":"transparent",border:isToday?`2px solid ${accentColor}`:"1px solid transparent"}}>
                  <span className="text-xs text-muted-foreground">{date.getDate()}</span>
                  {mc&&<div className="h-2 w-2 rounded-full mt-0.5" style={{background:mc.color}} title={mc.label}/>}
                </div>
              );
            })}
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            {MOODS.map(m=>(
              <div key={m.id} className="flex items-center gap-1.5">
                <div className="h-3 w-3 rounded-full" style={{background:m.color}}/>
                <span className="text-xs text-muted-foreground">{m.label}</span>
              </div>
            ))}
          </div>
          {monthEntries.length>0&&(
            <div className="mt-6 rounded-xl border border-border/60 bg-card p-4">
              <p className="text-sm font-medium mb-3">{MONTHS[ref.getMonth()]} at a glance</p>
              <div className="space-y-2">
                {moodCounts.filter(m=>m.count>0).map(m=>(
                  <div key={m.id} className="flex items-center gap-3">
                    <div className="h-3 w-3 rounded-full flex-shrink-0" style={{background:m.color}}/>
                    <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
                      <div className="h-full rounded-full" style={{width:`${(m.count/monthEntries.length)*100}%`,background:m.color}}/>
                    </div>
                    <span className="text-xs text-muted-foreground w-20 text-right">{m.label} ({m.count})</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {Object.keys(moodMap).length===0&&<p className="mt-6 text-sm text-muted-foreground italic text-center">No moods logged yet. Open an entry and set your mood — it will appear here.</p>}
        </div>
      </div>
    </div>
  );
}
