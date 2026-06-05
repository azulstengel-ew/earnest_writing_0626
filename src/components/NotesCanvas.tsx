import { useCallback, useEffect, useRef, useState } from "react";
import { Plus, Minus, Maximize2, Type, StickyNote } from "lucide-react";
import { useProjects, type Project, type CanvasObject, type CanvasData } from "@/lib/projects-store";

const GRID_SIZE = 24;

const STICKY_COLORS = [
  "#FFF3B0", "#FFC1B4", "#CFE3CF", "#C9DCEA", "#DCD3EC", "#FDE8D2",
];

export function NotesCanvas({ project }: { project: Project }) {
  const { updateCanvas, addCanvasObject, updateCanvasObject, deleteCanvasObject } = useProjects();
  const canvas: CanvasData = project.canvasData ?? { objects: [], strokes: [], viewX: 0, viewY: 0, zoom: 1 };

  const containerRef = useRef<HTMLDivElement>(null);
  const [tool, setTool] = useState<"select" | "sticky" | "text">("select");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [zoomDisplay, setZoomDisplay] = useState(canvas.zoom);

  const viewRef = useRef({ x: canvas.viewX, y: canvas.viewY, zoom: canvas.zoom });
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0 });

  const saveViewTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveView = useCallback(() => {
    if (saveViewTimer.current) clearTimeout(saveViewTimer.current);
    saveViewTimer.current = setTimeout(() => {
      updateCanvas(project.id, { viewX: viewRef.current.x, viewY: viewRef.current.y, zoom: viewRef.current.zoom });
    }, 500);
  }, [project.id, updateCanvas]);

  const applyTransform = () => {
    const el = containerRef.current;
    if (!el) return;
    el.style.setProperty("--cvx", `${viewRef.current.x}px`);
    el.style.setProperty("--cvy", `${viewRef.current.y}px`);
    el.style.setProperty("--cvz", `${viewRef.current.zoom}`);
    setZoomDisplay(Math.round(viewRef.current.zoom * 100));
  };

  useEffect(() => {
    viewRef.current = { x: canvas.viewX, y: canvas.viewY, zoom: canvas.zoom };
    applyTransform();
  }, [project.id]);

  const toCanvas = (screenX: number, screenY: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: (screenX - rect.left - viewRef.current.x) / viewRef.current.zoom,
      y: (screenY - rect.top - viewRef.current.y) / viewRef.current.zoom,
    };
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target !== containerRef.current && !target.dataset.canvasbg) return;
    if (tool === "select") { setSelectedId(null); return; }

    const pos = toCanvas(e.clientX, e.clientY);
    const colorIndex = canvas.objects.filter(o => o.type === "sticky").length % STICKY_COLORS.length;

    if (tool === "sticky") {
      addCanvasObject(project.id, { type: "sticky", x: pos.x - 90, y: pos.y - 80, width: 180, height: 160, content: "", color: STICKY_COLORS[colorIndex], zIndex: canvas.objects.length });
    } else if (tool === "text") {
      addCanvasObject(project.id, { type: "textbox", x: pos.x - 100, y: pos.y - 20, width: 200, height: 40, content: "", fontSize: "md", zIndex: canvas.objects.length });
    }
    setTool("select");
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.min(2, Math.max(0.25, viewRef.current.zoom * delta));
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    viewRef.current = {
      x: mx - (mx - viewRef.current.x) * (newZoom / viewRef.current.zoom),
      y: my - (my - viewRef.current.y) * (newZoom / viewRef.current.zoom),
      zoom: newZoom,
    };
    applyTransform();
    saveView();
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      isPanning.current = true;
      panStart.current = { x: e.clientX - viewRef.current.x, y: e.clientY - viewRef.current.y };
      e.preventDefault();
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning.current) return;
    viewRef.current.x = e.clientX - panStart.current.x;
    viewRef.current.y = e.clientY - panStart.current.y;
    applyTransform();
  };

  const handleMouseUp = () => {
    if (isPanning.current) { isPanning.current = false; saveView(); }
  };

  const zoomIn = () => {
    viewRef.current.zoom = Math.min(2, viewRef.current.zoom * 1.2);
    applyTransform(); saveView();
  };
  const zoomOut = () => {
    viewRef.current.zoom = Math.max(0.25, viewRef.current.zoom / 1.2);
    applyTransform(); saveView();
  };

  const fitToScreen = () => {
    if (canvas.objects.length === 0) {
      viewRef.current = { x: 0, y: 0, zoom: 1 };
    } else {
      const xs = canvas.objects.flatMap(o => [o.x, o.x + o.width]);
      const ys = canvas.objects.flatMap(o => [o.y, o.y + o.height]);
      const minX = Math.min(...xs) - 40, minY = Math.min(...ys) - 40;
      const maxX = Math.max(...xs) + 40, maxY = Math.max(...ys) + 40;
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const zoom = Math.min(2, Math.max(0.25, Math.min(rect.width / (maxX - minX), rect.height / (maxY - minY)) * 0.9));
      viewRef.current = {
        x: (rect.width - (maxX - minX) * zoom) / 2 - minX * zoom,
        y: (rect.height - (maxY - minY) * zoom) / 2 - minY * zoom,
        zoom,
      };
    }
    applyTransform(); saveView();
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
        <div className="flex items-center gap-2">
          <h1 className="mr-3 font-serif text-lg font-semibold">Notes</h1>
          {([
            { id: "select" as const, label: "Select" },
            { id: "sticky" as const, icon: <StickyNote className="h-3.5 w-3.5" />, label: "Post-it" },
            { id: "text" as const, icon: <Type className="h-3.5 w-3.5" />, label: "Text" },
          ] as Array<{ id: "select"|"sticky"|"text"; icon?: React.ReactNode; label: string }>).map((t) => (
            <button key={t.id} onClick={() => setTool(t.id)} title={t.label}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                tool === t.id ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}>
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={zoomOut} className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground" title="Zoom out">
            <Minus className="h-3.5 w-3.5" />
          </button>
          <span className="w-12 text-center text-xs text-muted-foreground">{zoomDisplay}%</span>
          <button onClick={zoomIn} className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground" title="Zoom in">
            <Plus className="h-3.5 w-3.5" />
          </button>
          <button onClick={fitToScreen} className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground" title="Fit to screen">
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div ref={containerRef}
        className="relative flex-1 overflow-hidden select-none"
        style={{
          backgroundColor: "#F5F0E8",
          backgroundImage: "radial-gradient(circle, #C2CAD8 1px, transparent 1px)",
          backgroundSize: `calc(${GRID_SIZE}px * var(--cvz, 1)) calc(${GRID_SIZE}px * var(--cvz, 1))`,
          backgroundPosition: "var(--cvx, 0px) var(--cvy, 0px)",
          cursor: tool === "select" ? "default" : "crosshair",
        } as React.CSSProperties}
        onClick={handleCanvasClick}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        data-canvasbg="1"
      >
        {/* Transformed layer */}
        <div style={{
          position: "absolute", top: 0, left: 0, transformOrigin: "0 0",
          transform: "translate(var(--cvx, 0px), var(--cvy, 0px)) scale(var(--cvz, 1))",
        }}>
          {canvas.objects.map(obj => (
            <CanvasItem key={obj.id} obj={obj}
              isSelected={selectedId === obj.id}
              isEditing={editingId === obj.id}
              zoom={viewRef.current.zoom}
              onSelect={() => { setSelectedId(obj.id); setEditingId(null); }}
              onEdit={() => setEditingId(obj.id)}
              onBlur={() => setEditingId(null)}
              onChange={(patch) => updateCanvasObject(project.id, obj.id, patch)}
              onDelete={() => { deleteCanvasObject(project.id, obj.id); setSelectedId(null); }}
            />
          ))}
        </div>

        {canvas.objects.length === 0 && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-muted-foreground/40">
            <p className="text-sm">A blank canvas. Choose a tool above to start.</p>
            <p className="mt-1 text-xs">Alt + drag to pan · Scroll to zoom</p>
          </div>
        )}
      </div>
    </div>
  );
}

