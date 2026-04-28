import { useEffect, useRef, useState, type PointerEvent, type WheelEvent } from "react";
import { Maximize2, ZoomIn, ZoomOut } from "lucide-react";
import { atomData } from "../data/atoms";
import type { AtomParticle, Bond, SimulationSettings, SimulationState } from "../types";
import { bondKindLabel } from "../simulation/chemistry";

type Props = {
  state: SimulationState;
  settings: SimulationSettings;
  width: number;
  height: number;
  onResize: (width: number, height: number) => void;
  onSelectAtom: (id: string | null) => void;
  onSelectBond: (id: string | null) => void;
  onMoveAtom: (id: string, x: number, y: number) => void;
  onZoom: (zoom: number) => void;
};

const devicePixelRatioSafe = () => Math.min(window.devicePixelRatio || 1, 2);

export function SimulationCanvas({ state, settings, width, height, onResize, onSelectAtom, onSelectBond, onMoveAtom, onZoom }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);

  useEffect(() => {
    if (!wrapRef.current) return;
    const observer = new ResizeObserver(([entry]) => {
      const box = entry.contentRect;
      onResize(box.width, box.height);
    });
    observer.observe(wrapRef.current);
    return () => observer.disconnect();
  }, [onResize]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = devicePixelRatioSafe();
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw(ctx, state, settings, width, height);
  }, [height, settings, state, width]);

  const pointerPoint = (event: PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const screenX = event.clientX - rect.left;
    const screenY = event.clientY - rect.top;
    return screenToWorld(screenX, screenY, width, height, settings.zoom);
  };

  const onPointerDown = (event: PointerEvent<HTMLCanvasElement>) => {
    const point = pointerPoint(event);
    const atom = nearestAtom(state.atoms, point.x, point.y);
    if (atom) {
      setDragging(atom.id);
      onSelectAtom(atom.id);
      event.currentTarget.setPointerCapture(event.pointerId);
      return;
    }
    const bond = nearestBond(state.bonds, state.atoms, point.x, point.y);
    if (bond) {
      onSelectBond(bond.id);
      return;
    }
    onSelectAtom(null);
    onSelectBond(null);
  };

  const onPointerMove = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!dragging) return;
    const point = pointerPoint(event);
    onMoveAtom(dragging, point.x, point.y);
  };

  const onPointerUp = (event: PointerEvent<HTMLCanvasElement>) => {
    setDragging(null);
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // Pointer capture may already be released by the browser.
    }
  };

  const setZoom = (zoom: number) => {
    onZoom(clamp(zoom, 0.55, 2.2));
  };

  const onWheel = (event: WheelEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    const direction = event.deltaY > 0 ? -0.08 : 0.08;
    setZoom(settings.zoom + direction);
  };

  return (
    <div className="simulation-wrap" ref={wrapRef}>
      <canvas
        ref={canvasRef}
        className="simulation-canvas"
        aria-label="Interactive atom bonding simulation"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onWheel={onWheel}
      />
      <div className="zoom-controls" aria-label="Zoom controls">
        <button title="Zoom out" onClick={() => setZoom(settings.zoom - 0.12)}>
          <ZoomOut size={17} />
        </button>
        <span>{Math.round(settings.zoom * 100)}%</span>
        <button title="Zoom in" onClick={() => setZoom(settings.zoom + 0.12)}>
          <ZoomIn size={17} />
        </button>
        <button title="Reset zoom" onClick={() => setZoom(1)}>
          <Maximize2 size={17} />
        </button>
      </div>
      <div className="canvas-readout">
        <span>{state.atoms.length} atoms</span>
        <span>{state.bonds.length} bonds</span>
        <span>{state.metallicLattice ? "metal lattice" : "particle space"}</span>
      </div>
      {state.atoms.length === 0 && (
        <div className="empty-canvas-hint">
          <strong>Empty simulation space</strong>
          <span>Choose one or more elements below, then press Spawn one atom.</span>
        </div>
      )}
    </div>
  );
}

