import { useEffect, useRef, useState } from "react";
import {
  Users,
  Plus,
  X,
  Trash2,
  Tag,
  ChevronDown,
  LayoutGrid,
  List,
  Network,
  Sparkles,
  ImageOff,
  ArrowUpDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  useProjects,
  type Character,
  type CharacterRole,
  type CharacterConnection,
  type ConnectionType,
  type Project,
  CONNECTION_COLORS,
  CONNECTION_LABELS,
} from "@/lib/projects-store";

type CharView = "web" | "grid" | "list";
type SortKey = "name" | "role" | "motivation";

const ROLE_LABEL: Record<CharacterRole, string> = {
  protagonist: "Protagonist",
  supporting: "Supporting",
  minor: "Minor",
};

const ROLE_SIZE: Record<CharacterRole, number> = {
  protagonist: 76,
  supporting: 56,
  minor: 40,
};

const ROLE_BADGE: Record<CharacterRole, string> = {
  protagonist: "bg-amber-100 text-amber-800",
  supporting: "bg-blue-100 text-blue-800",
  minor: "bg-zinc-100 text-zinc-600",
};

const CONNECTION_TYPE_OPTIONS: ConnectionType[] = [
  "family", "romantic", "antagonistic", "alliance", "mentor-student", "custom",
];

