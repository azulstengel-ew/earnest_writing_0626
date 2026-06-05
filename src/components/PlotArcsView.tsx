import { useEffect, useRef, useState } from "react";
import {
  Plus, Trash2, X, ChevronDown, BarChart2, AlignLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useProjects,
  type Project,
  type PlotArc,
  type ArcStatus,
  type ArcType,
  type StoryFramework,
  type CustomAct,
  type CustomBeat,
} from "@/lib/projects-store";

/* ── Framework definitions (all positions use 0-1 floats internally) ── */
type ActDef = { name: string; startPct: number; endPct: number; color: string };
type BeatDef = { name: string; pct: number; color: string; tip: string };

const FRAMEWORKS: Record<Exclude<StoryFramework, "custom">, { acts: ActDef[]; beats: BeatDef[] }> = {
  "three-act": {
    acts: [
      { name: "Act I — Setup", startPct: 0, endPct: 0.25, color: "#BFCFE7" },
      { name: "Act II — Confrontation", startPct: 0.25, endPct: 0.75, color: "#F5DEB3" },
      { name: "Act III — Resolution", startPct: 0.75, endPct: 1, color: "#C8E6C9" },
    ],
    beats: [
      { name: "Opening Image", pct: 0.01, color: "#5C8DD6", tip: "The very first impression of the story's world and tone." },
      { name: "Inciting Incident", pct: 0.12, color: "#E8834A", tip: "The event that disrupts the ordinary world and sets the story in motion." },
      { name: "Plot Point 1", pct: 0.25, color: "#9C59D1", tip: "The protagonist commits to the journey — no turning back." },
      { name: "Midpoint", pct: 0.5, color: "#D4A017", tip: "A false peak or pit that changes the direction of the story." },
      { name: "Plot Point 2", pct: 0.75, color: "#C0392B", tip: "The hero hits rock bottom before the final push." },
      { name: "Climax", pct: 0.88, color: "#E74C3C", tip: "The ultimate confrontation and highest point of tension." },
      { name: "Resolution", pct: 0.97, color: "#27AE60", tip: "The new normal after the conflict is resolved." },
    ],
  },
  "save-the-cat": {
    acts: [
      { name: "Act I", startPct: 0, endPct: 0.25, color: "#BFCFE7" },
      { name: "Act IIA", startPct: 0.25, endPct: 0.5, color: "#F5DEB3" },
      { name: "Act IIB", startPct: 0.5, endPct: 0.75, color: "#FFE0B2" },
      { name: "Act III", startPct: 0.75, endPct: 1, color: "#C8E6C9" },
    ],
    beats: [
      { name: "Opening Image", pct: 0.01, color: "#5C8DD6", tip: "A single perfect image that captures the before-state of the hero." },
      { name: "Catalyst", pct: 0.1, color: "#E8834A", tip: "The life-changing event that kicks off the story." },
      { name: "Break Into 2", pct: 0.25, color: "#9C59D1", tip: "The hero enters a new world — the upside-down." },
      { name: "Fun & Games", pct: 0.37, color: "#17A589", tip: "The promise of the premise: exploring the new world." },
      { name: "Midpoint", pct: 0.5, color: "#D4A017", tip: "A fun-and-games peak or a false defeat that raises stakes." },
      { name: "All Is Lost", pct: 0.75, color: "#C0392B", tip: "The worst moment — everything falls apart." },
      { name: "Break Into 3", pct: 0.83, color: "#E74C3C", tip: "The hero discovers the solution and charges toward the finale." },
      { name: "Final Image", pct: 0.99, color: "#27AE60", tip: "A mirror of the opening image — shows how far things have changed." },
    ],
  },
  "hero-journey": {
    acts: [
      { name: "Departure", startPct: 0, endPct: 0.33, color: "#BFCFE7" },
      { name: "Initiation", startPct: 0.33, endPct: 0.66, color: "#F5DEB3" },
      { name: "Return", startPct: 0.66, endPct: 1, color: "#C8E6C9" },
    ],
    beats: [
      { name: "Ordinary World", pct: 0.04, color: "#5C8DD6", tip: "The hero's everyday life before the adventure." },
      { name: "Call to Adventure", pct: 0.12, color: "#E8834A", tip: "A challenge or quest is presented to the hero." },
      { name: "Crossing the Threshold", pct: 0.25, color: "#9C59D1", tip: "The hero commits and enters the special world." },
      { name: "The Ordeal", pct: 0.5, color: "#C0392B", tip: "The hero faces their greatest fear or enemy." },
      { name: "Reward", pct: 0.62, color: "#D4A017", tip: "The hero seizes the sword — gains the prize." },
      { name: "Resurrection", pct: 0.83, color: "#E74C3C", tip: "A final test — the hero is transformed or dies and reborn." },
      { name: "Return with Elixir", pct: 0.97, color: "#27AE60", tip: "The hero returns home, changed, bearing a gift for the world." },
    ],
  },
};

