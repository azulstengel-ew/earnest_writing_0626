import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import sleepyFox from "@/assets/sleepy_fox.png";
import { FoxLogo } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  CalendarDays,
  GripVertical,
  Plus,
  LayoutDashboard,
  BookOpen,
  Users,
  GitBranch,
  Map,
  FlaskConical,
  StickyNote,
  FileText,
  CheckCircle2,
  Clock,
  Target,
  List,
  LayoutGrid,
  BookMarked,
  Globe,
  MapPin,
  CalendarRange,
  Layers,
  BarChart2,
  Smile,
} from "lucide-react";
import {
  useProjects,
  THEME_CONFIGS,
  isStoryTheme,
  type Chapter,
  type ChapterStatus,
} from "@/lib/projects-store";
import { ChapterOverlay } from "@/components/ChapterOverlay";
import { CharactersView } from "@/components/CharactersView";
import { PlotArcsView } from "@/components/PlotArcsView";
import { PlanningView } from "@/components/PlanningView";
import { ResearchView } from "@/components/ResearchView";
import { CitationsView } from "@/components/CitationsView";
import { OutlineView } from "@/components/OutlineView";
import { MoodCalendarView } from "@/components/MoodCalendarView";
import { ContentCalendarView } from "@/components/ContentCalendarView";
import { WorldBuildingView } from "@/components/WorldBuildingView";
import { StoryTimelineView } from "@/components/StoryTimelineView";
import { NotesCanvas } from "@/components/NotesCanvas";
import { RequireAuth } from "@/components/protected-route";

export const Route = createFileRoute("/project/$projectId")({
  head: ({ params }) => ({
    meta: [
      { title: `Project — Earnest Writing` },
      { name: "description", content: `Project workspace ${params.projectId}` },
    ],
  }),
  component: () => <RequireAuth><ProjectWorkspace /></RequireAuth>,
});

type Section =
  | "dashboard"
  | "chapters"
  | "characters"
  | "plot-arcs"
  | "story-timeline"
  | "world-building"
  | "locations"
  | "scene-tracker"
  | "collections"
  | "outline"
  | "personas"
  | "campaigns"
  | "content-calendar"
  | "editorial-calendar"
  | "mood-calendar"
  | "planning"
  | "research"
  | "notes"
  | "citations";

type ChapterListView = "cork" | "list";

const STATUS_LABEL: Record<ChapterStatus, string> = {
  "not-started": "Not started",
  "in-progress": "In progress",
  done: "Done",
};


const NAV_ITEMS: {
  id: Section;
  label: string;
  icon: React.ElementType;
  themeOnly?: string[];
  themeHide?: string[];
}[] = [
  { id: "dashboard",        label: "Dashboard",         icon: LayoutDashboard },
  { id: "chapters",         label: "Chapters",          icon: BookOpen },
  // Story-specific
  { id: "characters",       label: "Characters",        icon: Users,        themeOnly: ["books-memoir", "screenplays-tv"] },
  { id: "plot-arcs",        label: "Plot arcs",         icon: GitBranch,    themeOnly: ["books-memoir", "screenplays-tv"] },
  { id: "story-timeline",   label: "Story timeline",    icon: Clock,        themeOnly: ["books-memoir"] },
  { id: "world-building",   label: "World-building",    icon: Globe,        themeOnly: ["books-memoir"] },
  { id: "locations",        label: "Locations",         icon: MapPin,       themeOnly: ["books-memoir", "screenplays-tv"] },
  { id: "scene-tracker",    label: "Scene tracker",     icon: Layers,       themeOnly: ["screenplays-tv"] },
  // Poetry
  { id: "collections",      label: "Collections",       icon: BookOpen,     themeOnly: ["poetry-verse"] },
  // Professional
  { id: "personas",         label: "Personas",          icon: Users,        themeOnly: ["copywriting"] },
  { id: "campaigns",        label: "Campaigns",         icon: BarChart2,    themeOnly: ["ads-campaigns"] },
  { id: "content-calendar", label: "Content calendar",  icon: CalendarRange,themeOnly: ["social-media"] },
  { id: "editorial-calendar",label: "Editorial calendar",icon: CalendarRange,themeOnly: ["newsletter"] },
  // Academic
  { id: "outline",          label: "Outline",           icon: List,         themeOnly: ["dissertation", "essays"] },
  { id: "citations",        label: "Citations",         icon: BookMarked,   themeOnly: ["dissertation", "essays"] },
  // Personal
  { id: "mood-calendar",    label: "Mood calendar",     icon: Smile,        themeOnly: ["journaling"] },
  // Common (hidden for some)
  { id: "planning",         label: "Planning",          icon: Map,          themeHide: ["social-media", "ideating"] },
  { id: "research",         label: "Research",          icon: FlaskConical, themeHide: ["ideating"] },
  { id: "notes",            label: "Notes",             icon: StickyNote },
];