function draw(ctx: CanvasRenderingContext2D, state: SimulationState, settings: SimulationSettings, width: number, height: number) {
  ctx.clearRect(0, 0, width, height);
  drawBackground(ctx, settings, width, height);
  if (state.metallicLattice && settings.visualStyle === "detailed") drawMetalElectronCloud(ctx, state, width, height, settings.zoom);
  ctx.save();
  applyCamera(ctx, width, height, settings.zoom);
  for (const bond of state.bonds) drawBond(ctx, state, bond, settings);
  for (const electron of state.metallicElectrons) drawFreeElectron(ctx, electron.x, electron.y, settings);
  for (const effect of state.effects) drawEffect(ctx, state, effect, settings);
  for (const atom of state.atoms) drawAtom(ctx, atom, state, settings);
  ctx.restore();
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function applyCamera(ctx: CanvasRenderingContext2D, width: number, height: number, zoom: number) {
  ctx.translate(width / 2, height / 2);
  ctx.scale(zoom, zoom);
  ctx.translate(-width / 2, -height / 2);
}

function screenToWorld(screenX: number, screenY: number, width: number, height: number, zoom: number) {
  return {
    x: width / 2 + (screenX - width / 2) / zoom,
    y: height / 2 + (screenY - height / 2) / zoom
  };
}

function isDetailed(settings: SimulationSettings) {
  return settings.visualStyle === "detailed";
}

function palette(settings: SimulationSettings) {
  const light = settings.theme === "light";
  return {
    backgroundA: light ? "#f8faf7" : "#111316",
    backgroundB: light ? "#eef5f1" : "#161a1c",
    backgroundC: light ? "#f7fbff" : "#101412",
    grid: light ? "rgba(24,38,34,0.08)" : "rgba(255,255,255,0.05)",
    atomNeutral: light ? "#f7faf8" : "#e5e7eb",
    atomNeutralEdge: light ? "#64736d" : "#9ca3af",
    atomText: light ? "#17211d" : "#f8fafc",
    label: light ? "rgba(24,38,34,0.78)" : "rgba(241,245,249,0.76)",
    shell: light ? "rgba(24,38,34,0.26)" : "rgba(255,255,255,0.18)",
    covalent: light ? "#334155" : "#e5e7eb",
    polar: light ? "#2563eb" : "#38bdf8",
    ionic: light ? "#c2410c" : "#f59e0b",
    metallic: light ? "rgba(161,98,7,0.34)" : "rgba(251,191,36,0.2)",
    electron: light ? "#047857" : "#a7f3d0",
    freeElectron: light ? "#0284c7" : "#67e8f9",
    negative: light ? "#2563eb" : "#38bdf8",
    positive: light ? "#dc2626" : "#fb7185"
  };
}

function drawBackground(ctx: CanvasRenderingContext2D, settings: SimulationSettings, width: number, height: number) {
  const colors = palette(settings);
  if (!isDetailed(settings)) {
    ctx.fillStyle = colors.backgroundB;
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = colors.grid;
    for (let x = 18; x < width; x += 38) {
      for (let y = 18; y < height; y += 38) {
        ctx.fillRect(x, y, 1, 1);
      }
    }
    return;
  }
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, colors.backgroundA);
  gradient.addColorStop(0.52, colors.backgroundB);
  gradient.addColorStop(1, colors.backgroundC);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = colors.grid;
  for (let x = 18; x < width; x += 38) {
    for (let y = 18; y < height; y += 38) {
      ctx.fillRect(x, y, 1, 1);
    }
  }
}

