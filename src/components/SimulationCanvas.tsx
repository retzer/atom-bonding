import { useEffect, useRef, useState, type PointerEvent, type WheelEvent } from "react";
import { Download, Maximize2, ZoomIn, ZoomOut } from "lucide-react";
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
type BondSegment = { ux: number; uy: number; px: number; py: number; startX: number; startY: number; endX: number; endY: number };
const lightDirection = { x: -0.44, y: -0.5 };

export function SimulationCanvas({ state, settings, width, height, onResize, onSelectAtom, onSelectBond, onMoveAtom, onZoom }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [hoveredBondId, setHoveredBondId] = useState<string | null>(null);

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
    draw(ctx, state, settings, width, height, hoveredBondId);
  }, [height, hoveredBondId, settings, state, width]);

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
    const point = pointerPoint(event);
    if (!dragging) {
      setHoveredBondId(nearestBond(state.bonds, state.atoms, point.x, point.y)?.id ?? null);
      return;
    }
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

  const exportImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `atom-bonding-scene-${Date.now()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
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
        onPointerLeave={() => setHoveredBondId(null)}
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
        <button title="Export PNG" onClick={exportImage}>
          <Download size={17} />
        </button>
      </div>
      <div className="canvas-readout">
        <span>{state.atoms.length} atoms</span>
        <span>{state.bonds.length} bonds</span>
        <span>{settings.geometry3D ? "VSEPR 3D" : state.metallicLattice ? "metal lattice" : "particle space"}</span>
      </div>
      {state.atoms.length === 0 && (
        <div className="empty-canvas-hint">
          <strong>Empty simulation space</strong>
          <span>Choose an element below, then press Spawn one atom.</span>
        </div>
      )}
    </div>
  );
}

function draw(ctx: CanvasRenderingContext2D, state: SimulationState, settings: SimulationSettings, width: number, height: number, hoveredBondId: string | null) {
  ctx.clearRect(0, 0, width, height);
  drawBackground(ctx, settings, width, height);
  if (state.metallicLattice && settings.visualStyle === "detailed") drawMetalElectronCloud(ctx, state, width, height, settings.zoom);
  const renderState = settings.geometry3D ? projectedState(state) : state;
  ctx.save();
  applyCamera(ctx, width, height, settings.zoom);
  drawMoleculeShadow(ctx, renderState, settings, width, height);
  const visibleBonds = depthSortedBonds(renderState).filter((bond) => bondVisibleInMode2D(bond, renderState, settings));
  const visibleAtoms = depthSortedAtoms(renderState).filter((atom) => atomVisibleInMode2D(atom, settings));
  for (const hBond of renderState.hydrogenBonds) drawHydrogenBond(ctx, renderState, hBond, settings);
  for (const bond of visibleBonds) drawBond(ctx, renderState, bond, settings);
  if (settings.showElectronFlow) drawElectronFlow(ctx, renderState, settings);
  for (const electron of renderState.metallicElectrons) drawFreeElectron(ctx, electron.x, electron.y, settings);
  for (const effect of renderState.effects) drawEffect(ctx, renderState, effect, settings);
  for (const atom of visibleAtoms) drawAtom(ctx, atom, renderState, settings);
  if (settings.geometry3D) {
    for (const atom of frontBondedAtoms(renderState).filter((atom) => atomVisibleInMode2D(atom, settings))) drawAtom(ctx, atom, renderState, settings);
  }
  if (settings.showNetDipole) drawNetDipole(ctx, renderState, settings);
  drawBondAngleBadge(ctx, renderState, hoveredBondId ?? renderState.selectedBondId, settings);
  ctx.restore();
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function projectedState(state: SimulationState): SimulationState {
  const atoms = state.atoms.map((atom) => {
    const z = atom.z ?? 0;
    const depthScale = clamp(1 + z / 520, 0.72, 1.28);
    return {
      ...atom,
      x: atom.x + z * 0.3,
      y: atom.y - z * 0.2,
      radius: atom.radius * depthScale
    };
  });
  return { ...state, atoms };
}

function depthSortedAtoms(state: SimulationState) {
  return [...state.atoms].sort((a, b) => (a.z ?? 0) - (b.z ?? 0));
}

function depthSortedBonds(state: SimulationState) {
  const zFor = (id: string) => state.atoms.find((atom) => atom.id === id)?.z ?? 0;
  return [...state.bonds].sort((a, b) => (zFor(a.a) + zFor(a.b)) - (zFor(b.a) + zFor(b.b)));
}

function atomVisibleInMode2D(atom: AtomParticle, settings: SimulationSettings) {
  if (settings.displayMode === "skeleton") return false;
  if (settings.displayMode === "simplified" && atom.symbol === "H") return false;
  return true;
}

function bondVisibleInMode2D(bond: Bond, state: SimulationState, settings: SimulationSettings) {
  if (settings.displayMode === "full" || settings.displayMode === "skeleton") return true;
  const a = state.atoms.find((atom) => atom.id === bond.a);
  const b = state.atoms.find((atom) => atom.id === bond.b);
  if (!a || !b) return false;
  return a.symbol !== "H" && b.symbol !== "H";
}

function shouldShowAtomLabel2D(atom: AtomParticle, state: SimulationState, settings: SimulationSettings) {
  if (!settings.showLabels || settings.displayMode === "skeleton") return false;
  if (state.selectedAtomId === atom.id) return true;
  if (settings.displayMode === "simplified" && atom.symbol === "H") return false;
  if (settings.zoom < 0.8) return atom.symbol !== "H" && atom.radius > 22;
  if (settings.zoom < 1.15) return atom.symbol !== "H";
  return true;
}

function drawMoleculeShadow(ctx: CanvasRenderingContext2D, state: SimulationState, settings: SimulationSettings, width: number, height: number) {
  if (!state.atoms.length || !isDetailed(settings)) return;
  const atomById = new Map(state.atoms.map((atom) => [atom.id, atom]));
  const floorY = height * 0.9;
  const cast = (x: number, y: number, z = 0) => {
    const lift = floorY - y;
    return {
      x: x - lightDirection.x * 32 + (x - width / 2) * 0.04 + z * 0.024,
      y: floorY - lift * 0.018 + Math.max(0, z) * 0.008
    };
  };
  const shadowColor = settings.theme === "light" ? "rgba(15,23,42,0.18)" : "rgba(0,0,0,0.42)";
  if (state.atoms.length > 34) {
    drawAggregateMoleculeShadow(ctx, state.atoms, cast, settings);
    return;
  }
  ctx.save();
  ctx.globalAlpha = settings.geometry3D ? 0.66 : 0.54;
  ctx.filter = "blur(1.2px)";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = shadowColor;
  ctx.fillStyle = shadowColor;
  for (const bond of depthSortedBonds(state)) {
    const a = atomById.get(bond.a);
    const b = atomById.get(bond.b);
    if (!a || !b) continue;
    const segment = visibleBondSegment(a, b);
    if (!segment) continue;
    const depth = settings.geometry3D ? clamp(1 + (((a.z ?? 0) + (b.z ?? 0)) / 2) / 520, 0.68, 1.28) : 1;
    const start = cast(segment.startX, segment.startY, ((a.z ?? 0) + (b.z ?? 0)) / 2);
    const end = cast(segment.endX, segment.endY, ((a.z ?? 0) + (b.z ?? 0)) / 2);
    ctx.lineWidth = (bond.kind === "metallic" ? 1.2 : 5.2) * depth;
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
  }
  for (const atom of depthSortedAtoms(state)) {
    const point = cast(atom.x, atom.y, atom.z ?? 0);
    ctx.beginPath();
    ctx.ellipse(point.x, point.y, atom.radius * 0.58, atom.radius * 0.16, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.filter = "none";
  ctx.restore();
}

function drawAggregateMoleculeShadow(ctx: CanvasRenderingContext2D, atoms: AtomParticle[], cast: (x: number, y: number, z?: number) => { x: number; y: number }, settings: SimulationSettings) {
  const points = atoms.map((atom) => ({ atom, point: cast(atom.x, atom.y, atom.z ?? 0) }));
  const minX = Math.min(...points.map(({ point, atom }) => point.x - atom.radius * 0.42));
  const maxX = Math.max(...points.map(({ point, atom }) => point.x + atom.radius * 0.42));
  const minY = Math.min(...points.map(({ point }) => point.y));
  const maxY = Math.max(...points.map(({ point }) => point.y));
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const rx = clamp((maxX - minX) * 0.52, 42, 360);
  const ry = clamp((maxY - minY) * 0.42 + 10, 8, 34);
  const gradient = ctx.createRadialGradient(cx, cy, 2, cx, cy, Math.max(rx, ry));
  gradient.addColorStop(0, settings.theme === "light" ? "rgba(15,23,42,0.18)" : "rgba(0,0,0,0.38)");
  gradient.addColorStop(0.45, settings.theme === "light" ? "rgba(15,23,42,0.08)" : "rgba(0,0,0,0.18)");
  gradient.addColorStop(1, settings.theme === "light" ? "rgba(15,23,42,0)" : "rgba(0,0,0,0)");

  ctx.save();
  ctx.filter = "blur(1.4px)";
  ctx.fillStyle = gradient;
  ctx.globalAlpha = 0.7;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();

  const stride = Math.max(2, Math.ceil(atoms.length / 46));
  ctx.fillStyle = settings.theme === "light" ? "rgba(15,23,42,0.09)" : "rgba(0,0,0,0.22)";
  ctx.globalAlpha = 0.42;
  points.forEach(({ atom, point }, index) => {
    if (index % stride !== 0) return;
    ctx.beginPath();
    ctx.ellipse(point.x, point.y, atom.radius * 0.22, Math.max(1.8, atom.radius * 0.055), 0, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}

function frontBondedAtoms(state: SimulationState) {
  const byId = new Map(state.atoms.map((atom) => [atom.id, atom]));
  const front = new Map<string, AtomParticle>();
  for (const bond of state.bonds) {
    const a = byId.get(bond.a);
    const b = byId.get(bond.b);
    if (!a || !b) continue;
    const smaller = a.radius <= b.radius ? a : b;
    const larger = smaller.id === a.id ? b : a;
    const distance = Math.hypot(smaller.x - larger.x, smaller.y - larger.y);
    const overlap = smaller.radius + larger.radius - distance;
    if (overlap <= smaller.radius * 0.08) continue;
    if ((smaller.z ?? 0) < (larger.z ?? 0) - 160) continue;
    front.set(smaller.id, smaller);
  }
  return [...front.values()].sort((a, b) => (a.z ?? 0) - (b.z ?? 0));
}

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
    drawFadingFloor(ctx, settings, width, height);
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
  drawFadingFloor(ctx, settings, width, height);
  ctx.fillStyle = colors.grid;
  for (let x = 18; x < width; x += 38) {
    for (let y = 18; y < height; y += 38) {
      ctx.fillRect(x, y, 1, 1);
    }
  }
}

function drawFadingFloor(ctx: CanvasRenderingContext2D, settings: SimulationSettings, width: number, height: number) {
  const horizon = height * 0.38;
  const floor = ctx.createLinearGradient(0, horizon, 0, height);
  if (settings.theme === "light") {
    floor.addColorStop(0, "rgba(226,239,235,0)");
    floor.addColorStop(0.36, "rgba(218,232,228,0.22)");
    floor.addColorStop(1, "rgba(209,226,221,0.42)");
  } else {
    floor.addColorStop(0, "rgba(255,255,255,0)");
    floor.addColorStop(0.42, "rgba(255,255,255,0.035)");
    floor.addColorStop(1, "rgba(255,255,255,0.075)");
  }

  ctx.save();
  ctx.fillStyle = floor;
  ctx.fillRect(0, horizon, width, height - horizon);
  ctx.strokeStyle = settings.theme === "light" ? "rgba(24,38,34,0.07)" : "rgba(255,255,255,0.045)";
  ctx.lineWidth = 1;
  for (let y = horizon + 12, gap = 16; y < height; gap *= 1.13, y += gap) {
    const alpha = clamp((y - horizon) / (height - horizon), 0, 1);
    ctx.globalAlpha = alpha * 0.8;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
  const vanishing = width / 2;
  for (let i = -8; i <= 8; i += 1) {
    const x = width / 2 + i * 64;
    ctx.globalAlpha = 0.18;
    ctx.beginPath();
    ctx.moveTo(vanishing, horizon);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  ctx.restore();
}

function drawBond(ctx: CanvasRenderingContext2D, state: SimulationState, bond: Bond, settings: SimulationSettings) {
  const a = state.atoms.find((atom) => atom.id === bond.a);
  const b = state.atoms.find((atom) => atom.id === bond.b);
  if (!a || !b) return;
  const segment = visibleBondSegment(a, b);
  if (!segment) return;
  const colors = palette(settings);
  const color = bond.kind === "ionic" ? colors.ionic : bond.kind === "metallic" ? colors.metallic : bond.kind === "polar-covalent" ? colors.polar : colors.covalent;
  const offsets = bond.kind === "metallic" ? [0] : bond.order === 1 ? [0] : bond.order === 2 ? [-5, 5] : [-8, 0, 8];
  const depth = settings.geometry3D ? clamp(1 + (((a.z ?? 0) + (b.z ?? 0)) / 2) / 520, 0.68, 1.28) : 1;
  const depthAlpha = settings.geometry3D ? clamp(0.58 + (((a.z ?? 0) + (b.z ?? 0)) / 2 + 260) / 720, 0.46, 1) : 1;

  ctx.save();
  ctx.lineCap = "round";
  ctx.shadowColor = color;
  ctx.shadowBlur = isDetailed(settings) && bond.kind !== "metallic" ? 6 : 0;
  for (const offset of offsets) {
    ctx.beginPath();
    ctx.moveTo(segment.startX + segment.px * offset, segment.startY + segment.py * offset);
    ctx.lineTo(segment.endX + segment.px * offset, segment.endY + segment.py * offset);
    ctx.strokeStyle = color;
    ctx.globalAlpha = depthAlpha;
    ctx.lineWidth = (bond.kind === "metallic" ? 1 : 3.4) * depth;
    if (bond.kind === "ionic") ctx.setLineDash([7, 7]);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.globalAlpha = 1;
  if (bond.kind !== "metallic") {
    drawSharedElectrons(ctx, a, b, bond, settings);
  }
  if (settings.showBondDipoles && (bond.kind === "polar-covalent" || bond.kind === "ionic") && bond.electronShift) {
    drawDipoleIndicator(ctx, a, b, bond, segment, settings);
  }
  ctx.restore();
}

function drawElectronFlow(ctx: CanvasRenderingContext2D, state: SimulationState, settings: SimulationSettings) {
  const atomById = new Map(state.atoms.map((atom) => [atom.id, atom]));
  ctx.save();
  for (const bond of state.bonds) {
    if (!bondVisibleInMode2D(bond, state, settings)) continue;
    if (bond.kind === "metallic" || bond.kind === "hydrogen" || bond.kind === "dispersion") continue;
    const a = atomById.get(bond.a);
    const b = atomById.get(bond.b);
    if (!a || !b) continue;
    const segment = visibleBondSegment(a, b);
    if (!segment) continue;
    const target = bond.electronShift ? atomById.get(bond.electronShift) : null;
    const reverse = target?.id === a.id;
    const count = bond.order + (bond.kind === "ionic" ? 1 : 0);
    for (let index = 0; index < count; index += 1) {
      const phase = (state.time * (0.42 + index * 0.08) + index / count) % 1;
      const t = reverse ? 1 - phase : phase;
      const x = segment.startX + (segment.endX - segment.startX) * t + segment.px * (index - (count - 1) / 2) * 5;
      const y = segment.startY + (segment.endY - segment.startY) * t + segment.py * (index - (count - 1) / 2) * 5;
      ctx.globalAlpha = settings.geometry3D ? clamp(0.42 + (((a.z ?? 0) + (b.z ?? 0)) / 2 + 260) / 840, 0.32, 0.78) : 0.68;
      ctx.fillStyle = bond.kind === "ionic" ? "#f97316" : settings.theme === "light" ? "#2563eb" : "#67e8f9";
      ctx.beginPath();
      ctx.arc(x, y, bond.kind === "ionic" ? 3.1 : 2.3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawNetDipole(ctx: CanvasRenderingContext2D, state: SimulationState, settings: SimulationSettings) {
  const atomById = new Map(state.atoms.map((atom) => [atom.id, atom]));
  const net = state.bonds.reduce((acc, bond) => {
    if ((bond.kind !== "polar-covalent" && bond.kind !== "ionic") || !bond.electronShift) return acc;
    const a = atomById.get(bond.a);
    const b = atomById.get(bond.b);
    const target = atomById.get(bond.electronShift);
    if (!a || !b || !target) return acc;
    const source = target.id === a.id ? b : a;
    const strength = bond.kind === "ionic" ? 1.4 : clamp(bond.polarity, 0.2, 1.6);
    acc.x += (target.x - source.x) * strength;
    acc.y += (target.y - source.y) * strength;
    return acc;
  }, { x: 0, y: 0 });
  const magnitude = Math.hypot(net.x, net.y);
  if (magnitude < 18 || !state.atoms.length) return;
  const mass = state.atoms.reduce((sum, atom) => sum + atomData[atom.symbol].atomicNumber, 0) || state.atoms.length;
  const cx = state.atoms.reduce((sum, atom) => sum + atom.x * atomData[atom.symbol].atomicNumber, 0) / mass;
  const cy = state.atoms.reduce((sum, atom) => sum + atom.y * atomData[atom.symbol].atomicNumber, 0) / mass;
  const ux = net.x / magnitude;
  const uy = net.y / magnitude;
  const length = clamp(magnitude / Math.max(1, state.bonds.length) * 3.8, 34, 92);
  const width = clamp(2.2 + magnitude / Math.max(1, state.bonds.length) * 0.05, 2.4, 6);
  drawArrow(ctx, cx - ux * length * 0.42, cy - uy * length * 0.42, cx + ux * length * 0.58, cy + uy * length * 0.58, settings.theme === "light" ? "#0f766e" : "#5eead4", width, "net μ");
}

function visibleBondSegment(a: AtomParticle, b: AtomParticle): BondSegment | null {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const length = Math.hypot(dx, dy);
  if (length < 0.01) return null;
  const ux = dx / length;
  const uy = dy / length;
  const px = -uy;
  const py = ux;
  const minVisible = clamp(Math.min(a.radius, b.radius) * 0.32, 8, 22);
  const nominalStart = a.radius * 0.9;
  const nominalEnd = b.radius * 0.9;
  let startInset = nominalStart;
  let endInset = nominalEnd;
  if (length - startInset - endInset < minVisible) {
    const scale = Math.max(0.08, (length - minVisible) / Math.max(1, nominalStart + nominalEnd));
    startInset = Math.max(2, nominalStart * scale);
    endInset = Math.max(2, nominalEnd * scale);
  }
  if (length - startInset - endInset < 3) {
    startInset = Math.max(1, length * 0.34);
    endInset = Math.max(1, length * 0.34);
  }
  return {
    ux,
    uy,
    px,
    py,
    startX: a.x + ux * startInset,
    startY: a.y + uy * startInset,
    endX: b.x - ux * endInset,
    endY: b.y - uy * endInset
  };
}

function drawDipoleIndicator(ctx: CanvasRenderingContext2D, a: AtomParticle, b: AtomParticle, bond: Bond, segment: BondSegment, settings: SimulationSettings) {
  const colors = palette(settings);
  const target = bond.electronShift === a.id ? a : b;
  const towardTarget = target.id === b.id ? 1 : -1;
  const startX = towardTarget === 1 ? segment.startX : segment.endX;
  const startY = towardTarget === 1 ? segment.startY : segment.endY;
  const endX = towardTarget === 1 ? segment.endX : segment.startX;
  const endY = towardTarget === 1 ? segment.endY : segment.startY;
  const offset = 14;
  const arrowStartX = startX + segment.px * offset;
  const arrowStartY = startY + segment.py * offset;
  const arrowEndX = endX + segment.px * offset;
  const arrowEndY = endY + segment.py * offset;
  const ux = segment.ux * towardTarget;
  const uy = segment.uy * towardTarget;
  const head = 8;
  const strength = bond.kind === "ionic" ? 1.7 : clamp(bond.polarity, 0.2, 1.8);
  const lineWidth = clamp(1.2 + strength * 1.15, 1.4, 3.7);
  const alpha = clamp(0.32 + strength * 0.34, 0.38, 0.95);

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = settings.theme === "light" ? "rgba(37,99,235,0.72)" : "rgba(56,189,248,0.76)";
  ctx.fillStyle = ctx.strokeStyle;
  ctx.lineWidth = lineWidth;
  ctx.setLineDash(bond.kind === "ionic" ? [6, 5] : []);
  ctx.beginPath();
  ctx.moveTo(arrowStartX, arrowStartY);
  ctx.lineTo(arrowEndX - ux * head, arrowEndY - uy * head);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(arrowEndX, arrowEndY);
  ctx.lineTo(arrowEndX - ux * head + segment.py * 4.5, arrowEndY - uy * head - segment.px * 4.5);
  ctx.lineTo(arrowEndX - ux * head - segment.py * 4.5, arrowEndY - uy * head + segment.px * 4.5);
  ctx.closePath();
  ctx.fill();
  if (settings.showCharges) {
  ctx.font = "800 12px Inter, system-ui";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = colors.negative;
  ctx.fillText("δ-", target.x + segment.px * 22, target.y + segment.py * 22);
  const source = target.id === a.id ? b : a;
  ctx.fillStyle = colors.positive;
  ctx.fillText("+", source.x - segment.ux * 12 - segment.px * 18, source.y - segment.uy * 12 - segment.py * 18);
  ctx.fillText("δ+", source.x - segment.px * 22, source.y - segment.py * 22);
  }
  ctx.restore();
}

function drawBondAngleBadge(ctx: CanvasRenderingContext2D, state: SimulationState, bondId: string | null, settings: SimulationSettings) {
  if (!bondId) return;
  const bond = state.bonds.find((item) => item.id === bondId);
  if (!bond || bond.kind === "hydrogen" || bond.kind === "dispersion" || bond.kind === "metallic") return;
  const atomById = new Map(state.atoms.map((atom) => [atom.id, atom]));
  const a = atomById.get(bond.a);
  const b = atomById.get(bond.b);
  if (!a || !b) return;
  const candidates = bondAnglesFor(state, bond, atomById);
  if (!candidates.length) return;
  const best = candidates.sort((left, right) => right.centralDegree - left.centralDegree || Math.abs(right.angle - 109.5) - Math.abs(left.angle - 109.5))[0];
  const x = (a.x + b.x + best.other.x) / 3;
  const y = (a.y + b.y + best.other.y) / 3 - 24;
  const text = `${best.angle.toFixed(1)} deg`;
  ctx.save();
  ctx.font = "800 12px Inter, system-ui";
  const width = Math.max(62, ctx.measureText(text).width + 18);
  ctx.fillStyle = settings.theme === "light" ? "rgba(255,255,255,0.9)" : "rgba(10,12,12,0.76)";
  ctx.strokeStyle = settings.theme === "light" ? "rgba(37,99,235,0.32)" : "rgba(56,189,248,0.42)";
  ctx.lineWidth = 1.4;
  roundRect(ctx, x - width / 2, y - 13, width, 26, 9);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = settings.theme === "light" ? "#17211d" : "#f8fafc";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, x, y);
  ctx.restore();
}

function bondAnglesFor(state: SimulationState, bond: Bond, atomById: Map<string, AtomParticle>) {
  return [bond.a, bond.b].flatMap((centerId) => {
    const center = atomById.get(centerId);
    const endpointId = centerId === bond.a ? bond.b : bond.a;
    const endpoint = atomById.get(endpointId);
    if (!center || !endpoint) return [];
    const neighbors = state.bonds
      .filter((item) => item.id !== bond.id && (item.a === centerId || item.b === centerId))
      .map((item) => atomById.get(item.a === centerId ? item.b : item.a))
      .filter((atom): atom is AtomParticle => Boolean(atom));
    return neighbors.map((other) => ({
      angle: angleBetween(center, endpoint, other),
      centralDegree: neighbors.length + 1,
      other
    }));
  });
}

function angleBetween(center: AtomParticle, a: AtomParticle, b: AtomParticle) {
  const ax = a.x - center.x;
  const ay = a.y - center.y;
  const bx = b.x - center.x;
  const by = b.y - center.y;
  const dot = ax * bx + ay * by;
  const mag = Math.max(0.01, Math.hypot(ax, ay) * Math.hypot(bx, by));
  return Math.acos(clamp(dot / mag, -1, 1)) * 180 / Math.PI;
}

function drawHydrogenBond(ctx: CanvasRenderingContext2D, state: SimulationState, hBond: { hydrogen: string; acceptor: string; strength: number }, settings: SimulationSettings) {
  const hydrogen = state.atoms.find((atom) => atom.id === hBond.hydrogen);
  const acceptor = state.atoms.find((atom) => atom.id === hBond.acceptor);
  if (!hydrogen || !acceptor) return;
  const colors = palette(settings);
  ctx.save();
  ctx.setLineDash([5, 8]);
  ctx.lineCap = "round";
  ctx.lineWidth = 1.3 + hBond.strength * 1.4;
  ctx.strokeStyle = settings.theme === "light" ? "rgba(14, 116, 144, 0.58)" : "rgba(125, 211, 252, 0.62)";
  ctx.shadowColor = colors.freeElectron;
  ctx.shadowBlur = isDetailed(settings) ? 8 : 0;
  ctx.beginPath();
  ctx.moveTo(hydrogen.x, hydrogen.y);
  ctx.lineTo(acceptor.x, acceptor.y);
  ctx.stroke();
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
  const z = atom.z ?? 0;
  const depth = settings.geometry3D ? clamp(1 + (atom.z ?? 0) / 520, 0.72, 1.28) : 1;
  const depthAlpha = settings.geometry3D ? clamp(0.56 + (z + 260) / 760, 0.46, 1) : 1;
  const lightX = atom.x + atom.radius * lightDirection.x;
  const lightY = atom.y + atom.radius * lightDirection.y;
  ctx.save();
  ctx.globalAlpha = depthAlpha;
  ctx.filter = "none";
  ctx.shadowColor = data.glow;
  ctx.shadowBlur = detailed ? (selected ? 18 : 8) * depth * clamp(depthAlpha + 0.12, 0.5, 1) : 0;
  if (detailed) {
    const gradient = ctx.createRadialGradient(lightX, lightY, 2, atom.x + atom.radius * 0.16, atom.y + atom.radius * 0.18, atom.radius * 1.08);
    gradient.addColorStop(0, "#ffffff");
    gradient.addColorStop(0.18, data.color);
    gradient.addColorStop(0.72, data.color);
    gradient.addColorStop(1, settings.theme === "light" ? "rgba(74,85,99,0.92)" : "#111827");
    ctx.fillStyle = gradient;
  } else {
    ctx.fillStyle = settings.visualStyle === "simple-colored" ? data.color : colors.atomNeutral;
  }
  ctx.beginPath();
  ctx.arc(atom.x, atom.y, atom.radius, 0, Math.PI * 2);
  ctx.fill();
  if (detailed) {
    const shade = ctx.createRadialGradient(atom.x - atom.radius * 0.32, atom.y - atom.radius * 0.4, atom.radius * 0.1, atom.x + atom.radius * 0.32, atom.y + atom.radius * 0.36, atom.radius * 1.16);
    shade.addColorStop(0, "rgba(255,255,255,0)");
    shade.addColorStop(0.64, "rgba(15,23,42,0.04)");
    shade.addColorStop(1, settings.theme === "light" ? "rgba(15,23,42,0.18)" : "rgba(0,0,0,0.34)");
    ctx.fillStyle = shade;
    ctx.beginPath();
    ctx.arc(atom.x, atom.y, atom.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = Math.min(1, depthAlpha + 0.08);
    ctx.fillStyle = settings.theme === "light" ? "rgba(255,255,255,0.82)" : "rgba(255,255,255,0.68)";
    ctx.beginPath();
    ctx.arc(lightX, lightY, Math.max(4, atom.radius * 0.18), 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = depthAlpha;
  }
  ctx.lineWidth = (selected ? 3 : 1.5) * depth;
  ctx.strokeStyle = selected ? "#facc15" : detailed ? "rgba(255,255,255,0.34)" : colors.atomNeutralEdge;
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.filter = "none";

  if (settings.showShells) {
    ctx.globalAlpha = clamp(depthAlpha + 0.08, 0.5, 1);
    ctx.strokeStyle = colors.shell;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(atom.x, atom.y, atom.radius + 14, 0, Math.PI * 2);
    ctx.stroke();
    drawValenceElectrons(ctx, atom, data.valenceElectrons, state.time, settings);
  }

  ctx.globalAlpha = clamp(depthAlpha + 0.16, 0.72, 1);
  ctx.fillStyle = colors.atomText;
  ctx.font = "800 15px Inter, system-ui";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(atom.symbol, atom.x, atom.y);

  if (settings.showCharges && atom.charge !== 0) {
    ctx.fillStyle = atom.charge > 0 ? colors.positive : colors.negative;
    ctx.font = "800 12px Inter, system-ui";
    ctx.fillText(atom.charge > 0 ? `${atom.charge}+` : `${Math.abs(atom.charge)}-`, atom.x + atom.radius + 12, atom.y - atom.radius + 8);
  }

  if (shouldShowAtomLabel2D(atom, state, settings)) {
    ctx.fillStyle = colors.label;
    ctx.font = "700 11px Inter, system-ui";
    ctx.fillText(data.name, atom.x, atom.y + atom.radius + 28);
  }
  if (selected) drawValenceBadge(ctx, atom, state, settings);
  ctx.restore();
}

function drawValenceBadge(ctx: CanvasRenderingContext2D, atom: AtomParticle, state: SimulationState, settings: SimulationSettings) {
  const data = atomData[atom.symbol];
  const target = atom.symbol === "H" ? 2 : data.nobleGas ? data.valenceElectrons : data.metal ? data.valenceElectrons : 8;
  const bondOrder = state.bonds
    .filter((bond) => bond.a === atom.id || bond.b === atom.id)
    .reduce((sum, bond) => sum + (bond.kind === "ionic" ? Math.abs(atom.charge) : bond.order), 0);
  const fill = data.nobleGas ? target : data.metal ? Math.max(0, data.valenceElectrons - Math.max(0, atom.charge)) : Math.min(target, data.valenceElectrons + bondOrder);
  const colors = palette(settings);
  const text = `${fill}/${target}`;
  const x = atom.x;
  const y = atom.y - atom.radius - 30;
  ctx.save();
  ctx.font = "800 11px Inter, system-ui";
  const width = Math.max(42, ctx.measureText(text).width + 16);
  ctx.fillStyle = settings.theme === "light" ? "rgba(255,255,255,0.88)" : "rgba(10,12,12,0.72)";
  ctx.strokeStyle = fill >= target ? colors.electron : colors.ionic;
  ctx.lineWidth = 1.4;
  roundRect(ctx, x - width / 2, y - 11, width, 22, 10);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = colors.atomText;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, x, y);
  ctx.restore();
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
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
  return atoms
    .map((atom) => {
      const z = atom.z ?? 0;
      return {
        atom,
        x: atom.x + z * 0.3,
        y: atom.y - z * 0.2,
        radius: atom.radius * clamp(1 + z / 520, 0.72, 1.28)
      };
    })
    .sort((a, b) => (b.atom.z ?? 0) - (a.atom.z ?? 0))
    .find((item) => Math.hypot(item.x - x, item.y - y) <= item.radius + 18)?.atom ?? null;
}

function nearestBond(bonds: Bond[], atoms: AtomParticle[], x: number, y: number) {
  let best: Bond | null = null;
  let bestDistance = 12;
  const projectedAtoms = projectedState({
    atoms,
    bonds,
    hydrogenBonds: [],
    effects: [],
    metallicElectrons: [],
    events: [],
    selectedAtomId: null,
    selectedBondId: null,
    time: 0,
    metallicLattice: false
  }).atoms;
  for (const bond of bonds) {
    const a = projectedAtoms.find((atom) => atom.id === bond.a);
    const b = projectedAtoms.find((atom) => atom.id === bond.b);
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

function drawArrow(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string, width: number, label?: string) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.max(0.01, Math.hypot(dx, dy));
  const ux = dx / length;
  const uy = dy / length;
  const px = -uy;
  const py = ux;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2 - ux * 10, y2 - uy * 10);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - ux * 12 + px * 5, y2 - uy * 12 + py * 5);
  ctx.lineTo(x2 - ux * 12 - px * 5, y2 - uy * 12 - py * 5);
  ctx.closePath();
  ctx.fill();
  if (label) {
    ctx.font = "800 12px Inter, system-ui";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, x2 + px * 14, y2 + py * 14);
  }
  ctx.restore();
}

export function bondLabel(bond: Bond | null) {
  return bond ? bondKindLabel[bond.kind] : "No bond selected";
}