function ProjectWorkspace() {
  const { projectId } = Route.useParams();
  const { getProject, updateProject, createChapter, reorderChapters, hydrated } = useProjects();
  const project = getProject(projectId);

  useEffect(() => {
    if (project) document.title = `${project.title} — Earnest Writing`;
    return () => { document.title = "Earnest Writing — A calm home for your words"; };
  }, [project?.title]);

  const [activeSection, setActiveSection] = useState<Section>("dashboard");
  const [openChapterId, setOpenChapterId] = useState<string | null>(null);
  const [chapterView, setChapterView] = useState<ChapterListView>("cork");
  const [showNewChapter, setShowNewChapter] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newTarget, setNewTarget] = useState("2000");
  const [newDeadline, setNewDeadline] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const totalWords = useMemo(
    () => project?.chapters.reduce((s, c) => s + c.words, 0) ?? 0,
    [project],
  );

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background text-foreground">
        <p className="font-serif text-xl">This project doesn't exist (yet).</p>
        <Button asChild variant="outline">
          <Link to="/home">
            <ArrowLeft className="h-4 w-4" /> Back to library
          </Link>
        </Button>
      </div>
    );
  }

  const pct = project.target ? Math.round((totalWords / project.target) * 100) : 0;
  const openChapter = project.chapters.find((c) => c.id === openChapterId) ?? null;
  const theme = THEME_CONFIGS[project.theme ?? "books-memoir"];
  const visibleNav = NAV_ITEMS.filter((n) => {
    if (n.themeOnly && !n.themeOnly.includes(project.theme ?? "books-memoir")) return false;
    if (n.themeHide && n.themeHide.includes(project.theme ?? "books-memoir")) return false;
    return true;
  });

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = project.chapters.findIndex((c) => c.id === active.id);
    const newIndex = project.chapters.findIndex((c) => c.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(project.chapters, oldIndex, newIndex).map((c) => c.id);
    reorderChapters(project.id, next);
  };

  const handleCreateChapter = () => {
    const defaultTitle = project.theme==="journaling" ? new Date().toLocaleDateString(undefined,{day:"numeric",month:"long",year:"numeric"}) : project.theme==="poetry-verse" ? `Untitled poem ${project.chapters.length+1}` : project.theme==="screenplays-tv" ? `Scene ${project.chapters.length+1}` : project.theme==="social-media" ? `Post ${project.chapters.length+1}` : project.theme==="ads-campaigns" ? `Ad ${project.chapters.length+1}` : project.theme==="newsletter" ? `Issue ${project.chapters.length+1}` : project.theme==="essays" ? `Section ${project.chapters.length+1}` : project.theme==="copywriting" ? `Piece ${project.chapters.length+1}` : `Chapter ${project.chapters.length+1}`;
    const finalTitle = newTitle.trim() || defaultTitle;
    const ch = createChapter(project.id, {
      title: finalTitle,
      description: newDesc.trim(),
      target: Number(newTarget) || 2000,
      deadline: newDeadline || undefined,
    });
    setNewTitle("");
    setNewDesc("");
    setNewTarget("2000");
    setNewDeadline("");
    setShowNewChapter(false);
    setActiveSection("chapters");
    setOpenChapterId(ch.id);
  };

  const handleNavClick = (id: Section) => {
    setActiveSection(id);
    setOpenChapterId(null);
  };

  const themeVars = {
    "--background": theme.bgHsl,
    "--accent": theme.accentHsl,
    "--accent-foreground": theme.dark ? "0 0% 10%" : "0 0% 100%",
    ...(theme.dark ? {
      "--foreground": "0 0% 90%",
      "--card": "0 0% 14%",
      "--card-foreground": "0 0% 90%",
      "--border": "0 0% 22%",
      "--muted": "0 0% 18%",
      "--muted-foreground": "0 0% 55%",
      "--input": "0 0% 18%",
      "--secondary": "0 0% 18%",
      "--secondary-foreground": "0 0% 90%",
      "--popover": "0 0% 14%",
      "--popover-foreground": "0 0% 90%",
    } : {}),
  } as React.CSSProperties;

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ ...themeVars, backgroundColor: theme.bg, fontFamily: theme.uiFont, colorScheme: theme.dark ? "dark" : "light" }}
    >
      {/* ── Sidebar ── */}
      <aside
        className="flex w-56 flex-shrink-0 flex-col"
        style={{
          background: theme.sidebar,
          borderRight: "0.5px solid rgba(0,0,0,0.06)",
        }}
      >
        {/* Project name */}
        <div
          className="flex items-center gap-2.5 px-4 py-5"
          style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}
        >
          <Link to="/home" className="flex-shrink-0" title="Back to study">
            <FoxLogo className="h-7 w-7 transition-opacity hover:opacity-75" />
          </Link>
          <span
            className="line-clamp-2 font-serif text-sm font-semibold leading-snug cursor-text"
            style={{ color: "#1B2A4A" }}
            title="Double-click to rename"
            onDoubleClick={(e) => {
              const el = e.currentTarget;
              el.contentEditable = "true";
              el.focus();
              const range = document.createRange();
              range.selectNodeContents(el);
              window.getSelection()?.removeAllRanges();
              window.getSelection()?.addRange(range);
              const finish = () => {
                el.contentEditable = "false";
                const newTitle = el.textContent?.trim() || project.title;
                if (newTitle !== project.title) updateProject(project.id, { title: newTitle });
              };
              el.onblur = finish;
              el.onkeydown = (ke) => { if (ke.key === "Enter") { ke.preventDefault(); (el as HTMLElement).blur(); } };
            }}
          >
            {project.title}
          </span>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-0.5 px-2 py-4">
          {visibleNav.map((item) => {
            const Icon = item.icon;
            const active =
              activeSection === item.id &&
              (item.id !== "chapters" || !openChapterId);
            const chapterActive = item.id === "chapters" && !!openChapterId;
            const isActive = active || chapterActive;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className="group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors"
                style={{
                  color: isActive ? theme.accent : "#6B7A99",
                  background: isActive ? `${theme.accent}26` : "transparent",
                }}
              >
                <Icon
                  className="h-4 w-4 flex-shrink-0"
                  style={{ color: isActive ? theme.accent : "#6B7A99" }}
                />
                <span className={isActive ? "font-medium" : ""}>{
                  item.id === "chapters"
                    ? (project.theme === "poetry-verse" ? "Poems"
                      : project.theme === "screenplays-tv" ? "Scenes"
                      : project.theme === "journaling" ? "Entries"
                      : project.theme === "newsletter" ? "Issues"
                      : project.theme === "social-media" ? "Posts"
                      : project.theme === "ads-campaigns" ? "Ads"
                      : "Chapters")
                    : item.label
                }</span>
              </button>
            );
          })}
        </nav>

        {/* Back link */}
        <div
          className="mt-auto px-2 py-4"
          style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}
        >
          <div className="mb-2 px-3 py-2 rounded-md text-[10px] leading-relaxed" style={{ color: "rgba(0,0,0,0.35)", background: "rgba(0,0,0,0.04)" }}>
            Early beta — export important work via the Word button in each chapter.
          </div>
          <Link
            to="/home"
            className="flex items-center gap-2 rounded-md px-3 py-2 text-xs font-medium transition-colors hover:bg-secondary"
            style={{ color: "var(--color-text-primary)" }}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to library
          </Link>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* When a chapter is open: inline editor + right panel */}
        {openChapterId && openChapter ? (
          <ChapterOverlay
            project={project}
            chapter={openChapter}
            onClose={() => setOpenChapterId(null)}
          />
        ) : (
          <main className="flex flex-1 flex-col overflow-hidden">
            {activeSection === "dashboard" && (
              <DashboardView
                project={project}
                totalWords={totalWords}
                pct={pct}
                onGoToChapters={() => setActiveSection("chapters")}
                onOpenChapter={(id) => { setActiveSection("chapters"); setOpenChapterId(id); }}
                onNewChapter={() => {
                  const num = project.chapters.length + 1;
                  const label = project.theme==="poetry-verse" ? `Poem ${num}` :
                    project.theme==="journaling" ? new Date().toLocaleDateString(undefined,{day:"numeric",month:"long",year:"numeric"}) :
                    project.theme==="screenplays-tv" ? `Scene ${num}` :
                    project.theme==="newsletter" ? `Issue ${num}` :
                    project.theme==="social-media" ? `Post ${num}` :
                    project.theme==="ads-campaigns" ? `Ad ${num}` :
                    project.theme==="essays" ? `Section ${num}` :
                    project.theme==="copywriting" ? `Piece ${num}` :
                    `Chapter ${num}`;
                  const ch = createChapter(project.id, { title: label, description: "", target: 2000 });
                  setActiveSection("chapters");
                  setOpenChapterId(ch.id);
                }}
              />
            )}
            {activeSection === "chapters" && (
              <ChaptersView
                project={project}
                sensors={sensors}
                onDragEnd={onDragEnd}
                onOpenChapter={(id) => setOpenChapterId(id)}
                onNewChapter={() => {
                  const num = project.chapters.length + 1;
                  const label = project.theme==="poetry-verse" ? `Poem ${num}` :
                    project.theme==="journaling" ? new Date().toLocaleDateString(undefined,{day:"numeric",month:"long",year:"numeric"}) :
                    project.theme==="screenplays-tv" ? `Scene ${num}` :
                    project.theme==="newsletter" ? `Issue ${num}` :
                    project.theme==="social-media" ? `Post ${num}` :
                    project.theme==="ads-campaigns" ? `Ad ${num}` :
                    project.theme==="essays" ? `Section ${num}` :
                    project.theme==="copywriting" ? `Piece ${num}` :
                    `Chapter ${num}`;
                  const ch = createChapter(project.id, { title: label, description: "", target: 2000 });
                  setActiveSection("chapters");
                  setOpenChapterId(ch.id);
                }}
                view={chapterView}
                onViewChange={setChapterView}
              />
            )}
            {activeSection === "characters" && (
              <CharactersView project={project} />
            )}
            {activeSection === "plot-arcs" && (
              <PlotArcsView project={project} />
            )}
            {activeSection === "planning" && (
              <PlanningView project={project} />
            )}
            {activeSection === "research" && (
              <ResearchView project={project} />
            )}
            {activeSection === "notes" && (
              <NotesCanvas project={project} />
            )}
            {activeSection === "citations" && (
              <CitationsView project={project} />
            )}
            {activeSection === "story-timeline" && (
              <StoryTimelineView project={project} />
            )}
            {activeSection === "world-building" && (
              <WorldBuildingView project={project} />
            )}
            {activeSection === "locations" && (
              <PlaceholderView title="Locations" description="A registry of every place in your story. Each location has a name, description, associated characters, and the chapters that take place there." accentColor={theme.accent} />
            )}
            {activeSection === "scene-tracker" && (
              <PlaceholderView title="Scene tracker" description="Every scene at a glance — INT/EXT, location, time of day, characters present, and a brief action description. Track how many scenes are in each act." accentColor={theme.accent} />
            )}
            {activeSection === "collections" && (
              <PlaceholderView title="Collections" description="Group your poems into collections or chapbooks — Grief poems, Love poems, Nature poems. Organise by theme, mood, or form." accentColor={theme.accent} />
            )}
            {activeSection === "personas" && (
              <PlaceholderView title="Personas" description="Who are you writing for? Define your audience personas — name, age, pain points, motivations, tone preferences. Reference them while writing." accentColor={theme.accent} />
            )}
            {activeSection === "campaigns" && (
              <PlaceholderView title="Campaigns" description="Organise your work by campaign — Campaign → Ad set → Ad copy. Each campaign has its own brief, objective, and target audience." accentColor={theme.accent} />
            )}
            {activeSection === "content-calendar" && (
              <ContentCalendarView project={project} />
            )}
            {activeSection === "content_x" && (
              <PlaceholderView title="x" description="Your publishing calendar. See all scheduled posts by platform. Plan ahead, track what's live, and spot gaps in your content." accentColor={theme.accent} />
            )}
            {activeSection === "editorial-calendar" && (
              <PlaceholderView title="Editorial calendar" description="Plan your issues ahead. See send dates, topics, and status at a glance. Never miss a publication date." accentColor={theme.accent} />
            )}
            {activeSection === "mood-calendar" && (
              <MoodCalendarView project={project} />
            )}
            {activeSection === "mood_x" && (
              <PlaceholderView title="x" description="Your emotional landscape over time. Every entry you tag with a mood appears here as a coloured dot. Patterns emerge. You start to notice things." accentColor={theme.accent} />
            )}
            {activeSection === "outline" && (
              <OutlineView project={project} />
            )}
            {activeSection === "outline_x" && (
              <PlaceholderView title="x" description="Your argument from above. Sections, subsections, and the logic that connects them. Build the structure before you write the prose." accentColor={theme.accent} />
            )}
          </main>
        )}
      </div>

      {/* New chapter dialog */}
      <Dialog open={showNewChapter} onOpenChange={setShowNewChapter}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif">{project.theme==="screenplays-tv"?"New scene":project.theme==="poetry-verse"?"New poem":project.theme==="copywriting"?"New piece":project.theme==="ads-campaigns"?"New ad":project.theme==="social-media"?"New post":project.theme==="newsletter"?"New issue":project.theme==="essays"?"New section":project.theme==="journaling"?"New entry":"New chapter"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ch-title">Title <span className="text-muted-foreground font-normal text-xs">(optional)</span></Label>
              <Input
                id="ch-title"
                autoFocus
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Chapter Five — The Garden"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ch-desc">One-line description (optional)</Label>
              <Textarea
                id="ch-desc"
                rows={2}
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="What happens, in a sentence."
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="ch-target">Word target</Label>
                <Input
                  id="ch-target"
                  type="number"
                  min={100}
                  step={100}
                  value={newTarget}
                  onChange={(e) => setNewTarget(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ch-deadline">Deadline (optional)</Label>
                <Input
                  id="ch-deadline"
                  type="date"
                  value={newDeadline}
                  onChange={(e) => setNewDeadline(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowNewChapter(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateChapter}
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ── Dashboard View ── */
function DashboardView({
  project,
  totalWords,
  pct,
  onGoToChapters,
  onOpenChapter,
  onNewChapter,
}: {
  project: ReturnType<ReturnType<typeof useProjects>["getProject"]> & object;
  totalWords: number;
  pct: number;
  onGoToChapters: () => void;
  onOpenChapter: (id: string) => void;
  onNewChapter: () => void;
}) {
  const doneChapters = project.chapters.filter((c) => c.status === "done").length;
  const inProgressChapters = project.chapters.filter((c) => c.status === "in-progress").length;
  const wordsRemaining = Math.max(project.target - totalWords, 0);

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="border-b border-border/60 px-8 py-7">
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
          <span className="capitalize">{project.type}</span>
          <span>·</span>
          <span>
            {project.chapters.length}{" "}
            {project.chapters.length === 1 ? "chapter" : "chapters"}
          </span>
        </div>
        <h1 className="mt-2 font-serif text-3xl font-semibold tracking-tight">
          Dashboard
        </h1>
        {project.premise && (
          <p className="mt-1.5 max-w-xl text-sm text-muted-foreground">
            {project.premise}
          </p>
        )}
      </div>

      <div className="max-w-5xl space-y-8 px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard icon={FileText} label="Words written" value={totalWords.toLocaleString()} sub={`of ${project.target.toLocaleString()} target`} />
          <StatCard icon={Target} label="Progress" value={`${pct}%`} sub={`${wordsRemaining.toLocaleString()} to go`} />
          <StatCard icon={CheckCircle2}
            label={project.theme==="poetry-verse"?"Poems done":project.theme==="journaling"?"Entries done":project.theme==="screenplays-tv"?"Scenes done":project.theme==="newsletter"?"Issues done":project.theme==="social-media"?"Posts done":project.theme==="essays"?"Sections done":"Chapters done"}
            value={doneChapters.toString()} sub={`of ${project.chapters.length} total`} />
          <StatCard icon={Clock} label="In progress" value={inProgressChapters.toString()}
            sub={project.theme==="poetry-verse"?"poems active":project.theme==="journaling"?"entries active":project.theme==="screenplays-tv"?"scenes active":"chapters active"} />
        </div>

        {/* Progress */}
        <Card className="border-border/70 bg-card p-6">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Manuscript progress
          </p>
          <p className="mt-2 font-serif text-3xl font-semibold">
            {totalWords.toLocaleString()}{" "}
            <span className="text-base font-normal text-muted-foreground">
              / {project.target.toLocaleString()} words
            </span>
          </p>
          <Progress value={pct} className="mt-4 h-2.5 bg-secondary [&>div]:bg-accent" />
          <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
            <span>{pct}% complete</span>
            <span>{wordsRemaining.toLocaleString()} words remaining</span>
          </div>
        </Card>

        {/* Chapter overview */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-serif text-xl font-semibold tracking-tight">Chapters</h2>
              <p className="text-sm text-muted-foreground">Your manuscript, at a glance.</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onGoToChapters}>
                View all
              </Button>
              <Button
                size="sm"
                onClick={onNewChapter}
                className="bg-accent text-accent-foreground hover:bg-accent/90"
              >
                <Plus className="h-3.5 w-3.5" /> New chapter
              </Button>
            </div>
          </div>

          {project.chapters.length === 0 ? (
            <Card className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-border bg-transparent p-12 text-center">
              <p className="font-serif text-lg">An empty manuscript.</p>
              <p className="text-sm text-muted-foreground">
                Pin up your first chapter and the story begins.
              </p>
              <Button
                onClick={onNewChapter}
                className="mt-2 bg-accent text-accent-foreground hover:bg-accent/90"
              >
                <Plus className="h-4 w-4" /> Add first chapter
              </Button>
            </Card>
          ) : (
            <div className="space-y-2">
              {project.chapters.map((ch) => {
                const chPct = ch.target
                  ? Math.min(100, Math.round((ch.words / ch.target) * 100))
                  : 0;
                const statusColor =
                  ch.status === "done"
                    ? "bg-emerald-600"
                    : ch.status === "in-progress"
                    ? "bg-accent"
                    : "bg-foreground/20";
                return (
                  <Card
                    key={ch.id}
                    onClick={() => onOpenChapter(ch.id)}
                    className="flex cursor-pointer items-center gap-4 border-border/60 px-5 py-4 transition-colors hover:bg-secondary/30"
                  >
                    <div className={`h-2 w-2 flex-shrink-0 rounded-full ${statusColor}`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          Ch. {ch.number}
                        </span>
                        <p className="truncate font-serif font-medium">{ch.title}</p>
                      </div>
                      <div className="mt-1.5 flex items-center gap-3">
                        <div className="h-1 w-32 overflow-hidden rounded-full bg-secondary">
                          <div
                            className="h-full rounded-full bg-accent"
                            style={{ width: `${chPct}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {ch.words.toLocaleString()} / {ch.target.toLocaleString()} w
                        </span>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {STATUS_LABEL[ch.status]}
                    </span>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <Card className="border-border/60 bg-card p-5">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        <span className="text-xs uppercase tracking-[0.15em]">{label}</span>
      </div>
      <p className="mt-2 font-serif text-2xl font-semibold">{value}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>
    </Card>
  );
}

/* ── Chapters View ── */
function ChaptersView({
  project,
  sensors,
  onDragEnd,
  onOpenChapter,
  onNewChapter,
  view,
  onViewChange,
}: {
  project: ReturnType<ReturnType<typeof useProjects>["getProject"]> & object;
  sensors: ReturnType<typeof useSensors>;
  onDragEnd: (e: DragEndEvent) => void;
  onOpenChapter: (id: string) => void;
  onNewChapter: () => void;
  view: ChapterListView;
  onViewChange: (v: ChapterListView) => void;
}) {
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/60 px-8 py-5">
        <div>
          <h1 className="font-serif text-2xl font-semibold tracking-tight">{
              project.theme==="screenplays-tv"?"Scenes":project.theme==="poetry-verse"?"Poems":project.theme==="copywriting"?"Pieces":project.theme==="ads-campaigns"?"Ads":project.theme==="social-media"?"Posts":project.theme==="newsletter"?"Issues":project.theme==="essays"?"Sections":project.theme==="journaling"?"Entries":"Chapters"
            }</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {project.chapters.length}{" "}
            {project.chapters.length === 1 ? "chapter" : "chapters"}
            {view === "cork" ? " · drag to reorder · click to open" : " · click to open"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Cork / List toggle */}
          <div className="inline-flex rounded-lg border border-border bg-card p-1">
            <button
              onClick={() => onViewChange("cork")}
              title="Cork view"
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                view === "cork"
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              Cork
            </button>
            <button
              onClick={() => onViewChange("list")}
              title="List view"
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                view === "list"
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <List className="h-3.5 w-3.5" />
              List
            </button>
          </div>
          <Button
            size="sm"
            onClick={onNewChapter}
            className="bg-accent text-accent-foreground hover:bg-accent/90"
          >
            <Plus className="h-3.5 w-3.5" /> New chapter
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {project.chapters.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 p-16 text-center">
            <p className="font-serif text-lg">An empty corkboard.</p>
            <p className="text-sm text-muted-foreground">
              Pin up your first chapter and the story begins.
            </p>
            <Button
              onClick={onNewChapter}
              className="mt-2 bg-accent text-accent-foreground hover:bg-accent/90"
            >
              <Plus className="h-4 w-4" /> Add first chapter
            </Button>
          </div>
        ) : view === "cork" ? (
          <CorkView
            project={project}
            sensors={sensors}
            onDragEnd={onDragEnd}
            onOpenChapter={onOpenChapter}
            onNewChapter={onNewChapter}
          />
        ) : (
          <ChapterListView
            project={project}
            onOpenChapter={onOpenChapter}
          />
        )}
      </div>
    </div>
  );
}

/* ── Cork View ── */
function CorkView({
  project,
  sensors,
  onDragEnd,
  onOpenChapter,
  onNewChapter,
}: {
  project: ReturnType<ReturnType<typeof useProjects>["getProject"]> & object;
  sensors: ReturnType<typeof useSensors>;
  onDragEnd: (e: DragEndEvent) => void;
  onOpenChapter: (id: string) => void;
  onNewChapter: () => void;
}) {
  return (
    <div
      className="min-h-full p-6"
      style={{
        backgroundColor: "#E9D9B8",
        backgroundImage:
          "radial-gradient(circle at 1px 1px, rgba(0,0,0,0.08) 1px, transparent 0)",
        backgroundSize: "14px 14px",
      }}
    >
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext
          items={project.chapters.map((c) => c.id)}
          strategy={horizontalListSortingStrategy}
        >
          <div className="flex flex-wrap gap-6 pb-4">
            {project.chapters.map((ch) => (
              <ChapterCard
                key={ch.id}
                chapter={ch}
                theme={project.theme ?? "books-memoir"}
                projectId={project.id}
                onOpen={() => onOpenChapter(ch.id)}
              />
            ))}
            <button
              onClick={onNewChapter}
              className="flex h-[280px] w-[240px] flex-shrink-0 flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-foreground/30 bg-background/30 text-foreground/60 transition-colors hover:border-foreground/50 hover:bg-background/50"
            >
              <Plus className="h-5 w-5" />
              <span className="font-serif">{project.theme==="screenplays-tv"?"Add scene":project.theme==="poetry-verse"?"Add poem":project.theme==="copywriting"?"Add piece":project.theme==="ads-campaigns"?"Add ad":project.theme==="social-media"?"Add post":project.theme==="newsletter"?"Add issue":project.theme==="essays"?"Add section":project.theme==="journaling"?"Add entry":"Add chapter"}</span>
            </button>
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

/* ── Chapter List View ── */
function ChapterListView({
  project,
  onOpenChapter,
}: {
  project: ReturnType<ReturnType<typeof useProjects>["getProject"]> & object;
  onOpenChapter: (id: string) => void;
}) {
  return (
    <table className="w-full text-sm">
      <thead className="sticky top-0 border-b border-border/60 bg-card/80 backdrop-blur">
        <tr>
          <th className="px-8 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">#</th>
          <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Title</th>
          <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Status</th>
          <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Words</th>
          <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Target</th>
          <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Deadline</th>
        </tr>
      </thead>
      <tbody>
        {project.chapters.map((ch, i) => {
          const chPct = ch.target
            ? Math.min(100, Math.round((ch.words / ch.target) * 100))
            : 0;
          const statusColor =
            ch.status === "done"
              ? "text-emerald-600"
              : ch.status === "in-progress"
              ? "text-accent"
              : "text-muted-foreground";
          return (
            <tr
              key={ch.id}
              onClick={() => onOpenChapter(ch.id)}
              className={`cursor-pointer border-b border-border/40 transition-colors hover:bg-secondary/40 ${
                i % 2 === 0 ? "" : "bg-card/30"
              }`}
            >
              <td className="px-8 py-4 text-muted-foreground">{ch.number}</td>
              <td className="px-4 py-4">
                <div>
                  <p className="font-serif font-medium">{ch.title}</p>
                  {ch.description && (
                    <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                      {ch.description}
                    </p>
                  )}
                </div>
              </td>
              <td className={`px-4 py-4 text-xs font-medium ${statusColor}`}>
                {STATUS_LABEL[ch.status]}
              </td>
              <td className="px-4 py-4">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-20 overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-accent"
                      style={{ width: `${chPct}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {ch.words.toLocaleString()}
                  </span>
                </div>
              </td>
              <td className="px-4 py-4 text-xs text-muted-foreground">
                {ch.target.toLocaleString()}
              </td>
              <td className="px-4 py-4 text-xs text-muted-foreground">
                {ch.deadline
                  ? new Date(ch.deadline).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })
                  : "—"}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

/* ── Placeholder View ── */
function PlaceholderView({
  icon: Icon,
  label,
  description,
}: {
  icon: React.ElementType;
  label: string;
  description: string;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <div className="border-b border-border/60 px-8 py-7">
        <h1 className="font-serif text-3xl font-semibold tracking-tight">{label}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
          <Icon className="h-6 w-6 text-muted-foreground" />
        </div>
        <div>
          <p className="font-serif text-lg">{label} — coming soon.</p>
          <p className="mt-1 text-sm text-muted-foreground">This section is on its way.</p>
        </div>
      </div>
    </div>
  );
}

/* ── Notes View ── */
function NotesView({ project }: { project: Project }) {
  const { updateProject } = useProjects();
  const [text, setText] = useState(project.notes ?? "");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSaved = useRef(text);

  const save = useCallback((val: string) => {
    if (val === lastSaved.current) return;
    lastSaved.current = val;
    updateProject(project.id, { notes: val });
  }, [project.id, updateProject]);

  const onChange = (val: string) => {
    setText(val);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => save(val), 800);
  };

  useEffect(() => {
    setText(project.notes ?? "");
  }, [project.id]);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-border/60 px-8 py-5">
        <div>
          <h1 className="font-serif text-2xl font-semibold tracking-tight">Notes</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Anything that doesn't fit elsewhere — it belongs here.
          </p>
        </div>
        <span className="text-xs text-muted-foreground">{text.length > 0 ? `${text.split(/\s+/).filter(Boolean).length} words` : "Empty"}</span>
      </div>
      <div className="flex flex-1 overflow-hidden">
        <textarea
          className="flex-1 resize-none bg-background p-8 font-sans text-base leading-relaxed text-foreground outline-none placeholder:text-muted-foreground/50"
          placeholder="Start writing — anything goes here. Ideas, reminders, scene fragments, character whispers…"
          value={text}
          onChange={(e) => onChange(e.target.value)}
          style={{ fontFamily: "DM Sans, sans-serif" }}
        />
      </div>
    </div>
  );
}


/* ── Chapter Card (cork view) ── */
function ChapterCard({ chapter, theme, projectId, onOpen }: { chapter: Chapter; theme: string; projectId: string; onOpen: () => void }) {
  const { updateChapter } = useProjects();
  const MOOD_COLORS: Record<string, string> = {
    great: "#4A7C3F", good: "#7AB648", okay: "#E8A020", low: "#C8394A", hard: "#2E6DA4",
  };
  const moodColor = chapter.mood ? MOOD_COLORS[chapter.mood] : null;
  const cardLabel = (() => {
    if (theme === "poetry-verse") return `Poem ${chapter.number}`;
    if (theme === "journaling") {
      try {
        const date = new Date(chapter.createdAt ?? Date.now());
        return date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
      } catch { return `Entry ${chapter.number}`; }
    }
    if (theme === "screenplays-tv") return `Scene ${chapter.number}`;
    if (theme === "newsletter") return `Issue ${chapter.number}`;
    if (theme === "social-media") return `Post ${chapter.number}`;
    if (theme === "ads-campaigns") return `Ad ${chapter.number}`;
    return `Chapter ${chapter.number}`;
  })();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: chapter.id });
  const pct = chapter.target
    ? Math.min(100, Math.round((chapter.words / chapter.target) * 100))
    : 0;
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };
  const tilt = (parseInt(chapter.id.slice(0, 2), 16) % 5) - 2;

  return (
    <div ref={setNodeRef} style={style} className="relative flex-shrink-0">
      <div className="absolute left-1/2 top-2 z-10 h-3 w-3 -translate-x-1/2 rounded-full bg-accent shadow-md ring-2 ring-accent/30" />
      <div
        onClick={onOpen}
        className="group flex h-[280px] w-[240px] cursor-pointer flex-col rounded-md pl-6 pr-5 pt-6 shadow-[0_6px_18px_rgba(0,0,0,0.18)] transition-transform hover:-translate-y-1 hover:shadow-[0_10px_24px_rgba(0,0,0,0.22)]"
        style={{ transform: `rotate(${tilt}deg)`, backgroundColor: moodColor ? `${moodColor}22` : "#FFFEF4", borderLeft: moodColor ? `4px solid ${moodColor}` : "none" }}
      >
        <div className="flex items-start justify-between text-[11px] uppercase tracking-wider text-foreground/60">
          <span
            className="truncate block cursor-text"
            title="Double-click to rename"
            onDoubleClick={(e) => {
              e.stopPropagation();
              const el = e.currentTarget;
              el.contentEditable = "true";
              el.focus();
              const r = document.createRange();
              r.selectNodeContents(el);
              window.getSelection()?.removeAllRanges();
              window.getSelection()?.addRange(r);
              el.onblur = () => {
                el.contentEditable = "false";
                const t = el.textContent?.trim();
                if (t && t !== chapter.title) updateChapter(projectId, chapter.id, { title: t });
              };
              el.onkeydown = (ke) => { if (ke.key==="Enter") { ke.preventDefault(); (el as HTMLElement).blur(); } };
            }}
          >{cardLabel}</span>
          <button
            {...attributes}
            {...listeners}
            onClick={(e) => e.stopPropagation()}
            className="cursor-grab rounded p-0.5 text-foreground/40 hover:bg-foreground/10 hover:text-foreground/80 active:cursor-grabbing"
            aria-label="Drag to reorder"
          >
            <GripVertical className="h-3.5 w-3.5" />
          </button>
        </div>

        <h3
          className="mt-2 line-clamp-2 font-serif text-base font-semibold leading-snug text-foreground"
          style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}
        >
          {chapter.title}
        </h3>
        {chapter.description && (
          <p
            className="mt-1.5 line-clamp-3 text-sm italic text-foreground/70"
            style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}
          >
            {chapter.description}
          </p>
        )}

        <div className="mt-auto space-y-2">
          {chapter.deadline && (
            <div className="inline-flex items-center gap-1 rounded-full bg-foreground/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-foreground/70">
              <CalendarDays className="h-3 w-3" />
              {new Date(chapter.deadline).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              })}
            </div>
          )}
          <div className="flex items-center justify-between text-[11px] text-foreground/70 overflow-hidden">
            <StatusDot status={chapter.status} />
            <span>
              <span className="truncate">{chapter.words.toLocaleString()} / {chapter.target.toLocaleString()}w</span>
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-foreground/10">
            <div
              className="h-full rounded-full bg-accent transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusDot({ status }: { status: ChapterStatus }) {
  const color =
    status === "done"
      ? "bg-emerald-600"
      : status === "in-progress"
      ? "bg-accent"
      : "bg-foreground/30";
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-1.5 w-1.5 rounded-full ${color}`} />
      <span className="uppercase tracking-wider">{STATUS_LABEL[status]}</span>
    </span>
  );
}