import { useState } from "react";
import { Plus, ChevronLeft, ChevronRight, CalendarDays, Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useProjects, type Project, type CalendarEvent } from "@/lib/projects-store";

/* ── helpers ── */
function fmt(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function parseDate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}
function today(): string { return fmt(new Date()); }
function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}
function startOfWeek(date: Date): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  return d;
}
function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function getMonthGrid(ref: Date): (Date | null)[] {
  const first = startOfMonth(ref);
  const last = new Date(ref.getFullYear(), ref.getMonth() + 1, 0);
  const cells: (Date | null)[] = [];
  for (let i = 0; i < first.getDay(); i++) cells.push(null);
  for (let d = 1; d <= last.getDate(); d++) cells.push(new Date(ref.getFullYear(), ref.getMonth(), d));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function getWeekDays(ref: Date): Date[] {
  const sw = startOfWeek(ref);
  return Array.from({ length: 7 }, (_, i) => addDays(sw, i));
}

const DAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

type EventStatus = "upcoming" | "today" | "complete" | "missed" | "met" | "overdue";

function eventStatus(ev: CalendarEvent, chapters: Project["chapters"]): EventStatus {
  const t = today();
  if (ev.type === "session") {
    if (ev.completed) return "complete";
    if (ev.date < t) return "missed";
    if (ev.date === t) return "today";
    return "upcoming";
  } else {
    const ch = chapters.find((c) => c.id === ev.chapterId);
    if (ch?.status === "done") return "met";
    if (ev.date < t) return "overdue";
    if (ev.date === t) return "today";
    return "upcoming";
  }
}

function statusStyles(status: EventStatus, type: CalendarEventType): string {
  if (type === "session") {
    switch (status) {
      case "complete": return "bg-green-500 text-white";
      case "missed": return "bg-orange-200 text-orange-700 line-through opacity-60";
      case "today": return "bg-accent text-accent-foreground ring-2 ring-accent/40";
      default: return "bg-accent/80 text-accent-foreground";
    }
  } else {
    switch (status) {
      case "met": return "bg-green-600 text-white";
      case "overdue": return "bg-red-600 text-white";
      case "today": return "bg-[#1B2A4A] text-white ring-2 ring-[#1B2A4A]/40";
      default: return "bg-[#1B2A4A]/80 text-white";
    }
  }
}

function statusIcon(status: EventStatus): string {
  switch (status) {
    case "complete": case "met": return "✓ ";
    case "missed": return "× ";
    case "overdue": return "⚠ ";
    default: return "";
  }
}

type CalendarEventType = "session" | "deadline";

/* ── ICS export ── */
function exportICS(events: CalendarEvent[], chapters: Project["chapters"], projectTitle: string) {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Earnest Writing//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];
  for (const ev of events) {
    const d = parseDate(ev.date);
    const nd = addDays(d, 1);
    const dtStart = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
    const dtEnd = `${nd.getFullYear()}${String(nd.getMonth() + 1).padStart(2, "0")}${String(nd.getDate()).padStart(2, "0")}`;
    const ch = chapters.find((c) => c.id === ev.chapterId);
    const summary = ev.type === "session"
      ? `Writing session${ev.targetWords ? ` — ${ev.targetWords} words` : ""}`
      : `Deadline: ${ch?.title ?? "Chapter"}`;
    lines.push(
      "BEGIN:VEVENT",
      `DTSTART;VALUE=DATE:${dtStart}`,
      `DTEND;VALUE=DATE:${dtEnd}`,
      `SUMMARY:${summary}`,
      `UID:${ev.id}@earnest.writing`,
      "STATUS:CONFIRMED",
      "END:VEVENT",
    );
  }
  lines.push("END:VCALENDAR");
  const blob = new Blob([lines.join("\r\n")], { type: "text/calendar" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${projectTitle.replace(/\s+/g, "-")}-calendar.ics`;
  a.click();
  URL.revokeObjectURL(url);
}

/* ── Main component ── */
export function PlanningView({ project }: { project: Project }) {
  const { createEvent, updateEvent, deleteEvent } = useProjects();
  const [viewMode, setViewMode] = useState<"month" | "week">("month");
  const [refDate, setRefDate] = useState(new Date());
  const [addingFor, setAddingFor] = useState<string | null>(null);
  const [addType, setAddType] = useState<CalendarEventType | null>(null);
  const [targetWords, setTargetWords] = useState("500");
  const [chapterId, setChapterId] = useState("");

  const monthGrid = getMonthGrid(refDate);
  const weekDays = getWeekDays(refDate);

  const eventsForDay = (date: string) => project.events.filter((e) => e.date === date);

  const navPrev = () => {
    if (viewMode === "month") setRefDate(new Date(refDate.getFullYear(), refDate.getMonth() - 1, 1));
    else setRefDate(addDays(refDate, -7));
  };
  const navNext = () => {
    if (viewMode === "month") setRefDate(new Date(refDate.getFullYear(), refDate.getMonth() + 1, 1));
    else setRefDate(addDays(refDate, 7));
  };
  const navToday = () => setRefDate(new Date());

  const headerLabel = viewMode === "month"
    ? `${MONTHS[refDate.getMonth()]} ${refDate.getFullYear()}`
    : (() => {
        const sw = startOfWeek(refDate);
        const ew = addDays(sw, 6);
        return `${sw.getDate()} ${MONTHS[sw.getMonth()].slice(0, 3)} – ${ew.getDate()} ${MONTHS[ew.getMonth()].slice(0, 3)} ${ew.getFullYear()}`;
      })();

  const upcomingEvents = project.events
    .filter((e) => e.date >= today() && parseDate(e.date) <= addDays(new Date(), 14))
    .sort((a, b) => a.date.localeCompare(b.date));

  const handleAddEvent = () => {
    if (!addingFor || !addType) return;
    if (addType === "session") {
      createEvent(project.id, { type: "session", date: addingFor, targetWords: Number(targetWords) || 500 });
    } else {
      createEvent(project.id, { type: "deadline", date: addingFor, chapterId: chapterId || undefined });
    }
    setAddingFor(null);
    setAddType(null);
    setTargetWords("500");
    setChapterId("");
  };

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* ── Main calendar area ── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 border-b border-border/60 px-6 py-4">
          <h1 className="font-serif text-xl font-semibold">Planning</h1>

          {/* Month / week nav */}
          <div className="flex items-center gap-1 rounded-lg border border-border bg-card px-1 py-1">
            <button onClick={navPrev} className="rounded p-1 text-muted-foreground hover:text-foreground">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="min-w-[180px] text-center text-sm font-medium">{headerLabel}</span>
            <button onClick={navNext} className="rounded p-1 text-muted-foreground hover:text-foreground">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <Button onClick={navToday} variant="outline" size="sm" className="h-8 text-xs">Today</Button>

          {/* View toggle */}
          <div className="flex rounded-lg border border-border bg-card p-0.5">
            {(["month", "week"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setViewMode(v)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors ${viewMode === v ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                {v}
              </button>
            ))}
          </div>

          {/* Export */}
          <Button
            onClick={() => exportICS(project.events, project.chapters, project.title)}
            variant="outline"
            size="sm"
            className="ml-auto h-8 gap-1.5 text-xs"
          >
            <Download className="h-3.5 w-3.5" /> Export .ics
          </Button>
        </div>

        {/* Calendar grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {viewMode === "month" ? (
            <MonthView
              grid={monthGrid}
              eventsForDay={eventsForDay}
              chapters={project.chapters}
              onClickDay={(d) => setAddingFor(d)}
              onDeleteEvent={(id) => deleteEvent(project.id, id)}
              onToggleComplete={(ev) => updateEvent(project.id, ev.id, { completed: !ev.completed })}
            />
          ) : (
            <WeekView
              days={weekDays}
              eventsForDay={eventsForDay}
              chapters={project.chapters}
              weeklyTarget={project.weeklyWordTarget}
              onClickDay={(d) => setAddingFor(d)}
              onDeleteEvent={(id) => deleteEvent(project.id, id)}
              onToggleComplete={(ev) => updateEvent(project.id, ev.id, { completed: !ev.completed })}
            />
          )}
        </div>
      </div>

      {/* ── Right panel: upcoming 14 days ── */}
      <aside className="w-64 flex-shrink-0 border-l border-border/60 bg-card/40 p-4 overflow-y-auto">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Next 14 days</h2>
        {upcomingEvents.length === 0 ? (
          <p className="text-xs text-muted-foreground">Nothing planned yet. Click any date to add a session or deadline.</p>
        ) : (
          <div className="space-y-2">
            {upcomingEvents.map((ev) => {
              const ch = project.chapters.find((c) => c.id === ev.chapterId);
              const d = parseDate(ev.date);
              const status = eventStatus(ev, project.chapters);
              return (
                <div key={ev.id} className="rounded-lg border border-border/60 bg-card p-3">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    {DAYS_SHORT[d.getDay()]}, {MONTHS[d.getMonth()].slice(0, 3)} {d.getDate()}
                  </p>
                  <div className="mt-1 flex items-start justify-between gap-1">
                    <p className="text-xs font-medium leading-snug">
                      {ev.type === "session"
                        ? `Write ${ev.targetWords ?? 500} words`
                        : `${ch?.title ?? "Chapter"} due`}
                    </p>
                    <button onClick={() => deleteEvent(project.id, ev.id)} className="text-muted-foreground hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                  <span className={`mt-1 inline-block rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase ${
                    status === "met" || status === "complete" ? "bg-green-100 text-green-700" :
                    status === "overdue" ? "bg-red-100 text-red-700" :
                    status === "missed" ? "bg-orange-100 text-orange-700" :
                    status === "today" ? "bg-accent/20 text-accent" : "bg-secondary text-muted-foreground"
                  }`}>{status}</span>
                </div>
              );
            })}
          </div>
        )}
      </aside>

      {/* ── Add event dialog ── */}
      <Dialog open={!!addingFor} onOpenChange={(o) => { if (!o) { setAddingFor(null); setAddType(null); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-serif">
              {addingFor ? (() => { const d = parseDate(addingFor); return `${DAYS_SHORT[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}`; })() : "Add event"}
            </DialogTitle>
          </DialogHeader>

          {!addType ? (
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setAddType("session")}
                className="flex flex-col items-center gap-2 rounded-xl border border-border bg-background p-4 text-sm font-medium hover:border-accent/60 hover:bg-accent/5 transition-colors"
              >
                <CalendarDays className="h-6 w-6 text-accent" />
                Plan a session
              </button>
              <button
                onClick={() => setAddType("deadline")}
                className="flex flex-col items-center gap-2 rounded-xl border border-border bg-background p-4 text-sm font-medium hover:border-[#1B2A4A]/40 hover:bg-[#1B2A4A]/5 transition-colors"
              >
                <div className="h-6 w-6 rounded-full bg-[#1B2A4A] flex items-center justify-center text-white text-xs font-bold">!</div>
                Set a deadline
              </button>
            </div>
          ) : addType === "session" ? (
            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Target word count</Label>
                <Input
                  type="number"
                  min={50}
                  step={50}
                  value={targetWords}
                  onChange={(e) => setTargetWords(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAddEvent} className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90">
                  <Plus className="h-3.5 w-3.5" /> Add session
                </Button>
                <Button variant="ghost" onClick={() => setAddType(null)}>Back</Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Link to chapter</Label>
                <select
                  value={chapterId}
                  onChange={(e) => setChapterId(e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  autoFocus
                >
                  <option value="">No specific chapter</option>
                  {project.chapters.map((c) => (
                    <option key={c.id} value={c.id}>Ch. {c.number} — {c.title}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAddEvent} className="flex-1 bg-[#1B2A4A] text-white hover:bg-[#1B2A4A]/90">
                  <Plus className="h-3.5 w-3.5" /> Set deadline
                </Button>
                <Button variant="ghost" onClick={() => setAddType(null)}>Back</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ── Month view ── */
function MonthView({ grid, eventsForDay, chapters, onClickDay, onDeleteEvent, onToggleComplete }: {
  grid: (Date | null)[];
  eventsForDay: (d: string) => CalendarEvent[];
  chapters: Project["chapters"];
  onClickDay: (d: string) => void;
  onDeleteEvent: (id: string) => void;
  onToggleComplete: (ev: CalendarEvent) => void;
}) {
  const todayStr = today();
  return (
    <div className="min-w-0">
      {/* Day headers */}
      <div className="mb-1 grid grid-cols-7">
        {DAYS_SHORT.map((d) => (
          <div key={d} className="py-1 text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{d}</div>
        ))}
      </div>
      {/* Cells */}
      <div className="grid grid-cols-7 gap-px bg-border/40 rounded-xl overflow-hidden">
        {grid.map((date, i) => {
          if (!date) return <div key={i} className="bg-card/20 min-h-[80px]" />;
          const ds = fmt(date);
          const evs = eventsForDay(ds);
          const isToday = ds === todayStr;
          return (
            <div
              key={i}
              className={`group relative bg-card min-h-[80px] p-1.5 cursor-pointer hover:bg-accent/5 transition-colors ${isToday ? "ring-1 ring-inset ring-accent" : ""}`}
              onClick={() => onClickDay(ds)}
            >
              <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${isToday ? "bg-accent text-accent-foreground" : "text-foreground"}`}>
                {date.getDate()}
              </span>
              <div className="mt-0.5 space-y-0.5">
                {evs.slice(0, 2).map((ev) => (
                  <EventPill key={ev.id} ev={ev} chapters={chapters} onDelete={onDeleteEvent} onToggle={onToggleComplete} compact />
                ))}
                {evs.length > 2 && (
                  <span className="text-[9px] text-muted-foreground">+{evs.length - 2} more</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Week view ── */
function WeekView({ days, eventsForDay, chapters, weeklyTarget, onClickDay, onDeleteEvent, onToggleComplete }: {
  days: Date[];
  eventsForDay: (d: string) => CalendarEvent[];
  chapters: Project["chapters"];
  weeklyTarget: number;
  onClickDay: (d: string) => void;
  onDeleteEvent: (id: string) => void;
  onToggleComplete: (ev: CalendarEvent) => void;
}) {
  const todayStr = today();
  const weekSessions = days.flatMap((d) =>
    eventsForDay(fmt(d)).filter((e) => e.type === "session" && e.completed),
  );
  const weekWords = weekSessions.reduce((s, e) => s + (e.targetWords ?? 0), 0);
  const weekPct = weeklyTarget > 0 ? Math.min(100, Math.round((weekWords / weeklyTarget) * 100)) : 0;

  return (
    <div>
      {/* Weekly progress */}
      <div className="mb-4 rounded-xl border border-border/60 bg-card p-4">
        <div className="flex items-baseline justify-between text-sm">
          <span className="font-medium">{weekWords.toLocaleString()} words this week</span>
          <span className="text-xs text-muted-foreground">goal: {weeklyTarget.toLocaleString()}</span>
        </div>
        <div className="mt-2 h-2 rounded-full bg-secondary overflow-hidden">
          <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${weekPct}%` }} />
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{weekPct}% of weekly goal</p>
      </div>

      {/* Day columns */}
      <div className="grid grid-cols-7 gap-2">
        {days.map((date) => {
          const ds = fmt(date);
          const evs = eventsForDay(ds);
          const isToday = ds === todayStr;
          return (
            <div
              key={ds}
              className={`rounded-xl border border-border/60 bg-card p-2 cursor-pointer hover:border-accent/40 transition-colors ${isToday ? "border-accent/60 bg-accent/5" : ""}`}
              onClick={() => onClickDay(ds)}
            >
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{DAYS_SHORT[date.getDay()]}</p>
              <p className={`mt-0.5 font-serif text-2xl font-semibold ${isToday ? "text-accent" : "text-foreground"}`}>{date.getDate()}</p>
              <div className="mt-2 space-y-1">
                {evs.map((ev) => (
                  <EventPill key={ev.id} ev={ev} chapters={chapters} onDelete={onDeleteEvent} onToggle={onToggleComplete} />
                ))}
                {evs.length === 0 && (
                  <p className="text-[9px] text-muted-foreground/60 flex items-center gap-0.5"><Plus className="h-2.5 w-2.5" /> Add</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Event pill ── */
function EventPill({ ev, chapters, onDelete, onToggle, compact = false }: {
  ev: CalendarEvent;
  chapters: Project["chapters"];
  onDelete: (id: string) => void;
  onToggle: (ev: CalendarEvent) => void;
  compact?: boolean;
}) {
  const ch = chapters.find((c) => c.id === ev.chapterId);
  const status = eventStatus(ev, chapters);
  const styles = statusStyles(status, ev.type);

  const label = ev.type === "session"
    ? `${statusIcon(status)}${ev.targetWords ?? 500}w`
    : `${statusIcon(status)}${ch ? `Ch.${ch.number}` : "Deadline"}`;

  return (
    <div
      className={`group/pill flex items-center justify-between rounded-full px-1.5 text-[9px] font-semibold ${compact ? "py-0.5" : "py-1"} ${styles} cursor-pointer`}
      onClick={(e) => { e.stopPropagation(); if (ev.type === "session") onToggle(ev); }}
      title={ev.type === "session" ? `Write ${ev.targetWords ?? 500} words` : `Deadline: ${ch?.title ?? "Chapter"}`}
    >
      <span className="truncate">{label}</span>
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(ev.id); }}
        className="ml-1 hidden group-hover/pill:flex opacity-70 hover:opacity-100"
      >
        <X className="h-2.5 w-2.5" />
      </button>
    </div>
  );
}