const TENSION_PTS = 20;

const ARC_STATUS_COLORS: Record<ArcStatus, string> = {
  planned: "#9CA3AF",
  active: "#E8834A",
  resolved: "#22C55E",
};

const ARC_STATUS_LABELS: Record<ArcStatus, string> = {
  planned: "Planned",
  active: "Active",
  resolved: "Resolved",
};

const ARC_TYPE_BADGE: Record<ArcType, string> = {
  main: "bg-[#1B2B4B] text-white",
  subplot: "bg-[#0D9488] text-white",
};

function initials(name: string) {
  return name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

function smoothPath(pts: { x: number; y: number }[]): string {
  if (pts.length < 2) return "";
  let d = `M ${pts[0].x},${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
  }
  return d;
}

/* ── Main component — no chapter dependency ── */
export function PlotArcsView({ project }: { project: Project }) {
  const { updateFramework, updateCustomActs, updateCustomBeats, updateTensionCurve, createArc, updateArc, deleteArc } = useProjects();
  const [displayMode, setDisplayMode] = useState<"timeline" | "graph">("timeline");
  const [showAddArc, setShowAddArc] = useState(false);
  const [editingArc, setEditingArc] = useState<PlotArc | null>(null);
  const [hoveredBeat, setHoveredBeat] = useState<{ name: string; tip: string; x: number; y: number } | null>(null);

  const fw = project.framework;

  const acts: ActDef[] = fw === "custom"
    ? project.customActs.map((a) => ({ name: a.name, startPct: a.startPct / 100, endPct: a.endPct / 100, color: a.color }))
    : FRAMEWORKS[fw]?.acts ?? [];

  const beats: BeatDef[] = fw === "custom"
    ? project.customBeats.map((b) => ({ name: b.name, pct: b.pct / 100, color: b.color, tip: b.name }))
    : FRAMEWORKS[fw]?.beats ?? [];

  const FRAMEWORK_LABELS: Record<StoryFramework, string> = {
    "three-act": "Three Act",
    "save-the-cat": "Save the Cat",
    "hero-journey": "Hero's Journey",
    custom: "Custom",
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Header toolbar */}
      <div className="flex flex-wrap items-center gap-3 border-b border-border/60 px-8 py-4">
        <h1 className="font-serif text-xl font-semibold mr-2">Plot arcs</h1>

        {/* Framework selector */}
        <div className="flex rounded-lg border border-border bg-card p-0.5">
          {(["three-act", "save-the-cat", "hero-journey", "custom"] as StoryFramework[]).map((f) => (
            <button
              key={f}
              onClick={() => updateFramework(project.id, f)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${fw === f ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              {FRAMEWORK_LABELS[f]}
            </button>
          ))}
        </div>

        {/* Timeline / Graph toggle */}
        <div className="ml-auto flex rounded-lg border border-border bg-card p-0.5">
          <button
            onClick={() => setDisplayMode("timeline")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${displayMode === "timeline" ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            <AlignLeft className="h-3.5 w-3.5" /> Timeline
          </button>
          <button
            onClick={() => setDisplayMode("graph")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${displayMode === "graph" ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            <BarChart2 className="h-3.5 w-3.5" /> Graph
          </button>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {/* Story ruler: acts + beats + percentage markers (no chapters needed) */}
        <StoryRuler
          acts={acts}
          beats={beats}
          hoveredBeat={hoveredBeat}
          onHoverBeat={setHoveredBeat}
        />

        {displayMode === "timeline" ? (
          <TimelineSection
            project={project}
            onEditArc={setEditingArc}
            onDeleteArc={(id) => deleteArc(project.id, id)}
            onAddArc={() => setShowAddArc(true)}
            onUpdateArc={(id, patch) => updateArc(project.id, id, patch)}
          />
        ) : (
          <GraphSection
            acts={acts}
            beats={beats}
            tensionCurve={project.tensionCurve}
            onUpdateCurve={(curve) => updateTensionCurve(project.id, curve)}
          />
        )}

        {fw === "custom" && (
          <CustomFrameworkEditor
            project={project}
            onUpdateActs={(acts) => updateCustomActs(project.id, acts)}
            onUpdateBeats={(beats) => updateCustomBeats(project.id, beats)}
          />
        )}
      </div>

      {(showAddArc || editingArc) && (
        <ArcDialog
          project={project}
          arc={editingArc}
          onClose={() => { setShowAddArc(false); setEditingArc(null); }}
          onSave={(data) => {
            if (editingArc) {
              updateArc(project.id, editingArc.id, data);
            } else {
              createArc(project.id, data);
            }
            setShowAddArc(false);
            setEditingArc(null);
          }}
        />
      )}
    </div>
  );
}

/* ── Story Ruler: percentage-based, no chapter dependency ── */
function StoryRuler({
  acts, beats, hoveredBeat, onHoverBeat,
}: {
  acts: ActDef[];
  beats: BeatDef[];
  hoveredBeat: { name: string; tip: string; x: number; y: number } | null;
  onHoverBeat: (b: { name: string; tip: string; x: number; y: number } | null) => void;
}) {
  const LABEL_W = 200;

  return (
    <div className="relative border-b border-border/60 bg-card/40">
      {/* Act bands */}
      <div className="flex" style={{ paddingLeft: LABEL_W }}>
        {acts.map((act, i) => {
          const widthPct = (act.endPct - act.startPct) * 100;
          return (
            <div
              key={i}
              className="flex items-center justify-center border-r border-white/30 py-2 text-[11px] font-semibold"
              style={{ width: `${widthPct}%`, backgroundColor: act.color, color: "#1a1a1a" }}
            >
              <span className="truncate px-1">{act.name}</span>
            </div>
          );
        })}
        {acts.length === 0 && <div className="h-8" />}
      </div>

      {/* Beat markers */}
      <div className="relative" style={{ paddingLeft: LABEL_W, height: 32 }}>
        {beats.map((beat, i) => {
          const leftPct = beat.pct * 100;
          return (
            <div
              key={i}
              className="absolute flex flex-col items-center"
              style={{ left: `calc(${LABEL_W}px + ${leftPct}% - 8px)`, top: 4 }}
              onMouseEnter={(e) => {
                const rect = (e.target as HTMLElement).getBoundingClientRect();
                onHoverBeat({ name: beat.name, tip: beat.tip, x: rect.left, y: rect.bottom });
              }}
              onMouseLeave={() => onHoverBeat(null)}
            >
              <div
                className="h-5 w-5 rounded-full border-2 border-white shadow cursor-default"
                style={{ backgroundColor: beat.color }}
                title={beat.name}
              />
            </div>
          );
        })}
      </div>

      {/* Percentage ruler */}
      <div className="relative border-t border-border/40" style={{ paddingLeft: LABEL_W, height: 22 }}>
        {[0, 25, 50, 75, 100].map((pct, i) => (
          <span
            key={pct}
            className="absolute text-[10px] font-medium text-muted-foreground"
            style={{
              left: i === 4
                ? undefined
                : `calc(${LABEL_W}px + ${pct}% + ${i === 0 ? 4 : -12}px)`,
              right: i === 4 ? 4 : undefined,
              top: 4,
            }}
          >
            {pct}%
          </span>
        ))}
      </div>

      {hoveredBeat && (
        <div
          className="fixed z-50 max-w-[200px] rounded-lg border border-border bg-card px-3 py-2 shadow-lg text-xs"
          style={{ left: hoveredBeat.x, top: hoveredBeat.y + 8 }}
        >
          <p className="font-semibold">{hoveredBeat.name}</p>
          <p className="mt-0.5 text-muted-foreground">{hoveredBeat.tip}</p>
        </div>
      )}
    </div>
  );
}

/* ── Timeline / Arc bars section ── */
function TimelineSection({
  project, onEditArc, onDeleteArc, onAddArc, onUpdateArc,
}: {
  project: Project;
  onEditArc: (arc: PlotArc) => void;
  onDeleteArc: (id: string) => void;
  onAddArc: () => void;
  onUpdateArc: (id: string, patch: Partial<PlotArc>) => void;
}) {
  const LABEL_W = 200;

  return (
    <div className="px-0 py-4">
      {project.arcs.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
          <p className="text-sm text-muted-foreground max-w-xs">
            No arcs yet. Plan your story structure independently of your chapters — add arcs here and write later.
          </p>
          <Button onClick={onAddArc} className="bg-accent text-accent-foreground hover:bg-accent/90" size="sm">
            <Plus className="h-3.5 w-3.5" /> Add your first arc
          </Button>
        </div>
      )}

      {project.arcs.map((arc) => {
        const leftPct = arc.startPct;
        const widthPct = Math.max(arc.endPct - arc.startPct, 2);
        const arcChars = project.characters.filter((c) => arc.characterIds.includes(c.id));

        return (
          <div key={arc.id} className="group flex items-center border-b border-border/30 hover:bg-secondary/20">
            {/* Label column */}
            <div className="flex flex-shrink-0 items-center gap-2 px-4 py-3" style={{ width: LABEL_W }}>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${ARC_TYPE_BADGE[arc.type]}`}>
                    {arc.type}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-xs font-medium">{arc.title}</p>
              </div>
              <button
                onClick={() => onEditArc(arc)}
                className="flex-shrink-0 rounded p-1 text-muted-foreground opacity-0 transition group-hover:opacity-100 hover:bg-secondary hover:text-foreground"
                title="Edit arc"
              >
                <ChevronDown className="h-3 w-3 rotate-90" />
              </button>
            </div>

            {/* Arc bar track */}
            <div className="relative flex-1 py-4">
              <div
                className="relative h-8 rounded-full flex items-center px-3 cursor-pointer"
                style={{
                  marginLeft: `${leftPct}%`,
                  width: `${widthPct}%`,
                  backgroundColor: ARC_STATUS_COLORS[arc.status],
                  opacity: 0.9,
                }}
                onClick={() => onEditArc(arc)}
                title={`${arc.title} — ${ARC_STATUS_LABELS[arc.status]}`}
              >
                <span className="truncate text-[10px] font-semibold text-white">{arc.title}</span>
              </div>

              {arcChars.length > 0 && (
                <div className="mt-1 flex items-center gap-1" style={{ marginLeft: `${leftPct}%` }}>
                  {arcChars.map((c) => (
                    <div
                      key={c.id}
                      className="flex h-5 w-5 items-center justify-center rounded-full text-[8px] font-bold text-white shadow"
                      style={{ backgroundColor: c.color }}
                      title={c.name}
                    >
                      {initials(c.name)}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Status + delete */}
            <div className="flex flex-shrink-0 items-center gap-2 pr-4">
              <select
                value={arc.status}
                onChange={(e) => onUpdateArc(arc.id, { status: e.target.value as ArcStatus })}
                className="rounded border border-border bg-background px-2 py-1 text-[10px] text-muted-foreground"
                onClick={(e) => e.stopPropagation()}
              >
                {(["planned", "active", "resolved"] as ArcStatus[]).map((s) => (
                  <option key={s} value={s}>{ARC_STATUS_LABELS[s]}</option>
                ))}
              </select>
              <button
                onClick={() => onDeleteArc(arc.id)}
                className="rounded p-1 text-muted-foreground opacity-0 transition group-hover:opacity-100 hover:text-destructive"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          </div>
        );
      })}

      {project.arcs.length > 0 && (
        <div className="px-4 pt-4">
          <Button onClick={onAddArc} variant="outline" size="sm" className="gap-1.5 text-xs">
            <Plus className="h-3.5 w-3.5" /> Add arc
          </Button>
        </div>
      )}

      {project.arcs.length > 0 && (
        <div className="flex items-center gap-4 px-4 pt-6 pb-2">
          {(["planned", "active", "resolved"] as ArcStatus[]).map((s) => (
            <span key={s} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <span className="h-2.5 w-5 rounded-full inline-block" style={{ backgroundColor: ARC_STATUS_COLORS[s] }} />
              {ARC_STATUS_LABELS[s]}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Graph / Tension curve section — fixed 20 points, no chapter dependency ── */
function GraphSection({
  acts, beats, tensionCurve, onUpdateCurve,
}: {
  acts: ActDef[];
  beats: BeatDef[];
  tensionCurve: number[];
  onUpdateCurve: (curve: number[]) => void;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const n = TENSION_PTS;
  const initialCurve = tensionCurve.length === n ? tensionCurve : Array(n).fill(50);
  const [localCurve, setLocalCurve] = useState<number[]>(initialCurve);
  const dragging = useRef<{ idx: number } | null>(null);
  const H = 240;
  const PAD = { top: 24, bottom: 32, left: 16, right: 16 };
  const innerH = H - PAD.top - PAD.bottom;

  useEffect(() => {
    if (tensionCurve.length === n) setLocalCurve(tensionCurve);
  }, [tensionCurve, n]);

  const xOf = (i: number, totalW: number) =>
    PAD.left + (i / Math.max(n - 1, 1)) * (totalW - PAD.left - PAD.right);

  const yOf = (v: number) => PAD.top + ((100 - v) / 100) * innerH;

  const getSvgW = () => svgRef.current?.clientWidth ?? 800;

  const getPoints = (w: number) =>
    localCurve.map((v, i) => ({ x: xOf(i, w), y: yOf(v) }));

  const onMouseDown = (e: React.MouseEvent<SVGCircleElement>, idx: number) => {
    e.preventDefault();
    dragging.current = { idx };
  };

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current || !svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      const relY = e.clientY - rect.top;
      const raw = Math.round(100 - ((relY - PAD.top) / innerH) * 100);
      const clamped = Math.max(0, Math.min(100, raw));
      setLocalCurve((prev) => {
        const next = [...prev];
        next[dragging.current!.idx] = clamped;
        return next;
      });
    };
    const onUp = () => {
      if (dragging.current) onUpdateCurve(localCurve);
      dragging.current = null;
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, [localCurve, onUpdateCurve]);

  const svgW = getSvgW();
  const pts = getPoints(svgW);
  const path = smoothPath(pts);
  const areaPath = path ? `${path} L ${pts[pts.length - 1].x},${PAD.top + innerH} L ${pts[0].x},${PAD.top + innerH} Z` : "";

  return (
    <div className="px-8 py-6">
      <p className="mb-3 text-xs text-muted-foreground">Drag the points to shape your story's dramatic tension across the story arc.</p>
      <div className="relative rounded-xl border border-border/60 bg-card overflow-hidden" style={{ height: H }}>
        <svg ref={svgRef} className="absolute inset-0 h-full w-full" style={{ userSelect: "none" }}>
          {/* Act bands */}
          {acts.map((act, i) => {
            const x1 = PAD.left + act.startPct * (svgW - PAD.left - PAD.right);
            const x2 = PAD.left + act.endPct * (svgW - PAD.left - PAD.right);
            return <rect key={i} x={x1} y={PAD.top} width={x2 - x1} height={innerH} fill={act.color} opacity={0.35} />;
          })}

          {/* Y guidelines */}
          {[0, 25, 50, 75, 100].map((v) => (
            <g key={v}>
              <line x1={PAD.left} y1={yOf(v)} x2={svgW - PAD.right} y2={yOf(v)} stroke="#E5E7EB" strokeWidth={1} />
              <text x={PAD.left - 4} y={yOf(v) + 4} textAnchor="end" fontSize={9} fill="#9CA3AF">{v}</text>
            </g>
          ))}

          {/* Area fill */}
          {areaPath && <path d={areaPath} fill="#E8834A" opacity={0.12} />}

          {/* Curve */}
          {path && <path d={path} fill="none" stroke="#E8834A" strokeWidth={2.5} strokeLinecap="round" />}

          {/* Beat markers on curve */}
          {beats.map((beat, i) => {
            const ptIdx = Math.round(beat.pct * (n - 1));
            if (ptIdx < 0 || ptIdx >= pts.length) return null;
            const pt = pts[ptIdx];
            return (
              <g key={i}>
                <circle cx={pt.x} cy={pt.y} r={5} fill={beat.color} stroke="white" strokeWidth={1.5} />
                <text x={pt.x} y={pt.y - 8} textAnchor="middle" fontSize={9} fill={beat.color} fontWeight="600">
                  {beat.name.split(" ").slice(0, 2).join(" ")}
                </text>
              </g>
            );
          })}

          {/* Draggable points */}
          {pts.map((pt, i) => (
            <circle
              key={i}
              cx={pt.x} cy={pt.y} r={6}
              fill="white" stroke="#E8834A" strokeWidth={2}
              style={{ cursor: "ns-resize" }}
              onMouseDown={(e) => onMouseDown(e, i)}
            />
          ))}

          {/* X axis: percentage labels at key positions */}
          {[0, 5, 10, 14, 19].map((i, labelIdx) => {
            const pct = [0, 25, 50, 75, 100][labelIdx];
            const pt = pts[i];
            if (!pt) return null;
            return (
              <text key={i} x={pt.x} y={H - 8} textAnchor="middle" fontSize={9} fill="#9CA3AF">
                {pct}%
              </text>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

/* ── Custom Framework Editor — percentage-based ── */
function CustomFrameworkEditor({
  project, onUpdateActs, onUpdateBeats,
}: {
  project: Project;
  onUpdateActs: (acts: CustomAct[]) => void;
  onUpdateBeats: (beats: CustomBeat[]) => void;
}) {
  const [acts, setActs] = useState<CustomAct[]>(project.customActs);
  const [beats, setBeats] = useState<CustomBeat[]>(project.customBeats);

  const updateActs = (next: CustomAct[]) => { setActs(next); onUpdateActs(next); };
  const updateBeats = (next: CustomBeat[]) => { setBeats(next); onUpdateBeats(next); };

  const addAct = () => updateActs([...acts, { id: crypto.randomUUID(), name: "New Act", startPct: 0, endPct: 100, color: "#BFCFE7" }]);
  const addBeat = () => updateBeats([...beats, { id: crypto.randomUUID(), name: "New Beat", pct: 50, color: "#E8834A" }]);

  const patchAct = (id: string, patch: Partial<CustomAct>) =>
    updateActs(acts.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  const patchBeat = (id: string, patch: Partial<CustomBeat>) =>
    updateBeats(beats.map((b) => (b.id === id ? { ...b, ...patch } : b)));

  return (
    <div className="mx-8 mb-8 rounded-xl border border-border/60 bg-card/60 p-6">
      <h3 className="font-serif text-lg font-semibold">Custom framework</h3>

      {/* Acts */}
      <div className="mt-5">
        <div className="mb-3 flex items-center justify-between">
          <h4 className="text-sm font-medium">Your acts</h4>
          <Button onClick={addAct} variant="outline" size="sm" className="h-7 gap-1 text-xs">
            <Plus className="h-3 w-3" /> Add act
          </Button>
        </div>
        <div className="space-y-2">
          {acts.map((a) => (
            <div key={a.id} className="flex items-center gap-2">
              <input type="color" value={a.color} onChange={(e) => patchAct(a.id, { color: e.target.value })} className="h-7 w-7 cursor-pointer rounded border border-border" />
              <Input value={a.name} onChange={(e) => patchAct(a.id, { name: e.target.value })} className="h-7 flex-1 text-sm" placeholder="Act name" />
              <Input type="number" min={0} max={100} value={a.startPct} onChange={(e) => patchAct(a.id, { startPct: Number(e.target.value) })} className="h-7 w-16 text-sm" placeholder="0" />
              <span className="text-xs text-muted-foreground">%→</span>
              <Input type="number" min={0} max={100} value={a.endPct} onChange={(e) => patchAct(a.id, { endPct: Number(e.target.value) })} className="h-7 w-16 text-sm" placeholder="100" />
              <span className="text-xs text-muted-foreground">%</span>
              <button onClick={() => updateActs(acts.filter((x) => x.id !== a.id))} className="text-muted-foreground hover:text-destructive">
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
          {acts.length === 0 && <p className="text-xs text-muted-foreground">No acts yet.</p>}
        </div>
      </div>

      {/* Beats */}
      <div className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h4 className="text-sm font-medium">Your beats</h4>
          <Button onClick={addBeat} variant="outline" size="sm" className="h-7 gap-1 text-xs">
            <Plus className="h-3 w-3" /> Add beat
          </Button>
        </div>
        <div className="space-y-2">
          {beats.map((b) => (
            <div key={b.id} className="flex items-center gap-2">
              <input type="color" value={b.color} onChange={(e) => patchBeat(b.id, { color: e.target.value })} className="h-7 w-7 cursor-pointer rounded border border-border" />
              <Input value={b.name} onChange={(e) => patchBeat(b.id, { name: e.target.value })} className="h-7 flex-1 text-sm" placeholder="Beat name" />
              <Input type="number" min={0} max={100} value={b.pct} onChange={(e) => patchBeat(b.id, { pct: Number(e.target.value) })} className="h-7 w-16 text-sm" />
              <span className="text-xs text-muted-foreground">%</span>
              <button onClick={() => updateBeats(beats.filter((x) => x.id !== b.id))} className="text-muted-foreground hover:text-destructive">
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
          {beats.length === 0 && <p className="text-xs text-muted-foreground">No beats yet.</p>}
        </div>
      </div>
    </div>
  );
}

/* ── Arc Add/Edit Dialog — percentage sliders instead of chapter numbers ── */
function ArcDialog({
  project, arc, onClose, onSave,
}: {
  project: Project;
  arc: PlotArc | null;
  onClose: () => void;
  onSave: (data: Omit<PlotArc, "id">) => void;
}) {
  const [title, setTitle] = useState(arc?.title ?? "");
  const [type, setType] = useState<ArcType>(arc?.type ?? "subplot");
  const [status, setStatus] = useState<ArcStatus>(arc?.status ?? "planned");
  const [startPct, setStartPct] = useState(arc?.startPct ?? 0);
  const [endPct, setEndPct] = useState(arc?.endPct ?? 100);
  const [charIds, setCharIds] = useState<string[]>(arc?.characterIds ?? []);

  const toggleChar = (id: string) =>
    setCharIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm">
      <div className="w-96 rounded-xl border border-border bg-card p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-lg font-semibold">{arc ? "Edit arc" : "New arc"}</h3>
          <button onClick={onClose}><X className="h-4 w-4 text-muted-foreground" /></button>
        </div>

        <div className="mt-4 space-y-4">
          <div className="space-y-1">
            <Label className="text-xs">Title</Label>
            <Input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Arc title" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Type</Label>
              <div className="flex gap-1.5">
                {(["main", "subplot"] as ArcType[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setType(t)}
                    className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${type === t ? ARC_TYPE_BADGE[t] : "border border-border text-muted-foreground"}`}
                  >
                    {t === "main" ? "Main plot" : "Subplot"}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Status</Label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ArcStatus)}
                className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
              >
                {(["planned", "active", "resolved"] as ArcStatus[]).map((s) => (
                  <option key={s} value={s}>{ARC_STATUS_LABELS[s]}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Percentage range sliders */}
          <div className="space-y-3">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Starts at</Label>
                <span className="text-xs font-medium text-accent">{startPct}%</span>
              </div>
              <input
                type="range" min={0} max={100} step={1}
                value={startPct}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setStartPct(v);
                  if (v >= endPct) setEndPct(Math.min(100, v + 5));
                }}
                className="w-full accent-[#F47920]"
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Ends at</Label>
                <span className="text-xs font-medium text-accent">{endPct}%</span>
              </div>
              <input
                type="range" min={0} max={100} step={1}
                value={endPct}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setEndPct(v);
                  if (v <= startPct) setStartPct(Math.max(0, v - 5));
                }}
                className="w-full accent-[#F47920]"
              />
            </div>
            <p className="text-[11px] text-muted-foreground">
              This arc spans {startPct}%–{endPct}% of the story ({endPct - startPct}% of the total length).
            </p>
          </div>

          {project.characters.length > 0 && (
            <div className="space-y-1.5">
              <Label className="text-xs">Characters</Label>
              <div className="flex flex-wrap gap-1.5">
                {project.characters.map((c) => {
                  const on = charIds.includes(c.id);
                  return (
                    <button
                      key={c.id}
                      onClick={() => toggleChar(c.id)}
                      className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors ${on ? "border-transparent text-white" : "border-border text-muted-foreground hover:text-foreground"}`}
                      style={on ? { backgroundColor: c.color } : {}}
                    >
                      {c.name.split(" ")[0]}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="mt-5 flex gap-2">
          <Button
            onClick={() => onSave({ title, type, status, startPct, endPct, characterIds: charIds })}
            disabled={!title.trim()}
            className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90"
          >
            {arc ? "Save" : "Create arc"}
          </Button>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </div>
  );
}