function drawBond(ctx: CanvasRenderingContext2D, state: SimulationState, bond: Bond, settings: SimulationSettings) {
  const a = state.atoms.find((atom) => atom.id === bond.a);
  const b = state.atoms.find((atom) => atom.id === bond.b);
  if (!a || !b) return;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const dist = Math.max(0.01, Math.hypot(dx, dy));
  const nx = dx / dist;
  const ny = dy / dist;
  const px = -ny;
  const py = nx;
  const colors = palette(settings);
  const color = bond.kind === "ionic" ? colors.ionic : bond.kind === "metallic" ? colors.metallic : bond.kind === "polar-covalent" ? colors.polar : colors.covalent;
  const offsets = bond.kind === "metallic" ? [0] : bond.order === 1 ? [0] : bond.order === 2 ? [-5, 5] : [-8, 0, 8];

  ctx.save();
  ctx.lineCap = "round";
  ctx.shadowColor = color;
  ctx.shadowBlur = isDetailed(settings) && bond.kind !== "metallic" ? 12 : 0;
  for (const offset of offsets) {
    ctx.beginPath();
    ctx.moveTo(a.x + px * offset, a.y + py * offset);
    ctx.lineTo(b.x + px * offset, b.y + py * offset);
    ctx.strokeStyle = color;
    ctx.lineWidth = bond.kind === "metallic" ? 1 : 3.4;
    if (bond.kind === "ionic") ctx.setLineDash([7, 7]);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  if (bond.kind !== "metallic") {
    drawSharedElectrons(ctx, a, b, bond, settings);
  }
  if (bond.kind === "polar-covalent" && bond.electronShift) {
    const target = bond.electronShift === a.id ? a : b;
    const source = target.id === a.id ? b : a;
    ctx.fillStyle = colors.negative;
    ctx.font = "700 13px Inter, system-ui";
    ctx.fillText("delta-", target.x + 18, target.y - 22);
    ctx.fillStyle = colors.positive;
    ctx.fillText("delta+", source.x + 18, source.y - 22);
  }
  ctx.restore();
}

function drawSharedElectrons(ctx: CanvasRenderingContext2D, a: AtomParticle, b: AtomParticle, bond: Bond, settings: SimulationSettings) {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const dist = Math.max(0.01, Math.hypot(dx, dy));
  const px = -dy / dist;
  const py = dx / dist;
  const count = bond.kind === "ionic" ? 1 : bond.order * 2;
  const colors = palette(settings);
  ctx.fillStyle = bond.kind === "ionic" ? colors.ionic : colors.electron;
  ctx.shadowColor = ctx.fillStyle;
  ctx.shadowBlur = isDetailed(settings) ? 9 : 0;
  for (let i = 0; i < count; i += 1) {
    const spread = (i - (count - 1) / 2) * 9;
    ctx.beginPath();
    ctx.arc(mx + px * spread, my + py * spread, 3.2, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawAtom(ctx: CanvasRenderingContext2D, atom: AtomParticle, state: SimulationState, settings: SimulationSettings) {
  const data = atomData[atom.symbol];
  const selected = state.selectedAtomId === atom.id;
  const colors = palette(settings);
  const detailed = isDetailed(settings);
  ctx.save();
  ctx.shadowColor = data.glow;
  ctx.shadowBlur = detailed ? selected ? 30 : 18 : 0;
  if (detailed) {
    const gradient = ctx.createRadialGradient(atom.x - atom.radius * 0.35, atom.y - atom.radius * 0.35, 2, atom.x, atom.y, atom.radius);
    gradient.addColorStop(0, "#ffffff");
    gradient.addColorStop(0.22, data.color);
    gradient.addColorStop(1, settings.theme === "light" ? "#eef2f0" : "#111827");
    ctx.fillStyle = gradient;
  } else {
    ctx.fillStyle = settings.visualStyle === "simple-colored" ? data.color : colors.atomNeutral;
  }
  ctx.beginPath();
  ctx.arc(atom.x, atom.y, atom.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = selected ? 3 : 1.5;
  ctx.strokeStyle = selected ? "#facc15" : detailed ? "rgba(255,255,255,0.34)" : colors.atomNeutralEdge;
  ctx.stroke();
  ctx.shadowBlur = 0;

  if (settings.showShells) {
    ctx.strokeStyle = colors.shell;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(atom.x, atom.y, atom.radius + 14, 0, Math.PI * 2);
    ctx.stroke();
    drawValenceElectrons(ctx, atom, data.valenceElectrons, state.time, settings);
  }

  ctx.fillStyle = colors.atomText;
  ctx.font = "800 15px Inter, system-ui";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(atom.symbol, atom.x, atom.y);

  if (atom.charge !== 0) {
    ctx.fillStyle = atom.charge > 0 ? colors.positive : colors.negative;
    ctx.font = "800 12px Inter, system-ui";
    ctx.fillText(atom.charge > 0 ? `${atom.charge}+` : `${Math.abs(atom.charge)}-`, atom.x + atom.radius + 12, atom.y - atom.radius + 8);
  }

  if (settings.showLabels) {
    ctx.fillStyle = colors.label;
    ctx.font = "700 11px Inter, system-ui";
    ctx.fillText(data.name, atom.x, atom.y + atom.radius + 28);
  }
  ctx.restore();
}

function drawValenceElectrons(ctx: CanvasRenderingContext2D, atom: AtomParticle, count: number, time: number, settings: SimulationSettings) {
  const colors = palette(settings);
  ctx.fillStyle = colors.electron;
  ctx.shadowColor = colors.electron;
  ctx.shadowBlur = isDetailed(settings) ? 8 : 0;
  const orbit = atom.radius + 14;
  for (let i = 0; i < count; i += 1) {
    const angle = time * 0.55 + i * (Math.PI * 2 / count);
    ctx.beginPath();
    ctx.arc(atom.x + Math.cos(angle) * orbit, atom.y + Math.sin(angle) * orbit, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.shadowBlur = 0;
}

function drawEffect(ctx: CanvasRenderingContext2D, state: SimulationState, effect: { from: string; to: string; progress: number; kind: string }, settings: SimulationSettings) {
  const from = state.atoms.find((atom) => atom.id === effect.from);
  const to = state.atoms.find((atom) => atom.id === effect.to);
  if (!from || !to || effect.kind === "delocalized") return;
  const t = Math.min(1, effect.progress);
  const x = from.x + (to.x - from.x) * t;
  const y = from.y + (to.y - from.y) * t + Math.sin(t * Math.PI) * -28;
  const colors = palette(settings);
  ctx.save();
  ctx.fillStyle = effect.kind === "transfer" ? colors.ionic : colors.electron;
  ctx.shadowColor = ctx.fillStyle;
  ctx.shadowBlur = isDetailed(settings) ? 18 : 0;
  ctx.beginPath();
  ctx.arc(x, y, effect.kind === "transfer" ? 5 : 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawMetalElectronCloud(ctx: CanvasRenderingContext2D, state: SimulationState, width: number, height: number, zoom: number) {
  if (!state.atoms.length) return;
  const xs = state.atoms.map((atom) => atom.x);
  const ys = state.atoms.map((atom) => atom.y);
  const worldCenterX = (Math.min(...xs) + Math.max(...xs)) / 2;
  const worldCenterY = (Math.min(...ys) + Math.max(...ys)) / 2;
  const centerX = width / 2 + (worldCenterX - width / 2) * zoom;
  const centerY = height / 2 + (worldCenterY - height / 2) * zoom;
  const latticeRadius = Math.max(
    Math.max(...xs) - Math.min(...xs),
    Math.max(...ys) - Math.min(...ys)
  ) * zoom;

  ctx.save();
  ctx.globalCompositeOperation = "screen";

  const broadCloud = ctx.createRadialGradient(
    centerX,
    centerY,
    18,
    centerX,
    centerY,
    Math.max(latticeRadius * 0.92, 360)
  );
  broadCloud.addColorStop(0, "rgba(56,189,248,0.14)");
  broadCloud.addColorStop(0.42, "rgba(56,189,248,0.075)");
  broadCloud.addColorStop(0.78, "rgba(56,189,248,0.026)");
  broadCloud.addColorStop(1, "rgba(56,189,248,0)");
  ctx.fillStyle = broadCloud;
  ctx.fillRect(0, 0, width, height);

  const warmCore = ctx.createRadialGradient(
    centerX - latticeRadius * 0.14,
    centerY + latticeRadius * 0.04,
    12,
    centerX,
    centerY,
    Math.max(latticeRadius * 0.58, 230)
  );
  warmCore.addColorStop(0, "rgba(250,204,21,0.07)");
  warmCore.addColorStop(0.7, "rgba(250,204,21,0.018)");
  warmCore.addColorStop(1, "rgba(250,204,21,0)");
  ctx.fillStyle = warmCore;
  ctx.fillRect(0, 0, width, height);

  ctx.restore();
}

function drawFreeElectron(ctx: CanvasRenderingContext2D, x: number, y: number, settings: SimulationSettings) {
  const colors = palette(settings);
  ctx.save();
  ctx.fillStyle = colors.freeElectron;
  ctx.shadowColor = colors.freeElectron;
  ctx.shadowBlur = isDetailed(settings) ? 12 : 0;
  ctx.beginPath();
  ctx.arc(x, y, 3.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function nearestAtom(atoms: AtomParticle[], x: number, y: number) {
  return atoms.find((atom) => Math.hypot(atom.x - x, atom.y - y) <= atom.radius + 18) ?? null;
}

function nearestBond(bonds: Bond[], atoms: AtomParticle[], x: number, y: number) {
  let best: Bond | null = null;
  let bestDistance = 12;
  for (const bond of bonds) {
    const a = atoms.find((atom) => atom.id === bond.a);
    const b = atoms.find((atom) => atom.id === bond.b);
    if (!a || !b) continue;
    const distance = distanceToSegment(x, y, a.x, a.y, b.x, b.y);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = bond;
    }
  }
  return best;
}

function distanceToSegment(px: number, py: number, x1: number, y1: number, x2: number, y2: number) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lengthSq = dx * dx + dy * dy || 1;
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lengthSq));
  const x = x1 + t * dx;
  const y = y1 + t * dy;
  return Math.hypot(px - x, py - y);
}

export function bondLabel(bond: Bond | null) {
  return bond ? bondKindLabel[bond.kind] : "No bond selected";
}