function CanvasItem({
  obj, isSelected, isEditing, zoom, onSelect, onEdit, onBlur, onChange, onDelete,
}: {
  obj: CanvasObject; isSelected: boolean; isEditing: boolean; zoom: number;
  onSelect: () => void; onEdit: () => void; onBlur: () => void;
  onChange: (patch: Partial<CanvasObject>) => void; onDelete: () => void;
}) {
  const dragStart = useRef<{ screenX: number; screenY: number; objX: number; objY: number } | null>(null);

  const onMouseDown = (e: React.MouseEvent) => {
    if (isEditing) return;
    e.stopPropagation();
    onSelect();
    dragStart.current = { screenX: e.clientX, screenY: e.clientY, objX: obj.x, objY: obj.y };
    const move = (me: MouseEvent) => {
      if (!dragStart.current) return;
      onChange({
        x: dragStart.current.objX + (me.clientX - dragStart.current.screenX) / zoom,
        y: dragStart.current.objY + (me.clientY - dragStart.current.screenY) / zoom,
      });
    };
    const up = () => { dragStart.current = null; window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  };

  const fontSize = obj.fontSize === "sm" ? 13 : obj.fontSize === "lg" ? 18 : 15;

  if (obj.type === "sticky") {
    return (
      <div onMouseDown={onMouseDown} onDoubleClick={onEdit}
        style={{
          position: "absolute", left: obj.x, top: obj.y, width: obj.width, minHeight: obj.height,
          backgroundColor: obj.color ?? "#FFF3B0", borderRadius: 4,
          boxShadow: isSelected ? "0 0 0 2px #F47920, 0 4px 16px rgba(0,0,0,0.15)" : "0 2px 8px rgba(0,0,0,0.12)",
          cursor: isEditing ? "text" : "grab",
          transform: `rotate(${(parseInt(obj.id.slice(0, 2), 16) % 5) - 2}deg)`,
          transition: "box-shadow 0.15s",
        }}>
        <div style={{ padding: "8px 8px 4px", display: "flex", justifyContent: "flex-end" }}>
          {isSelected && (
            <button onMouseDown={(e) => { e.stopPropagation(); onDelete(); }}
              style={{ fontSize: 10, color: "rgba(0,0,0,0.4)", background: "none", border: "none", cursor: "pointer", padding: 2 }}>
              ✕
            </button>
          )}
        </div>
        {isEditing ? (
          <textarea autoFocus value={obj.content ?? ""}
            onChange={(e) => onChange({ content: e.target.value })} onBlur={onBlur}
            style={{ width: "100%", minHeight: 100, padding: "0 12px 12px", background: "transparent", border: "none", outline: "none", resize: "none", fontSize, fontFamily: "'Cormorant Garamond', Georgia, serif", lineHeight: 1.5, color: "rgba(0,0,0,0.8)" }} />
        ) : (
          <div style={{ padding: "0 12px 12px", fontSize, fontFamily: "'Cormorant Garamond', Georgia, serif", lineHeight: 1.5, color: "rgba(0,0,0,0.8)", minHeight: 100, whiteSpace: "pre-wrap" }}>
            {obj.content || <span style={{ color: "rgba(0,0,0,0.3)", fontStyle: "italic" }}>An idea…</span>}
          </div>
        )}
      </div>
    );
  }

  if (obj.type === "textbox") {
    return (
      <div onMouseDown={onMouseDown} onDoubleClick={onEdit}
        style={{
          position: "absolute", left: obj.x, top: obj.y, width: obj.width, minHeight: obj.height,
          outline: isSelected ? "2px solid #F47920" : isEditing ? "1px solid #C2CAD8" : "none",
          borderRadius: 4, cursor: isEditing ? "text" : "grab", padding: 4,
        }}>
        {isSelected && (
          <button onMouseDown={(e) => { e.stopPropagation(); onDelete(); }}
            style={{ position: "absolute", top: -10, right: -10, width: 20, height: 20, borderRadius: "50%", background: "#FF5050", color: "#fff", border: "none", fontSize: 10, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            ✕
          </button>
        )}
        {isEditing ? (
          <textarea autoFocus value={obj.content ?? ""}
            onChange={(e) => onChange({ content: e.target.value })} onBlur={onBlur}
            style={{ width: "100%", minHeight: 32, background: "transparent", border: "none", outline: "none", resize: "both", fontSize, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.6, color: "#1B2A4A" }} />
        ) : (
          <div style={{ fontSize, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.6, color: "#1B2A4A", minHeight: 32, whiteSpace: "pre-wrap" }}>
            {obj.content || <span style={{ color: "#C2CAD8" }}>Text…</span>}
          </div>
        )}
      </div>
    );
  }

  return null;
}