function initials(name: string) {
  return name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

export function CharactersView({ project }: { project: Project }) {
  const { createCharacter, updateCharacter, deleteCharacter, addConnection, removeConnection } = useProjects();
  const [view, setView] = useState<CharView>("web");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showNewChar, setShowNewChar] = useState(false);

  const selectedChar = project.characters.find((c) => c.id === selectedId) ?? null;

  return (
    <div className="flex h-full flex-1 overflow-hidden">
      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/60 px-8 py-5">
          <div>
            <h1 className="font-serif text-2xl font-semibold tracking-tight">Characters</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {project.characters.length} character{project.characters.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* View toggle */}
            <div className="inline-flex rounded-lg border border-border bg-card p-1">
              {([["web", Network], ["grid", LayoutGrid], ["list", List]] as [CharView, React.ElementType][]).map(([v, Icon]) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  title={v.charAt(0).toUpperCase() + v.slice(1)}
                  className={`rounded-md p-2 text-sm transition-colors ${
                    view === v ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </button>
              ))}
            </div>
            <Button
              onClick={() => setShowNewChar(true)}
              className="bg-accent text-accent-foreground hover:bg-accent/90"
              size="sm"
            >
              <Plus className="h-4 w-4" /> New character
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {view === "web" && (
            <WebView
              project={project}
              selectedId={selectedId}
              onSelect={setSelectedId}
              addConnection={addConnection}
              removeConnection={removeConnection}
              updateCharacter={updateCharacter}
            />
          )}
          {view === "grid" && (
            <GridView
              characters={project.characters}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
          )}
          {view === "list" && (
            <ListView
              project={project}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
          )}
        </div>
      </div>

      {/* Detail panel */}
      {selectedChar ? (
        <CharacterDetail
          key={selectedChar.id}
          project={project}
          character={selectedChar}
          onClose={() => setSelectedId(null)}
          onUpdate={(patch) => updateCharacter(project.id, selectedChar.id, patch)}
          onDelete={() => { deleteCharacter(project.id, selectedChar.id); setSelectedId(null); }}
        />
      ) : (
        <div className="flex w-80 flex-shrink-0 flex-col items-center justify-center gap-3 border-l border-border/60 bg-card/30 text-center p-8">
          <Users className="h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">Select a character to view details</p>
        </div>
      )}

      {/* New character modal */}
      {showNewChar && (
        <NewCharacterModal
          onClose={() => setShowNewChar(false)}
          onCreate={(input) => {
            const c = createCharacter(project.id, input);
            setSelectedId(c.id);
            setShowNewChar(false);
          }}
        />
      )}
    </div>
  );
}

/* ── Web / Detective Board View ── */
function WebView({
  project,
  selectedId,
  onSelect,
  addConnection,
  removeConnection,
  updateCharacter,
}: {
  project: Project;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  addConnection: ReturnType<typeof useProjects>["addConnection"];
  removeConnection: ReturnType<typeof useProjects>["removeConnection"];
  updateCharacter: ReturnType<typeof useProjects>["updateCharacter"];
}) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ id: string; offX: number; offY: number } | null>(null);
  const [connectFrom, setConnectFrom] = useState<string | null>(null);
  const [connectMode, setConnectMode] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const connectDragRef = useRef<{ fromId: string; x: number; y: number } | null>(null);
  const [connectLine, setConnectLine] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);
  const [pendingConn, setPendingConn] = useState<{ fromId: string; toId: string } | null>(null);
  const [connLabel, setConnLabel] = useState("");
  const [connType, setConnType] = useState<ConnectionType>("alliance");
  const [connColor, setConnColor] = useState("#9CA3AF");
  const [canvasSize, setCanvasSize] = useState({ w: 800, h: 600 });

  useEffect(() => {
    const obs = new ResizeObserver((entries) => {
      const e = entries[0];
      if (e) setCanvasSize({ w: e.contentRect.width, h: e.contentRect.height });
    });
    if (canvasRef.current) obs.observe(canvasRef.current);
    return () => obs.disconnect();
  }, []);

  const onMouseDown = (e: React.MouseEvent, char: Character) => {
    if (connectMode) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const size = ROLE_SIZE[char.role];
    dragRef.current = {
      id: char.id,
      offX: e.clientX - rect.left - char.x,
      offY: e.clientY - rect.top - char.y,
    };
    e.preventDefault();
  };

  useEffect(() => {
    const move = (e: MouseEvent) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const d = dragRef.current;
      if (d) {
        const x = Math.max(40, Math.min(canvasSize.w - 40, e.clientX - rect.left - d.offX));
        const y = Math.max(40, Math.min(canvasSize.h - 40, e.clientY - rect.top - d.offY));
        updateCharacter(project.id, d.id, { x, y });
      }
      const cd = connectDragRef.current;
      if (cd) setConnectLine({ x1: cd.x, y1: cd.y, x2: e.clientX - rect.left, y2: e.clientY - rect.top });
    };
    const up = (e: MouseEvent) => {
      dragRef.current = null;
      if (connectDragRef.current) {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (rect) {
          const mx = e.clientX - rect.left, my = e.clientY - rect.top;
          const target = project.characters.find(ch => {
            const s = ROLE_SIZE[ch.role], cx = ch.x+s/2, cy = ch.y+s/2;
            return Math.sqrt((mx-cx)**2+(my-cy)**2) < s/2+10;
          });
          if (target && target.id !== connectDragRef.current.fromId)
            setPendingConn({ fromId: connectDragRef.current.fromId, toId: target.id });
        }
        connectDragRef.current = null; setConnectFrom(null); setConnectLine(null);
      }
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    return () => { window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); };
  }, [project.id, updateCharacter, canvasSize]);

  const onHandleMouseDown = (e: React.MouseEvent, char: Character) => {
    e.stopPropagation(); e.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const size = ROLE_SIZE[char.role];
    connectDragRef.current = { fromId: char.id, x: char.x + size/2, y: char.y + size/2 };
    setConnectFrom(char.id);
  };

  const handleNodeClick = (char: Character) => {
    if (!connectMode) {
      onSelect(char.id);
      return;
    }
    if (!connectFrom) {
      setConnectFrom(char.id);
      return;
    }
    if (connectFrom === char.id) {
      setConnectFrom(null);
      return;
    }
    setPendingConn({ fromId: connectFrom, toId: char.id });
    setConnectFrom(null);
  };

  const confirmConnection = () => {
    if (!pendingConn) return;
    addConnection(project.id, {
      ...pendingConn,
      type: connType,
      label: connLabel,
      color: connType === "custom" ? connColor : undefined,
    });
    setPendingConn(null);
    setConnLabel("");
    setConnType("alliance");
    setConnectMode(false);
  };

  const getNodeCenter = (char: Character) => {
    const size = ROLE_SIZE[char.role];
    return { cx: char.x + size / 2, cy: char.y + size / 2 };
  };

  return (
    <div className="relative flex h-full flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-3 border-b border-border/40 bg-card/60 px-6 py-2.5">
        <button
          onClick={() => { setConnectMode((v) => !v); setConnectFrom(null); }}
          className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            connectMode
              ? "bg-accent text-accent-foreground"
              : "border border-border bg-background text-muted-foreground hover:text-foreground"
          }`}
        >
          <Network className="h-3.5 w-3.5" />
          {connectMode ? (connectFrom ? "Click target…" : "Click source…") : "Connect characters"}
        </button>
        {connectMode && (
          <button onClick={() => { setConnectMode(false); setConnectFrom(null); }} className="text-xs text-muted-foreground hover:text-foreground">
            Cancel
          </button>
        )}
        <div className="ml-auto flex flex-wrap items-center gap-3 text-[11px]">
          {Object.entries(CONNECTION_COLORS).filter(([k]) => k !== "custom").map(([type, color]) => (
            <span key={type} className="flex items-center gap-1.5 text-muted-foreground">
              <span className="h-2.5 w-5 rounded-full inline-block" style={{ backgroundColor: color }} />
              {CONNECTION_LABELS[type as ConnectionType]}
            </span>
          ))}
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={canvasRef}
        className="relative flex-1 overflow-hidden select-none"
        style={{
          backgroundColor: "#FAF6EE",
          backgroundImage: "radial-gradient(circle, rgba(0,0,0,0.07) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
          cursor: connectMode ? "crosshair" : "default",
        }}
      >
        {/* SVG connections */}
        <svg className="pointer-events-none absolute inset-0 h-full w-full">
          {project.connections.map((conn) => {
            const from = project.characters.find((c) => c.id === conn.fromId);
            const to = project.characters.find((c) => c.id === conn.toId);
            if (!from || !to) return null;
            const { cx: x1, cy: y1 } = getNodeCenter(from);
            const { cx: x2, cy: y2 } = getNodeCenter(to);
            const mx = (x1 + x2) / 2;
            const my = (y1 + y2) / 2;
            const color = conn.type === "custom" ? (conn.color ?? "#9CA3AF") : CONNECTION_COLORS[conn.type];
            return (
              <g key={conn.id}>
                <line
                  x1={x1} y1={y1} x2={x2} y2={y2}
                  stroke={color}
                  strokeWidth={2.5}
                  strokeDasharray={conn.type === "antagonistic" ? "6 3" : undefined}
                  opacity={0.75}
                />
                {conn.label && (
                  <text
                    x={mx} y={my - 7}
                    textAnchor="middle"
                    fontSize={11}
                    fill={color}
                    fontFamily="system-ui, sans-serif"
                    fontWeight="600"
                  >
                    {conn.label}
                  </text>
                )}
                </g>
            );
          })}
          {connectLine && <line x1={connectLine.x1} y1={connectLine.y1} x2={connectLine.x2} y2={connectLine.y2} stroke="#F47920" strokeWidth={2} strokeDasharray="6 3" opacity={0.8} />}
        </svg>

        {/* Character nodes */}
        {project.characters.map((char) => {
          const size = ROLE_SIZE[char.role];
          const isSelected = selectedId === char.id;
          const isConnectSrc = connectFrom === char.id;
          return (
            <div
              key={char.id}
              onMouseDown={(e) => onMouseDown(e, char)}
              onMouseEnter={() => setHoveredId(char.id)}
              onMouseLeave={() => setHoveredId(null)}
              onClick={() => handleNodeClick(char)}
              className="absolute flex items-center justify-center rounded-full font-bold text-white shadow-md transition-shadow hover:shadow-lg"
              style={{
                left: char.x,
                top: char.y,
                width: size,
                height: size,
                backgroundColor: char.color,
                fontSize: size > 60 ? 18 : size > 48 ? 14 : 11,
                cursor: connectMode ? "pointer" : "grab",
                outline: isSelected ? "3px solid #E8834A" : isConnectSrc ? "3px solid #60A5FA" : "2px solid rgba(255,255,255,0.4)",
                outlineOffset: 2,
                zIndex: isSelected || isConnectSrc ? 10 : 1,
              }}
              title={char.name}
            >
              {initials(char.name)}
              {hoveredId === char.id && (
                <div onMouseDown={(e) => onHandleMouseDown(e, char)}
                  className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full border-2 border-white cursor-crosshair z-20 hover:scale-125 transition-transform"
                  style={{ backgroundColor: "#F47920" }} title="Drag to connect" />
              )}
            </div>
          );
        })}

        {/* Names under nodes */}
        {project.characters.map((char) => {
          const size = ROLE_SIZE[char.role];
          return (
            <div
              key={`lbl-${char.id}`}
              className="pointer-events-none absolute text-center"
              style={{
                left: char.x + size / 2,
                top: char.y + size + 4,
                transform: "translateX(-50%)",
                fontSize: 11,
                fontWeight: 600,
                color: "#1A1A1A",
                whiteSpace: "nowrap",
              }}
            >
              {char.name.split(" ")[0]}
            </div>
          );
        })}

        {project.characters.length === 0 && (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Add your first character to begin building the board.
          </div>
        )}
      </div>

      {/* Connection dialog */}
      {pendingConn && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm">
          <div className="w-80 rounded-xl border border-border bg-card p-6 shadow-2xl">
            <h3 className="font-serif text-lg font-semibold">Add connection</h3>
            <div className="mt-4 space-y-3">
              <div>
                <Label className="text-xs">Relationship label</Label>
                <Input
                  autoFocus
                  value={connLabel}
                  onChange={(e) => setConnLabel(e.target.value)}
                  placeholder="e.g. Best friends"
                  className="mt-1"
                  onKeyDown={(e) => e.key === "Enter" && confirmConnection()}
                />
              </div>
              <div>
                <Label className="text-xs">Relationship type</Label>
                <div className="mt-1.5 grid grid-cols-2 gap-1.5">
                  {CONNECTION_TYPE_OPTIONS.map((t) => {
                    const color = CONNECTION_COLORS[t];
                    return (
                      <button
                        key={t}
                        onClick={() => setConnType(t)}
                        className={`flex items-center gap-2 rounded-md border px-2.5 py-2 text-xs transition-colors ${
                          connType === t ? "border-accent bg-accent/10" : "border-border hover:bg-secondary"
                        }`}
                      >
                        <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                        {CONNECTION_LABELS[t]}
                      </button>
                    );
                  })}
                </div>
              </div>
              {connType === "custom" && (
                <div>
                  <Label className="text-xs">Custom colour</Label>
                  <input
                    type="color"
                    value={connColor}
                    onChange={(e) => setConnColor(e.target.value)}
                    className="mt-1 h-8 w-full cursor-pointer rounded border border-border"
                  />
                </div>
              )}
            </div>
            <div className="mt-5 flex gap-2">
              <Button onClick={confirmConnection} className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90">
                Add
              </Button>
              <Button variant="ghost" onClick={() => setPendingConn(null)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}

      {/* Connection delete buttons */}
      {project.connections.map((conn) => {
        const from = project.characters.find((c) => c.id === conn.fromId);
        const to = project.characters.find((c) => c.id === conn.toId);
        if (!from || !to) return null;
        const { cx: x1, cy: y1 } = getNodeCenter(from);
        const { cx: x2, cy: y2 } = getNodeCenter(to);
        const mx = (x1 + x2) / 2;
        const my = (y1 + y2) / 2;
        return (
          <button
            key={`del-${conn.id}`}
            onClick={() => removeConnection(project.id, conn.id)}
            title="Remove connection"
            className="absolute z-20 flex h-5 w-5 items-center justify-center rounded-full bg-background border border-border text-muted-foreground opacity-0 hover:opacity-100 shadow transition-opacity hover:text-destructive"
            style={{ left: mx + 10, top: my - 10 }}
          >
            <X className="h-2.5 w-2.5" />
          </button>
        );
      })}
    </div>
  );
}

/* ── Grid View ── */
function GridView({
  characters,
  selectedId,
  onSelect,
}: {
  characters: Character[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  if (characters.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        No characters yet. Add one above.
      </div>
    );
  }
  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="grid grid-cols-2 gap-5 lg:grid-cols-3">
        {characters.map((char) => (
          <button
            key={char.id}
            onClick={() => onSelect(char.id)}
            className={`rounded-xl border p-5 text-left transition-all hover:-translate-y-0.5 hover:shadow-md ${
              selectedId === char.id ? "border-accent ring-1 ring-accent" : "border-border/70 bg-card hover:border-border"
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold text-white shadow"
                style={{ backgroundColor: char.color }}
              >
                {initials(char.name)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-serif font-semibold leading-tight truncate">{char.name}</p>
                <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${ROLE_BADGE[char.role]}`}>
                  {ROLE_LABEL[char.role]}
                </span>
              </div>
            </div>
            {char.motivation && (
              <p className="mt-3 text-xs text-muted-foreground line-clamp-2">{char.motivation}</p>
            )}
            {char.traits.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1">
                {char.traits.slice(0, 4).map((t) => (
                  <span key={t} className="rounded-full bg-secondary px-2 py-0.5 text-[10px] text-muted-foreground">
                    {t}
                  </span>
                ))}
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── List View ── */
function ListView({
  project,
  selectedId,
  onSelect,
}: {
  project: Project;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const [sortKey, setSortKey] = useState<SortKey>("role");
  const sorted = [...project.characters].sort((a, b) => {
    if (sortKey === "role") {
      const order = { protagonist: 0, supporting: 1, minor: 2 };
      return order[a.role] - order[b.role];
    }
    return (a[sortKey] ?? "").localeCompare(b[sortKey] ?? "");
  });

  if (sorted.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        No characters yet. Add one above.
      </div>
    );
  }

  const SortBtn = ({ k, label }: { k: SortKey; label: string }) => (
    <button
      onClick={() => setSortKey(k)}
      className={`flex items-center gap-1 text-xs uppercase tracking-wider transition-colors ${
        sortKey === k ? "text-foreground" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {label}
      <ArrowUpDown className="h-3 w-3" />
    </button>
  );

  return (
    <div className="h-full overflow-y-auto">
      <table className="w-full text-sm">
        <thead className="sticky top-0 border-b border-border/60 bg-card/80 backdrop-blur">
          <tr>
            <th className="px-6 py-3 text-left font-medium">
              <SortBtn k="name" label="Name" />
            </th>
            <th className="px-4 py-3 text-left font-medium">
              <SortBtn k="role" label="Role" />
            </th>
            <th className="px-4 py-3 text-left font-medium">
              <SortBtn k="motivation" label="Motivation" />
            </th>
            <th className="px-4 py-3 text-left font-medium text-xs uppercase tracking-wider text-muted-foreground">Traits</th>
            <th className="px-4 py-3 text-left font-medium text-xs uppercase tracking-wider text-muted-foreground">Chapters</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((char, i) => (
            <tr
              key={char.id}
              onClick={() => onSelect(char.id)}
              className={`cursor-pointer border-b border-border/40 transition-colors hover:bg-secondary/40 ${
                selectedId === char.id ? "bg-accent/5" : i % 2 === 0 ? "" : "bg-card/30"
              }`}
            >
              <td className="px-6 py-3">
                <div className="flex items-center gap-2.5">
                  <div
                    className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                    style={{ backgroundColor: char.color }}
                  >
                    {initials(char.name)}
                  </div>
                  <span className="font-medium">{char.name}</span>
                </div>
              </td>
              <td className="px-4 py-3">
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${ROLE_BADGE[char.role]}`}>
                  {ROLE_LABEL[char.role]}
                </span>
              </td>
              <td className="px-4 py-3 max-w-xs">
                <span className="line-clamp-1 text-muted-foreground">{char.motivation || "—"}</span>
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-1">
                  {char.traits.slice(0, 3).map((t) => (
                    <span key={t} className="rounded-full bg-secondary px-2 py-0.5 text-[10px] text-muted-foreground">{t}</span>
                  ))}
                </div>
              </td>
              <td className="px-4 py-3 text-muted-foreground">{char.chapterIds.length || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── Character Detail Panel ── */
function CharacterDetail({
  project,
  character,
  onClose,
  onUpdate,
  onDelete,
}: {
  project: Project;
  character: Character;
  onClose: () => void;
  onUpdate: (patch: Partial<Character>) => void;
  onDelete: () => void;
}) {
  const [name, setName] = useState(character.name);
  const [role, setRole] = useState<CharacterRole>(character.role);
  const [motivation, setMotivation] = useState(character.motivation);
  const [backstory, setBackstory] = useState(character.backstory);
  const [traitsRaw, setTraitsRaw] = useState(character.traits.join(", "));
  const [age, setAge] = useState(character.age ?? "");
  const [height, setHeight] = useState(character.height ?? "");
  const [build, setBuild] = useState(character.build ?? "");
  const [hair, setHair] = useState(character.hair ?? "");
  const [eyes, setEyes] = useState(character.eyes ?? "");
  const [distinguishing, setDistinguishing] = useState(character.distinguishing ?? "");
  const [appearance, setAppearance] = useState(character.appearance ?? "");
  const [color, setColor] = useState(character.color);
  const [physOpen, setPhysOpen] = useState(false);

  const save = () => {
    onUpdate({
      name,
      role,
      motivation,
      backstory,
      traits: traitsRaw.split(",").map((t) => t.trim()).filter(Boolean),
      age: age || undefined,
      height: height || undefined,
      build: build || undefined,
      hair: hair || undefined,
      eyes: eyes || undefined,
      distinguishing: distinguishing || undefined,
      appearance: appearance || undefined,
      color,
    });
  };

  useEffect(() => {
    const id = setTimeout(save, 800);
    return () => clearTimeout(id);
  }, [name, role, motivation, backstory, traitsRaw, age, height, build, hair, eyes, distinguishing, appearance, color]);

  const chapterNames = project.chapters.filter((c) => character.chapterIds.includes(c.id));

  return (
    <div className="flex w-80 flex-shrink-0 flex-col border-l border-border/60 bg-card/40 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border/60 px-5 py-4">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div
            className="h-9 w-9 flex-shrink-0 rounded-full flex items-center justify-center text-sm font-bold text-white"
            style={{ backgroundColor: color }}
          >
            {initials(name || "?")}
          </div>
          <div className="min-w-0">
            <p className="font-serif font-semibold truncate">{name || "Unnamed"}</p>
            <span className={`text-[10px] font-medium uppercase tracking-wide rounded-full px-2 py-0.5 ${ROLE_BADGE[role]}`}>
              {ROLE_LABEL[role]}
            </span>
          </div>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Fields */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        <div className="flex gap-2">
          <div className="flex-1 space-y-1">
            <Label className="text-xs">Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="h-8 text-sm" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Colour</Label>
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-8 w-12 cursor-pointer rounded border border-border" />
          </div>
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Role</Label>
          <div className="flex gap-1.5">
            {(["protagonist", "supporting", "minor"] as CharacterRole[]).map((r) => (
              <button
                key={r}
                onClick={() => setRole(r)}
                className={`rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide transition-colors ${
                  role === r ? ROLE_BADGE[r] + " ring-1 ring-inset ring-current" : "bg-secondary text-muted-foreground"
                }`}
              >
                {ROLE_LABEL[r]}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Motivation</Label>
          <Textarea value={motivation} onChange={(e) => setMotivation(e.target.value)} rows={2} className="text-sm resize-none" placeholder="What drives this character?" />
        </div>

        <div className="space-y-1">
          <Label className="text-xs flex items-center gap-1.5"><Tag className="h-3 w-3" />Traits (comma-separated)</Label>
          <Input value={traitsRaw} onChange={(e) => setTraitsRaw(e.target.value)} className="h-8 text-sm" placeholder="witty, ambitious, reckless" />
          {traitsRaw && (
            <div className="flex flex-wrap gap-1 pt-1">
              {traitsRaw.split(",").map((t) => t.trim()).filter(Boolean).map((t) => (
                <span key={t} className="rounded-full bg-secondary px-2 py-0.5 text-[10px] text-muted-foreground">{t}</span>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Backstory</Label>
          <Textarea value={backstory} onChange={(e) => setBackstory(e.target.value)} rows={3} className="text-sm resize-none" placeholder="Background, history, origin…" />
        </div>

        {/* Physical description accordion */}
        <div className="rounded-lg border border-border/60">
          <button
            onClick={() => setPhysOpen((v) => !v)}
            className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium"
          >
            Physical description
            <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${physOpen ? "rotate-180" : ""}`} />
          </button>
          {physOpen && (
            <div className="border-t border-border/60 px-4 pb-4 pt-3 space-y-3">
              {([
                ["Age", age, setAge],
                ["Height", height, setHeight],
                ["Build", build, setBuild],
                ["Hair", hair, setHair],
                ["Eyes", eyes, setEyes],
                ["Distinguishing features", distinguishing, setDistinguishing],
              ] as [string, string, (v: string) => void][]).map(([lbl, val, setter]) => (
                <div key={lbl} className="space-y-1">
                  <Label className="text-xs">{lbl}</Label>
                  <Input value={val} onChange={(e) => setter(e.target.value)} className="h-7 text-xs" />
                </div>
              ))}
              <div className="space-y-1">
                <Label className="text-xs">General appearance notes</Label>
                <Textarea value={appearance} onChange={(e) => setAppearance(e.target.value)} rows={2} className="text-xs resize-none" />
              </div>
            </div>
          )}
        </div>

        {/* Chapters */}
        {chapterNames.length > 0 && (
          <div className="space-y-1.5">
            <Label className="text-xs">Appears in</Label>
            <div className="space-y-1">
              {chapterNames.map((c) => (
                <div key={c.id} className="rounded-md bg-secondary/60 px-3 py-1.5 text-xs text-muted-foreground">
                  Ch. {c.number} — {c.title}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI / placeholder buttons */}
        <div className="space-y-2 pt-1">
          <button className="flex w-full items-center gap-2 rounded-lg border border-border/60 px-4 py-2.5 text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            Suggest similar names
          </button>
          <button disabled className="flex w-full cursor-not-allowed items-center gap-2 rounded-lg border border-border/40 px-4 py-2.5 text-xs text-muted-foreground/50">
            <ImageOff className="h-3.5 w-3.5" />
            Generate portrait — coming soon
          </button>
        </div>

        <div className="pt-2">
          <button
            onClick={onDelete}
            className="flex items-center gap-1.5 text-xs text-muted-foreground/60 transition-colors hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete character
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── New Character Modal ── */
function NewCharacterModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (input: Partial<Character> & { name: string }) => void;
}) {
  const [name, setName] = useState("");
  const [role, setRole] = useState<CharacterRole>("supporting");

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm">
      <div className="w-80 rounded-xl border border-border bg-card p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-lg font-semibold">New character</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-4 space-y-4">
          <div className="space-y-1">
            <Label className="text-xs">Name</Label>
            <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Character name" onKeyDown={(e) => e.key === "Enter" && name.trim() && onCreate({ name: name.trim(), role })} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Role</Label>
            <div className="flex gap-1.5">
              {(["protagonist", "supporting", "minor"] as CharacterRole[]).map((r) => (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  className={`rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide transition-colors ${
                    role === r ? ROLE_BADGE[r] : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {ROLE_LABEL[r]}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-5 flex gap-2">
          <Button
            onClick={() => name.trim() && onCreate({ name: name.trim(), role })}
            disabled={!name.trim()}
            className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90"
          >
            Create
          </Button>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </div>
  );
}
