import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Footer } from "@/components/Footer";
import { FoxLogo, Wordmark } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus, Flame, BookOpen, PenLine, Sparkles,
  MoreHorizontal, Copy, Archive, ArchiveRestore, Trash2, ChevronDown, LogOut,
} from "lucide-react";
import { useProjects, THEME_CONFIGS, type Project, type ProjectTheme } from "@/lib/projects-store";
import { useAuth } from "@/hooks/use-auth";
import { RequireAuth } from "@/components/protected-route";

const PROJECT_GROUPS: { id: string; label: string; themes: ProjectTheme[] }[] = [
  { id: "creative-writing",    label: "Creative writing",        themes: ["books-memoir", "screenplays-tv", "poetry-verse"] },
  { id: "professional-writing",label: "Professional writing",    themes: ["copywriting", "ads-campaigns", "social-media", "newsletter"] },
  { id: "academic",            label: "Academic & non-fiction",  themes: ["dissertation", "essays"] },
  { id: "personal",            label: "Personal & other",        themes: ["journaling", "ideating"] },
];

function getProjectGroup(theme: string): string {
  for (const g of PROJECT_GROUPS) {
    if ((g.themes as string[]).includes(theme)) return g.id;
  }
  return "creative-writing";
}

export const Route = createFileRoute("/home")({
  head: () => ({
    meta: [
      { title: "Your study — Earnest Writing" },
      { name: "description", content: "Pick up where you left off." },
    ],
  }),
  component: () => <RequireAuth><Home /></RequireAuth>,
});

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function Home() {
  const { projects, deleteProject, duplicateProject, archiveProject } = useProjects();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showArchived, setShowArchived] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const userName = user?.displayName ?? user?.username ?? "";

  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long", month: "long", day: "numeric",
  });

  const active = projects.filter((p) => !p.archived);
  const archived = projects.filter((p) => p.archived);

  const totalWords = active.reduce(
    (sum, p) => sum + p.chapters.reduce((s, c) => s + c.words, 0),
    0,
  );

  const totalChaptersDone = active.reduce(
    (sum, p) => sum + p.chapters.filter((c) => c.status === "done").length,
    0,
  );

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayWords = active.reduce((sum, p) => {
    const todayEvents = (p.events ?? []).filter(
      (e) => e.type === "session" && e.completed && e.date === todayStr,
    );
    return sum + todayEvents.reduce((s, e) => s + (e.targetWords ?? 0), 0);
  }, 0);

  const dayStreak = (() => {
    const allSessionDates = new Set(
      active.flatMap((p) =>
        (p.events ?? [])
          .filter((e) => e.type === "session" && e.completed)
          .map((e) => e.date),
      ),
    );
    let streak = 0;
    const d = new Date();
    while (true) {
      const key = d.toISOString().slice(0, 10);
      if (!allSessionDates.has(key)) break;
      streak++;
      d.setDate(d.getDate() - 1);
    }
    return streak;
  })();

  const lastActiveProject = active.length > 0 ? active[0] : null;

  const handleDelete = (id: string) => {
    if (confirmDelete === id) {
      deleteProject(id);
      setConfirmDelete(null);
    } else {
      setConfirmDelete(id);
      setTimeout(() => setConfirmDelete((v) => (v === id ? null : v)), 4000);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Wordmark />
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/15 font-serif text-sm font-semibold text-accent">
              {userName ? userName[0].toUpperCase() : "?"}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              onClick={async () => { await logout(); navigate({ to: "/" }); }}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        {/* Greeting */}
        <section className="animate-ink-fade flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground" suppressHydrationWarning>{today}</p>
            <h1 className="mt-2 font-serif text-4xl font-semibold tracking-tight md:text-5xl" suppressHydrationWarning>
              {greeting()},{" "}
              <span className="italic text-accent">{userName || "writer"}</span>.
            </h1>
            <p className="mt-2 max-w-xl text-muted-foreground">
              The page is patient. Shall we add a few sentences to it today?
            </p>
          </div>
          <FoxLogo className="hidden h-24 w-24 md:block" float />
        </section>

        {/* Stats */}
        <section className="mt-10 grid gap-4 sm:grid-cols-3">
          <StatCard
            icon={Flame}
            label="Day streak"
            value={dayStreak > 0 ? String(dayStreak) : "—"}
            sub={dayStreak > 0 ? `${dayStreak === 1 ? "day" : "days"} in a row` : "Start one today"}
          />
          <StatCard
            icon={PenLine}
            label="Total words written"
            value={totalWords.toLocaleString()}
            sub={`${active.length} active project${active.length !== 1 ? "s" : ""}`}
          />
          <StatCard
            icon={BookOpen}
            label="Chapters finished"
            value={String(totalChaptersDone)}
            sub={totalChaptersDone === 1 ? "chapter done" : "chapters done"}
          />
        </section>

        {/* Active Projects */}
        <section className="mt-12">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <h2 className="font-serif text-2xl font-semibold tracking-tight">Your projects</h2>
              <p className="text-sm text-muted-foreground">Pick up a thread, or begin a new one.</p>
            </div>
            <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
              <Link to="/onboarding"><Plus className="h-4 w-4" /> New project</Link>
            </Button>
          </div>

          {active.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <p className="font-serif text-2xl font-medium text-foreground/60">No projects yet</p>
              <p className="mt-2 text-sm text-muted-foreground">Start your first project and your writing will live here.</p>
              <Link to="/onboarding" className="mt-6 inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-2.5 text-sm font-medium text-accent-foreground hover:bg-accent/90 transition-colors">
                <Plus className="h-4 w-4" /> Start a project
              </Link>
            </div>
          ) : (
            <>
              {PROJECT_GROUPS.map((group) => {
                const groupProjects = active.filter((p) => getProjectGroup(p.theme) === group.id);
                if (groupProjects.length === 0) return null;
                return (
                  <div key={group.id} className="mb-8">
                    <p className="mb-3 text-xs uppercase tracking-[0.18em] text-muted-foreground">{group.label}</p>
                    <div className="grid gap-4 md:grid-cols-2">
                      {groupProjects.map((p) => (
                        <ProjectCard
                          key={p.id}
                          project={p}
                          confirmDelete={confirmDelete}
                          onOpen={() => navigate({ to: "/project/$projectId", params: { projectId: p.id } })}
                          onDuplicate={() => duplicateProject(p.id)}
                          onArchive={() => archiveProject(p.id, true)}
                          onDelete={() => handleDelete(p.id)}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
              <div className="grid gap-4 md:grid-cols-2">
                <Link
                  to="/onboarding"
                  className="flex min-h-[140px] items-center justify-center rounded-xl border border-dashed border-border bg-transparent text-muted-foreground transition-colors hover:border-accent/60 hover:text-accent"
                >
                  <div className="flex flex-col items-center gap-2">
                    <Plus className="h-5 w-5" />
                    <span className="font-serif">Begin a new project</span>
                  </div>
                </Link>
              </div>
            </>
          )}
        </section>

        {/* Archived */}
        {archived.length > 0 && (
          <section className="mt-10">
            <button
              onClick={() => setShowArchived((v) => !v)}
              className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <Archive className="h-4 w-4" />
              {archived.length} archived project{archived.length !== 1 ? "s" : ""}
              <ChevronDown className={`h-4 w-4 transition-transform ${showArchived ? "rotate-180" : ""}`} />
            </button>

            {showArchived && (
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {archived.map((p) => (
                  <ProjectCard
                    key={p.id}
                    project={p}
                    confirmDelete={confirmDelete}
                    dimmed
                    onOpen={() => navigate({ to: "/project/$projectId", params: { projectId: p.id } })}
                    onDuplicate={() => duplicateProject(p.id)}
                    onUnarchive={() => archiveProject(p.id, false)}
                    onDelete={() => handleDelete(p.id)}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {/* Bottom cards */}
        <section className="mt-12 grid gap-4 md:grid-cols-2">
          <Card className="border-border/70 bg-card p-6">
            <div className="flex items-center gap-2 text-accent">
              <Sparkles className="h-4 w-4" />
              <span className="text-xs uppercase tracking-[0.18em]">From the fox</span>
            </div>
            <p className="mt-3 font-serif text-lg leading-relaxed">
              "I never travel without my diary. One should always have something sensational to read in the train."
            </p>
            <p className="mt-2 text-xs italic text-muted-foreground">— Oscar Wilde</p>
          </Card>

          <Card className="border-border/70 bg-card p-6">
            <div className="flex items-center gap-2 text-accent">
              <PenLine className="h-4 w-4" />
              <span className="text-xs uppercase tracking-[0.18em]">Today's writing</span>
            </div>
            {todayWords > 0 ? (
              <>
                <p className="mt-3 font-serif text-2xl font-semibold">{todayWords.toLocaleString()} words</p>
                <p className="mt-1 text-xs text-muted-foreground">Written today — the streak lives on.</p>
              </>
            ) : (
              <p className="mt-3 text-muted-foreground text-sm">
                {active.length > 0
                  ? "Nothing written yet today. Even a paragraph keeps the habit alive."
                  : "Create a project and start writing to see your daily progress here."}
              </p>
            )}
            {lastActiveProject && (
              <Button
                className="mt-4 bg-accent text-accent-foreground hover:bg-accent/90"
                onClick={() => navigate({ to: "/project/$projectId", params: { projectId: lastActiveProject.id } })}
              >
                {todayWords > 0 ? "Keep going" : "Start writing"}
              </Button>
            )}
          </Card>
        </section>
      </main>
      <Footer />
    </div>
  );
}

function ProjectCard({
  project: p, confirmDelete, dimmed = false,
  onOpen, onDuplicate, onArchive, onUnarchive, onDelete,
}: {
  project: Project; confirmDelete: string | null; dimmed?: boolean;
  onOpen: () => void; onDuplicate: () => void;
  onArchive?: () => void; onUnarchive?: () => void; onDelete: () => void;
}) {
  const words = p.chapters.reduce((sum, c) => sum + c.words, 0);
  const pct = p.target ? Math.round((words / p.target) * 100) : 0;
  const isConfirming = confirmDelete === p.id;
  const cfg = THEME_CONFIGS[p.theme ?? "books-memoir"];

  return (
    <Card
      className={`group relative border-0 p-6 transition-all hover:-translate-y-0.5 hover:shadow-md ${dimmed ? "opacity-60" : ""}`}
      style={{
        backgroundColor: cfg.cardTint + "66",
        borderLeft: `3px solid ${cfg.accent}`,
      }}
    >
      <div className="cursor-pointer pr-8" onClick={onOpen}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <span
              className="inline-block rounded-full px-2.5 py-0.5 text-xs font-medium"
              style={{ backgroundColor: cfg.cardTint, color: cfg.accent }}
            >
              {cfg.label}
            </span>
            <h3 className="mt-1.5 font-serif text-xl font-semibold leading-tight truncate">{p.title}</h3>
          </div>
          <span className="mt-1 text-xs text-muted-foreground flex-shrink-0">
            {p.chapters.length} {p.chapters.length === 1 ? "chapter" : "chapters"}
          </span>
        </div>

        <div className="mt-5">
          <div className="mb-1.5 flex items-baseline justify-between text-sm">
            <span className="font-medium">
              {words.toLocaleString()}{" "}
              <span className="text-muted-foreground">/ {p.target.toLocaleString()} words</span>
            </span>
            <span className="text-xs text-muted-foreground">{pct}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-black/10 overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: cfg.accent }} />
          </div>
        </div>
      </div>

      {/* Three-dot menu */}
      <div className="absolute right-4 top-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:bg-secondary hover:text-foreground focus:opacity-100"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onClick={onOpen}>Open</DropdownMenuItem>
            <DropdownMenuItem onClick={onDuplicate}><Copy className="mr-2 h-3.5 w-3.5" /> Duplicate</DropdownMenuItem>
            <DropdownMenuSeparator />
            {onArchive && <DropdownMenuItem onClick={onArchive}><Archive className="mr-2 h-3.5 w-3.5" /> Archive</DropdownMenuItem>}
            {onUnarchive && <DropdownMenuItem onClick={onUnarchive}><ArchiveRestore className="mr-2 h-3.5 w-3.5" /> Unarchive</DropdownMenuItem>}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onDelete} className={isConfirming ? "text-destructive focus:text-destructive" : ""}>
              <Trash2 className="mr-2 h-3.5 w-3.5" />
              {isConfirming ? "Click again to confirm" : "Delete"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Card>
  );
}

function StatCard({ icon: Icon, label, value, sub, progress }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string; value: string; sub: string; progress?: number;
}) {
  return (
    <Card className="border-border/70 bg-card p-5">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4 text-accent" />
        <span className="text-xs uppercase tracking-[0.16em]">{label}</span>
      </div>
      <p className="mt-2 font-serif text-3xl font-semibold">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
      {progress !== undefined && <Progress value={progress} className="mt-3 h-1 bg-secondary [&>div]:bg-accent" />}
    </Card>
  );
}
