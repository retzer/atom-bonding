import { useEffect, useMemo, useRef, useState, type PointerEvent, type WheelEvent } from "react";
import { Box, Maximize2, ZoomIn, ZoomOut } from "lucide-react";
import { atomData } from "../data/atoms";
import type { AtomParticle, Bond, ProjectionMode, SimulationSettings, SimulationState } from "../types";
import { buildMoleculeGraph, structuralBonds } from "../simulation/graph";
import { analyzeAtomGeometry } from "../simulation/vsepr";

type Props = {
  state: SimulationState;
  settings: SimulationSettings;
  width: number;
  height: number;
  onResize: (width: number, height: number) => void;
  onSelectAtom: (id: string | null) => void;
  onZoom: (zoom: number) => void;
};

type Vec3 = { x: number; y: number; z: number };
type Camera3D = { yaw: number; pitch: number; panX: number; panY: number };
type SceneAtom = AtomParticle & Vec3;
type ProjectedAtom = SceneAtom & { sx: number; sy: number; depth: number; screenRadius: number; paintDepth: number; surfaceDepth: number };
type LonePairCloud = Vec3 & { id: string; centerId: string; radius: number; direction: Vec3 };
type ProjectedLonePair = LonePairCloud & { sx: number; sy: number; depth: number; screenRadius: number };
type RenderBudget = { detailedEffects: boolean; atomShadowBlur: number; overlays: boolean; labels: boolean };
type BondSegment = {
  ux: number;
  uy: number;
  px: number;
  py: number;
  length: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
};

const devicePixelRatioSafe = () => Math.min(window.devicePixelRatio || 1, 2);

const templates: Record<string, Vec3[]> = {
  AX2: [{ x: 1, y: 0, z: 0 }, { x: -1, y: 0, z: 0 }],
  AX3: [{ x: 1, y: 0, z: 0 }, { x: -0.5, y: 0.866, z: 0 }, { x: -0.5, y: -0.866, z: 0 }],
  AX2E: [{ x: 0.866, y: 0.5, z: 0 }, { x: -0.866, y: 0.5, z: 0 }],
  AX4: [{ x: 0.943, y: 0, z: -0.333 }, { x: -0.471, y: 0.816, z: -0.333 }, { x: -0.471, y: -0.816, z: -0.333 }, { x: 0, y: 0, z: 1 }],
  AX3E: [{ x: 0.94, y: 0, z: -0.18 }, { x: -0.47, y: 0.814, z: -0.18 }, { x: -0.47, y: -0.814, z: -0.18 }],
  AX2E2: [{ x: 0.79, y: 0.42, z: -0.45 }, { x: -0.79, y: 0.42, z: -0.45 }],
  AX5: [{ x: 1, y: 0, z: 0 }, { x: -0.5, y: 0.866, z: 0 }, { x: -0.5, y: -0.866, z: 0 }, { x: 0, y: 0, z: 1 }, { x: 0, y: 0, z: -1 }],
  AX6: [{ x: 1, y: 0, z: 0 }, { x: -1, y: 0, z: 0 }, { x: 0, y: 1, z: 0 }, { x: 0, y: -1, z: 0 }, { x: 0, y: 0, z: 1 }, { x: 0, y: 0, z: -1 }]
};

export function Molecule3DView({ state, settings, width, height, onResize, onSelectAtom, onZoom }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const dragStart = useRef<{ x: number; y: number; yaw: number; pitch: number; panX: number; panY: number; mode: "rotate" | "pan" } | null>(null);
  const spinFrame = useRef<number | null>(null);
  const [camera, setCamera] = useState<Camera3D>({ yaw: -0.62, pitch: 0.46, panX: 0, panY: 0 });
  const [hoveredBondId, setHoveredBondId] = useState<string | null>(null);
  const sceneAtoms = useMemo(() => buildSceneAtoms(state.atoms, state.bonds), [state.atoms, state.bonds]);

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
    draw3D(ctx, sceneAtoms, state.atoms, state.bonds, settings, camera, width, height, hoveredBondId, state.time, state.selectedAtomId);
  }, [camera, height, hoveredBondId, sceneAtoms, settings, state.atoms, state.bonds, state.time, state.selectedAtomId, width]);

  useEffect(() => {
    if (settings.cameraPreset === "free") return;
    const presets: Record<"top" | "side" | "isometric", Camera3D> = {
      top: { yaw: 0, pitch: 0, panX: 0, panY: 0 },
      side: { yaw: -Math.PI / 2, pitch: 0.12, panX: 0, panY: 0 },
      isometric: { yaw: -0.72, pitch: 0.62, panX: 0, panY: 0 }
    };
    setCamera(presets[settings.cameraPreset]);
  }, [settings.cameraPreset]);

  useEffect(() => {
    const tick = () => {
      if (!dragStart.current && sceneAtoms.length) {
        setCamera((current) => ({ ...current, yaw: current.yaw + 0.0022 }));
      }
      spinFrame.current = window.requestAnimationFrame(tick);
    };
    spinFrame.current = window.requestAnimationFrame(tick);
    return () => {
      if (spinFrame.current !== null) window.cancelAnimationFrame(spinFrame.current);
    };
  }, [sceneAtoms.length]);

  const onPointerDown = (event: PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const hit = nearestProjectedAtom(sceneAtoms, camera, width, height, settings, x, y);
    if (hit) onSelectAtom(hit.id);
    const mode = event.shiftKey || event.button === 1 || event.button === 2 ? "pan" : "rotate";
    dragStart.current = { x: event.clientX, y: event.clientY, yaw: camera.yaw, pitch: camera.pitch, panX: camera.panX, panY: camera.panY, mode };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!dragStart.current) {
      const rect = event.currentTarget.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      setHoveredBondId(nearestProjectedBond(sceneAtoms, state.bonds, camera, width, height, settings, x, y)?.id ?? null);
      return;
    }
    const dx = event.clientX - dragStart.current.x;
    const dy = event.clientY - dragStart.current.y;
    if (dragStart.current.mode === "pan") {
      setCamera({
        yaw: dragStart.current.yaw,
        pitch: dragStart.current.pitch,
        panX: clamp(dragStart.current.panX + dx, -width * 0.9, width * 0.9),
        panY: clamp(dragStart.current.panY + dy, -height * 0.9, height * 0.9)
      });
      return;
    }
    setCamera({
      yaw: dragStart.current.yaw + dx * 0.008,
      pitch: clamp(dragStart.current.pitch + dy * 0.006, -1.2, 1.2),
      panX: dragStart.current.panX,
      panY: dragStart.current.panY
    });
  };

  const onPointerUp = (event: PointerEvent<HTMLCanvasElement>) => {
    dragStart.current = null;
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // Pointer capture may already be released.
    }
  };

  const setZoom = (zoom: number) => onZoom(clamp(zoom, 0.55, 2.2));
  const onWheel = (event: WheelEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    setZoom(settings.zoom + (event.deltaY > 0 ? -0.08 : 0.08));
  };

  return (
    <div className="simulation-wrap molecule-3d-wrap" ref={wrapRef}>
      <canvas
        ref={canvasRef}
        className="simulation-canvas molecule-3d-canvas"
        aria-label="3D VSEPR molecule renderer"
        title="Drag to rotate. Shift-drag or right-drag to pan."
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onPointerLeave={() => setHoveredBondId(null)}
        onContextMenu={(event) => event.preventDefault()}
        onWheel={onWheel}
      />
      <div className="zoom-controls" aria-label="3D view controls">
        <button title="Zoom out" onClick={() => setZoom(settings.zoom - 0.12)}><ZoomOut size={17} /></button>
        <span>{Math.round(settings.zoom * 100)}%</span>
        <button title="Zoom in" onClick={() => setZoom(settings.zoom + 0.12)}><ZoomIn size={17} /></button>
        <button title="Reset view" onClick={() => { setZoom(1); setCamera({ yaw: -0.62, pitch: 0.46, panX: 0, panY: 0 }); }}><Maximize2 size={17} /></button>
      </div>
      <div className="canvas-readout">
        <span><Box size={13} /> VSEPR 3D renderer</span>
        <span>{projectionLabel(settings.projectionMode)}</span>
        <span>{state.atoms.length} atoms</span>
        <span>{state.bonds.length} bonds</span>
      </div>
      {!state.atoms.length && (
        <div className="empty-canvas-hint">
          <strong>No molecule to render</strong>
          <span>Build or choose a molecule, then drag to rotate or Shift-drag to pan.</span>
        </div>
      )}
    </div>
  );
}

function buildSceneAtoms(atoms: AtomParticle[], bonds: Bond[]): SceneAtom[] {
  if (!atoms.length) return [];
  const graph = buildMoleculeGraph(atoms, bonds);
  const components = connectedComponents(atoms, bonds);
  const placed = new Map<string, Vec3>();
  let componentOffset = 0;

  for (const component of components) {
    const componentBonds = structuralBonds(bonds).filter((bond) => component.some((atom) => atom.id === bond.a) && component.some((atom) => atom.id === bond.b));
    const useVsepr = component.length <= 24 && componentBonds.length < component.length;
    const offset = { x: componentOffset, y: 0, z: 0 };
    if (useVsepr) {
      placeVseprComponent(component, componentBonds, graph, placed, offset);
    } else {
      placeFlatComponent(component, placed, offset);
    }
    componentOffset += Math.max(3.4, Math.sqrt(component.length) * 1.45);
  }

  centerScene(placed);
  return atoms.map((atom) => ({ ...atom, ...(placed.get(atom.id) ?? { x: 0, y: 0, z: 0 }) }));
}

function placeVseprComponent(component: AtomParticle[], bonds: Bond[], graph: ReturnType<typeof buildMoleculeGraph>, placed: Map<string, Vec3>, offset: Vec3) {
  const root = [...component].sort((a, b) => scoreRoot(b, graph) - scoreRoot(a, graph))[0];
  if (!root) return;
  placed.set(root.id, offset);
  const queue = [root];
  const seen = new Set<string>([root.id]);

  while (queue.length) {
    const center = queue.shift()!;
    const centerPoint = placed.get(center.id)!;
    const neighbors = (graph.neighborsById.get(center.id) ?? []).filter((atom) => component.some((item) => item.id === atom.id));
    const analysis = analyzeAtomGeometry(center, component, bonds);
    const vectors = (analysis ? templates[analysis.axe] : undefined) ?? templates[`AX${neighbors.length}`] ?? radialVectors(neighbors.length);
    const orderedNeighbors = [...neighbors].sort((a, b) => Number(placed.has(a.id)) - Number(placed.has(b.id)));

    orderedNeighbors.forEach((neighbor, index) => {
      if (!placed.has(neighbor.id)) {
        const vector = vectors[index % vectors.length];
        const bond = bonds.find((item) => item.a === center.id && item.b === neighbor.id || item.b === center.id && item.a === neighbor.id);
        const length = bondLengthUnits(bond, center, neighbor);
        placed.set(neighbor.id, {
          x: centerPoint.x + vector.x * length,
          y: centerPoint.y + vector.y * length,
          z: centerPoint.z + vector.z * length
        });
      }
      if (!seen.has(neighbor.id)) {
        seen.add(neighbor.id);
        queue.push(neighbor);
      }
    });
  }
  for (const atom of component) {
    if (!placed.has(atom.id)) placed.set(atom.id, { x: offset.x + (atom.x % 80) / 90, y: (atom.y % 80) / 90, z: 0 });
  }
}

function placeFlatComponent(component: AtomParticle[], placed: Map<string, Vec3>, offset: Vec3) {
  const xs = component.map((atom) => atom.x);
  const ys = component.map((atom) => atom.y);
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
  const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
  const scale = 1 / Math.max(80, Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) / 5);
  for (const atom of component) {
    placed.set(atom.id, {
      x: offset.x + (atom.x - cx) * scale,
      y: (atom.y - cy) * scale,
      z: (atom.z ?? 0) / 120
    });
  }
}

function connectedComponents(atoms: AtomParticle[], bonds: Bond[]) {
  const graph = buildMoleculeGraph(atoms, bonds);
  const seen = new Set<string>();
  const components: AtomParticle[][] = [];
  for (const atom of atoms) {
    if (seen.has(atom.id)) continue;
    const stack = [atom];
    const component: AtomParticle[] = [];
    seen.add(atom.id);
    while (stack.length) {
      const current = stack.pop()!;
      component.push(current);
      for (const neighbor of graph.neighborsById.get(current.id) ?? []) {
        if (seen.has(neighbor.id)) continue;
        seen.add(neighbor.id);
        stack.push(neighbor);
      }
    }
    components.push(component);
  }
  return components;
}

function centerScene(placed: Map<string, Vec3>) {
  const points = [...placed.values()];
  if (!points.length) return;
  const cx = (Math.min(...points.map((p) => p.x)) + Math.max(...points.map((p) => p.x))) / 2;
  const cy = (Math.min(...points.map((p) => p.y)) + Math.max(...points.map((p) => p.y))) / 2;
  const cz = (Math.min(...points.map((p) => p.z)) + Math.max(...points.map((p) => p.z))) / 2;
  for (const point of points) {
    point.x -= cx;
    point.y -= cy;
    point.z -= cz;
  }
}

function scoreRoot(atom: AtomParticle, graph: ReturnType<typeof buildMoleculeGraph>) {
  const degree = graph.neighborsById.get(atom.id)?.length ?? 0;
  return degree * 10 + (atom.symbol === "H" ? -8 : atomData[atom.symbol].atomicNumber);
}

function bondLengthUnits(bond: Bond | undefined, a: AtomParticle, b: AtomParticle) {
  if (!bond) return 1.35;
  const base = Math.max(0.9, Math.min(1.7, bond.length / 92));
  if (a.symbol === "H" || b.symbol === "H") return Math.min(base, 1.18);
  return base;
}

function radialVectors(count: number) {
  return Array.from({ length: Math.max(1, count) }, (_, index) => {
    const angle = index * Math.PI * 2 / Math.max(1, count);
    return { x: Math.cos(angle), y: Math.sin(angle), z: 0 };
  });
}

function draw3D(ctx: CanvasRenderingContext2D, atoms: SceneAtom[], sourceAtoms: AtomParticle[], bonds: Bond[], settings: SimulationSettings, camera: Camera3D, width: number, height: number, hoveredBondId: string | null, time: number, selectedAtomId: string | null) {
  ctx.clearRect(0, 0, width, height);
  draw3DBackground(ctx, settings, width, height);
  const projected = projectAtoms(atoms, camera, width, height, settings);
  const budget = renderBudgetFor(projected);
  const lonePairs = budget.overlays && (settings.highlightLonePairs || settings.showElectronRegions) ? projectLonePairs(lonePairClouds(atoms, bonds), camera, width, height, settings) : [];
  const byId = new Map(projected.map((atom) => [atom.id, atom]));
  const visibleBonds = structuralBonds(bonds).filter((bond) => bondVisibleInMode(bond, byId, settings));
  const focusIds = focusAtomIds(sourceAtoms, bonds, settings, selectedAtomId);
  draw3DMoleculeShadow(ctx, atoms, bonds, settings, camera, width, height, budget);
  if (settings.showElectronRegions && budget.overlays) drawElectronRegionOverlay(ctx, projected, bonds, settings);
  if (settings.showFunctionalGroups) drawFunctionalGroupHighlights3D(ctx, projected, structuralBonds(bonds), settings);

  for (const bond of [...visibleBonds].sort((a, b) => bondDepth(a, byId) - bondDepth(b, byId))) {
    const a = byId.get(bond.a);
    const b = byId.get(bond.b);
    if (a && b) draw3DBond(ctx, a, b, bond, settings, budget, focusIds);
  }
  if ((settings.showBondDipoles || settings.showNetDipole) && budget.overlays) {
    if (settings.showBondDipoles) for (const bond of [...visibleBonds].sort((a, b) => bondDepth(a, byId) - bondDepth(b, byId))) {
      const a = byId.get(bond.a);
      const b = byId.get(bond.b);
      if (a && b) draw3DDipoleIndicator(ctx, a, b, bond, settings);
    }
    if (settings.showNetDipole) drawNetDipole3D(ctx, projected, visibleBonds, settings);
  }
  for (const cloud of [...lonePairs].sort((a, b) => a.depth - b.depth)) {
    const center = byId.get(cloud.centerId);
    if (center) drawLonePairCloud(ctx, cloud, center, settings);
  }
  for (const atom of depthSortedAtoms(projected.filter((atom) => atomVisibleInMode(atom, settings)), visibleBonds)) {
    draw3DAtom(ctx, atom, settings, budget, focusIds);
  }
  for (const atom of frontBondedAtoms(projected.filter((atom) => atomVisibleInMode(atom, settings)), visibleBonds)) {
    draw3DAtom(ctx, atom, settings, budget, focusIds);
  }
  if (settings.showElectronFlow && budget.overlays) drawElectronFlow3D(ctx, projected, visibleBonds, settings, time);
  if (settings.visualStyle === "detailed" && budget.detailedEffects) {
    for (const bond of [...visibleBonds].sort((a, b) => bondDepth(a, byId) - bondDepth(b, byId))) {
      const a = byId.get(bond.a);
      const b = byId.get(bond.b);
      if (a && b) draw3DBondAttachments(ctx, a, b, bond, settings);
    }
  }
  if (budget.overlays) draw3DBondAngleBadge(ctx, projected, visibleBonds, hoveredBondId, settings);
  drawAxisGizmo(ctx, camera, settings, width, height);
  drawMini2DStructure(ctx, sourceAtoms, bonds, settings);
}

function projectAtoms(atoms: SceneAtom[], camera: Camera3D, width: number, height: number, settings: SimulationSettings): ProjectedAtom[] {
  return atoms.map((atom) => ({ ...atom, ...projectPoint(atom, atom.radius * 0.86, camera, width, height, settings) }));
}

function projectLonePairs(clouds: LonePairCloud[], camera: Camera3D, width: number, height: number, settings: SimulationSettings): ProjectedLonePair[] {
  return clouds.map((cloud) => ({ ...cloud, ...projectPoint(cloud, cloud.radius, camera, width, height, settings) }));
}

function projectPoint(point: Vec3, radius: number, camera: Camera3D, width: number, height: number, settings: SimulationSettings) {
  const profile = projectionProfile(settings.projectionMode);
  const scale = Math.min(width, height) * profile.scale * settings.zoom;
  const rotated = rotate({ ...point, z: point.z * profile.depthBoost }, camera.yaw, camera.pitch);
  const perspective = profile.distance === Infinity
    ? 1
    : clamp(profile.distance / Math.max(1.1, profile.distance - rotated.z), profile.minPerspective, profile.maxPerspective);
  const radiusPerspective = profile.scaleAtomRadius ? perspective : 1;
  return {
    sx: width / 2 + camera.panX + rotated.x * scale * perspective,
    sy: height / 2 + camera.panY + rotated.y * scale * perspective,
    depth: rotated.z,
    screenRadius: clamp(radius * radiusPerspective * settings.zoom, 10, 82),
    paintDepth: rotated.z,
    surfaceDepth: rotated.z
  };
}

function renderBudgetFor(atoms: ProjectedAtom[]): RenderBudget {
  const maxRadius = atoms.reduce((max, atom) => Math.max(max, atom.screenRadius), 0);
  const heavy = atoms.length > 36 || maxRadius > 72;
  const veryHeavy = atoms.length > 120;
  return {
    detailedEffects: !heavy,
    atomShadowBlur: heavy ? 0 : atoms.length > 18 ? 5 : 10,
    overlays: atoms.length <= 90,
    labels: !veryHeavy
  };
}

function atomVisibleInMode(atom: ProjectedAtom, settings: SimulationSettings) {
  if (settings.displayMode === "skeleton") return false;
  if (settings.displayMode === "simplified" && atom.symbol === "H") return false;
  return true;
}

function shouldShowAtomLabel(atom: ProjectedAtom, settings: SimulationSettings, budget: RenderBudget, focusIds: Set<string> | null) {
  if (!settings.showLabels || !budget.labels || settings.displayMode === "skeleton") return false;
  if (focusIds?.has(atom.id)) return true;
  if (settings.displayMode === "simplified" && atom.symbol === "H") return false;
  if (settings.zoom < 0.8) return atom.symbol !== "H" && atom.screenRadius > 24;
  if (settings.zoom < 1.15) return atom.symbol !== "H";
  return true;
}

function bondVisibleInMode(bond: Bond, atoms: Map<string, ProjectedAtom>, settings: SimulationSettings) {
  if (settings.displayMode === "full" || settings.displayMode === "skeleton") return true;
  const a = atoms.get(bond.a);
  const b = atoms.get(bond.b);
  if (!a || !b) return false;
  return a.symbol !== "H" && b.symbol !== "H";
}

function focusAtomIds(atoms: AtomParticle[], bonds: Bond[], settings: SimulationSettings, selectedAtomId: string | null) {
  if (!settings.focusMode || !selectedAtomId || !atoms.some((atom) => atom.id === selectedAtomId)) return null;
  const ids = new Set<string>([selectedAtomId]);
  for (const bond of structuralBonds(bonds)) {
    if (bond.a === selectedAtomId) ids.add(bond.b);
    if (bond.b === selectedAtomId) ids.add(bond.a);
  }
  return ids;
}

function depthSortedAtoms(atoms: ProjectedAtom[], bonds: Bond[]) {
  return [...atoms].sort((a, b) => atomPaintDepth(a, atoms, bonds) - atomPaintDepth(b, atoms, bonds));
}

function atomPaintDepth(atom: ProjectedAtom, atoms: ProjectedAtom[], bonds: Bond[]) {
  const surfaceDepth = atom.depth + atom.screenRadius * 0.028;
  const bondedLift = bonds.reduce((lift, bond) => {
    if (bond.a !== atom.id && bond.b !== atom.id) return lift;
    const otherId = bond.a === atom.id ? bond.b : bond.a;
    const other = atoms.find((item) => item.id === otherId);
    if (!other || atom.screenRadius >= other.screenRadius) return lift;
    const distance = Math.hypot(atom.sx - other.sx, atom.sy - other.sy);
    const overlap = atom.screenRadius + other.screenRadius - distance;
    if (overlap <= 0) return lift;
    const frontEnough = atom.depth + 0.22 >= other.depth;
    return frontEnough ? Math.max(lift, clamp(overlap / atom.screenRadius, 0, 1) * 0.42) : lift;
  }, 0);
  const overlapBias = atoms.reduce((total, other) => {
    if (other.id === atom.id) return total;
    const distance = Math.hypot(atom.sx - other.sx, atom.sy - other.sy);
    const overlap = atom.screenRadius + other.screenRadius - distance;
    if (overlap <= 0) return total;
    const frontSurfaceDelta = (atom.depth + atom.screenRadius * 0.028) - (other.depth + other.screenRadius * 0.028);
    return total + clamp(frontSurfaceDelta, -0.48, 0.48) * clamp(overlap / Math.min(atom.screenRadius, other.screenRadius), 0, 1) * 0.35;
  }, 0);
  return surfaceDepth + bondedLift + overlapBias;
}

function frontBondedAtoms(atoms: ProjectedAtom[], bonds: Bond[]) {
  const byId = new Map(atoms.map((atom) => [atom.id, atom]));
  const front = new Map<string, ProjectedAtom>();
  for (const bond of bonds) {
    const a = byId.get(bond.a);
    const b = byId.get(bond.b);
    if (!a || !b) continue;
    const smaller = a.screenRadius <= b.screenRadius ? a : b;
    const larger = smaller.id === a.id ? b : a;
    const distance = Math.hypot(smaller.sx - larger.sx, smaller.sy - larger.sy);
    const overlap = smaller.screenRadius + larger.screenRadius - distance;
    if (overlap <= smaller.screenRadius * 0.08) continue;
    if (smaller.depth < larger.depth - 0.75) continue;
    front.set(smaller.id, smaller);
  }
  return [...front.values()].sort((a, b) => atomPaintDepth(a, atoms, bonds) - atomPaintDepth(b, atoms, bonds));
}

function lonePairClouds(atoms: SceneAtom[], bonds: Bond[]): LonePairCloud[] {
  const clouds: LonePairCloud[] = [];
  const graph = buildMoleculeGraph(atoms, bonds);
  const componentSize = componentSizesByAtom(atoms, structuralBonds(bonds));
  for (const atom of atoms) {
    const analysis = analyzeAtomGeometry(atom, atoms, bonds);
    if (!analysis?.lonePairs) continue;
    if ((componentSize.get(atom.id) ?? atoms.length) > 6) continue;
    if (analysis.bondedAtoms < 2) continue;
    if (!["AX2E", "AX2E2", "AX3E"].includes(analysis.axe)) continue;
    const vectors = lonePairVectorsFor(analysis.axe, analysis.lonePairs, graph.neighborsById.get(atom.id)?.length ?? 0);
    vectors.forEach((vector, index) => {
      const direction = normalizeVec(vector);
      clouds.push({
        id: `lp-${atom.id}-${index}`,
        centerId: atom.id,
        direction,
        x: atom.x + direction.x * 0.64,
        y: atom.y + direction.y * 0.64,
        z: atom.z + direction.z * 0.64,
        radius: Math.max(10, atom.radius * 0.34)
      });
    });
  }
  return clouds;
}

function componentSizesByAtom(atoms: SceneAtom[], bonds: Bond[]) {
  const graph = buildMoleculeGraph(atoms, bonds);
  const sizes = new Map<string, number>();
  const seen = new Set<string>();
  for (const atom of atoms) {
    if (seen.has(atom.id)) continue;
    const stack = [atom];
    const ids: string[] = [];
    seen.add(atom.id);
    while (stack.length) {
      const current = stack.pop()!;
      ids.push(current.id);
      for (const neighbor of graph.neighborsById.get(current.id) ?? []) {
        if (seen.has(neighbor.id)) continue;
        seen.add(neighbor.id);
        stack.push(neighbor as SceneAtom);
      }
    }
    for (const id of ids) sizes.set(id, ids.length);
  }
  return sizes;
}

function lonePairVectorsFor(axe: string, lonePairs: number, bondedAtoms: number): Vec3[] {
  const map: Record<string, Vec3[]> = {
    AX3E: [{ x: 0, y: 0, z: 1 }],
    AX2E2: [{ x: 0.64, y: -0.5, z: 0.58 }, { x: -0.64, y: -0.5, z: 0.58 }],
    AX2E: [{ x: 0, y: -1, z: 0 }],
    AX1E2: [{ x: 0.72, y: 0.35, z: 0.6 }, { x: -0.72, y: 0.35, z: 0.6 }],
    AX1E3: [{ x: 1, y: 0, z: 0 }, { x: -0.5, y: 0.86, z: 0 }, { x: -0.5, y: -0.86, z: 0 }]
  };
  const vectors = map[axe] ?? radialVectors(Math.max(lonePairs + bondedAtoms, lonePairs)).slice(bondedAtoms, bondedAtoms + lonePairs);
  return vectors.slice(0, lonePairs);
}

function projectionProfile(mode: ProjectionMode) {
  if (mode === "orthographic") {
    return { scale: 0.19, depthBoost: 0.92, distance: Infinity, minPerspective: 1, maxPerspective: 1, scaleAtomRadius: false };
  }
  if (mode === "deep-perspective") {
    return { scale: 0.205, depthBoost: 2.25, distance: 3.35, minPerspective: 0.48, maxPerspective: 2.25, scaleAtomRadius: true };
  }
  return { scale: 0.18, depthBoost: 1.38, distance: 6.15, minPerspective: 0.66, maxPerspective: 1.5, scaleAtomRadius: true };
}

function projectionLabel(mode: ProjectionMode) {
  if (mode === "orthographic") return "Orthographic";
  if (mode === "deep-perspective") return "Deep perspective";
  return "Soft perspective";
}

function rotate(point: Vec3, yaw: number, pitch: number) {
  const cosy = Math.cos(yaw);
  const siny = Math.sin(yaw);
  const cosp = Math.cos(pitch);
  const sinp = Math.sin(pitch);
  const x = point.x * cosy - point.z * siny;
  const z = point.x * siny + point.z * cosy;
  return {
    x,
    y: point.y * cosp - z * sinp,
    z: point.y * sinp + z * cosp
  };
}

function normalizeVec(vector: Vec3): Vec3 {
  const length = Math.max(0.001, Math.hypot(vector.x, vector.y, vector.z));
  return { x: vector.x / length, y: vector.y / length, z: vector.z / length };
}

function draw3DBackground(ctx: CanvasRenderingContext2D, settings: SimulationSettings, width: number, height: number) {
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  if (settings.theme === "light") {
    gradient.addColorStop(0, "#f8fbff");
    gradient.addColorStop(1, "#edf6f1");
  } else {
    gradient.addColorStop(0, "#101316");
    gradient.addColorStop(1, "#161c1b");
  }
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  draw3DFadingFloor(ctx, settings, width, height);
  ctx.save();
  ctx.strokeStyle = settings.theme === "light" ? "rgba(24,34,30,0.06)" : "rgba(255,255,255,0.04)";
  ctx.lineWidth = 1;
  for (let x = 24; x < width; x += 42) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 24; y < height; y += 42) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
  ctx.restore();
}

function draw3DFadingFloor(ctx: CanvasRenderingContext2D, settings: SimulationSettings, width: number, height: number) {
  const horizon = height * 0.38;
  const floor = ctx.createLinearGradient(0, horizon, 0, height);
  if (settings.theme === "light") {
    floor.addColorStop(0, "rgba(226,239,235,0)");
    floor.addColorStop(0.28, "rgba(225,238,234,0.16)");
    floor.addColorStop(0.72, "rgba(210,228,224,0.34)");
    floor.addColorStop(1, "rgba(196,218,214,0.5)");
  } else {
    floor.addColorStop(0, "rgba(255,255,255,0)");
    floor.addColorStop(0.36, "rgba(255,255,255,0.035)");
    floor.addColorStop(0.76, "rgba(255,255,255,0.07)");
    floor.addColorStop(1, "rgba(255,255,255,0.105)");
  }
  ctx.save();
  ctx.fillStyle = floor;
  ctx.fillRect(0, horizon, width, height - horizon);
  ctx.strokeStyle = settings.theme === "light" ? "rgba(24,38,34,0.055)" : "rgba(255,255,255,0.04)";
  ctx.lineWidth = 1;
  for (let y = horizon + 10, gap = 14; y < height; gap *= 1.16, y += gap) {
    ctx.globalAlpha = clamp((y - horizon) / (height - horizon), 0, 1) * 0.72;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
  for (let i = -9; i <= 9; i += 1) {
    ctx.globalAlpha = 0.12;
    ctx.beginPath();
    ctx.moveTo(width / 2, horizon);
    ctx.lineTo(width / 2 + i * 70, height);
    ctx.stroke();
  }
  ctx.restore();
}

function draw3DMoleculeShadow(ctx: CanvasRenderingContext2D, atoms: SceneAtom[], bonds: Bond[], settings: SimulationSettings, camera: Camera3D, width: number, height: number, budget: RenderBudget) {
  if (!atoms.length || settings.visualStyle !== "detailed") return;
  const shadowAtoms = projectWorldShadowAtoms(atoms, camera, width, height, settings);
  const byId = new Map(shadowAtoms.map((atom) => [atom.id, atom]));
  const shadowColor = settings.theme === "light" ? "rgba(15,23,42,0.16)" : "rgba(0,0,0,0.38)";
  if (shadowAtoms.length > 34) {
    drawAggregateMoleculeShadow(ctx, shadowAtoms, settings, budget);
    return;
  }
  ctx.save();
  ctx.filter = budget.detailedEffects ? "blur(1.2px)" : "none";
  ctx.globalAlpha = budget.detailedEffects ? 0.54 : 0.4;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = shadowColor;
  ctx.fillStyle = shadowColor;
  for (const bond of [...structuralBonds(bonds)].sort((a, b) => bondDepth(a, byId) - bondDepth(b, byId))) {
    const a = byId.get(bond.a);
    const b = byId.get(bond.b);
    if (!a || !b) continue;
    const segment = visibleBondSegment(a, b);
    if (!segment) continue;
    ctx.lineWidth = clamp((a.screenRadius + b.screenRadius) * 0.055, 2, 7);
    ctx.beginPath();
    ctx.moveTo(segment.startX, segment.startY);
    ctx.lineTo(segment.endX, segment.endY);
    ctx.stroke();
  }
  for (const atom of depthSortedAtoms(shadowAtoms, structuralBonds(bonds))) {
    ctx.beginPath();
    ctx.ellipse(atom.sx, atom.sy, atom.screenRadius * 0.58, atom.screenRadius * 0.16, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function projectWorldShadowAtoms(atoms: SceneAtom[], camera: Camera3D, width: number, height: number, settings: SimulationSettings): ProjectedAtom[] {
  const floorY = Math.max(...atoms.map((atom) => atom.y)) + 1.65;
  const light = lightVector(settings);
  const ray = { x: -light.x * 0.75, y: 1, z: -light.z * 0.75 };
  return atoms.map((atom) => {
    const t = Math.max(0, (floorY - atom.y) / ray.y);
    const shadowPoint = {
      x: atom.x + ray.x * t,
      y: floorY,
      z: atom.z + ray.z * t
    };
    return {
      ...atom,
      x: shadowPoint.x,
      y: shadowPoint.y,
      z: shadowPoint.z,
      ...projectPoint(shadowPoint, atom.radius * 0.34, camera, width, height, settings)
    };
  });
}

function drawAggregateMoleculeShadow(ctx: CanvasRenderingContext2D, atoms: ProjectedAtom[], settings: SimulationSettings, budget: RenderBudget) {
  const minX = Math.min(...atoms.map((atom) => atom.sx - atom.screenRadius * 0.42));
  const maxX = Math.max(...atoms.map((atom) => atom.sx + atom.screenRadius * 0.42));
  const minY = Math.min(...atoms.map((atom) => atom.sy));
  const maxY = Math.max(...atoms.map((atom) => atom.sy));
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const rx = clamp((maxX - minX) * 0.52, 42, 360);
  const ry = clamp((maxY - minY) * 0.42 + 10, 8, 34);
  const core = settings.theme === "light" ? "rgba(15,23,42,0.18)" : "rgba(0,0,0,0.38)";
  const edge = settings.theme === "light" ? "rgba(15,23,42,0)" : "rgba(0,0,0,0)";
  const gradient = ctx.createRadialGradient(cx, cy, 2, cx, cy, Math.max(rx, ry));
  gradient.addColorStop(0, core);
  gradient.addColorStop(0.45, settings.theme === "light" ? "rgba(15,23,42,0.08)" : "rgba(0,0,0,0.18)");
  gradient.addColorStop(1, edge);

  ctx.save();
  ctx.filter = budget.detailedEffects ? "blur(1.4px)" : "none";
  ctx.fillStyle = gradient;
  ctx.globalAlpha = budget.detailedEffects ? 0.62 : 0.42;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();

  const stride = Math.max(2, Math.ceil(atoms.length / 46));
  ctx.fillStyle = settings.theme === "light" ? "rgba(15,23,42,0.09)" : "rgba(0,0,0,0.22)";
  ctx.globalAlpha = budget.detailedEffects ? 0.36 : 0.24;
  atoms.forEach((atom, index) => {
    if (index % stride !== 0) return;
    ctx.beginPath();
    ctx.ellipse(atom.sx, atom.sy, atom.screenRadius * 0.22, Math.max(1.6, atom.screenRadius * 0.05), 0, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}

function drawLonePairCloud(ctx: CanvasRenderingContext2D, cloud: ProjectedLonePair, center: ProjectedAtom, settings: SimulationSettings) {
  const r = cloud.screenRadius;
  const dx = cloud.sx - center.sx;
  const dy = cloud.sy - center.sy;
  const length = Math.max(0.01, Math.hypot(dx, dy));
  const ux = dx / length;
  const uy = dy / length;
  const px = -uy;
  const py = ux;
  const tipX = center.sx + ux * center.screenRadius * 0.82;
  const tipY = center.sy + uy * center.screenRadius * 0.82;
  const bulbX = cloud.sx + ux * r * 0.18;
  const bulbY = cloud.sy + uy * r * 0.18;
  const gradient = ctx.createRadialGradient(bulbX - ux * r * 0.35 - px * r * 0.18, bulbY - uy * r * 0.35 - py * r * 0.18, 1, bulbX, bulbY, r * 1.35);
  gradient.addColorStop(0, settings.theme === "light" ? "rgba(255,255,255,0.72)" : "rgba(226,232,240,0.5)");
  gradient.addColorStop(0.48, settings.theme === "light" ? "rgba(14,165,233,0.24)" : "rgba(56,189,248,0.24)");
  gradient.addColorStop(1, "rgba(14,165,233,0)");
  ctx.save();
  ctx.globalAlpha = clamp(0.34 + (cloud.depth + 2.4) * 0.09, 0.22, 0.64);
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.moveTo(tipX, tipY);
  ctx.bezierCurveTo(tipX + ux * r * 0.72 + px * r * 0.1, tipY + uy * r * 0.72 + py * r * 0.1, bulbX + px * r * 0.92, bulbY + py * r * 0.92, bulbX + ux * r * 0.32, bulbY + uy * r * 0.32);
  ctx.bezierCurveTo(bulbX - px * r * 0.92, bulbY - py * r * 0.92, tipX + ux * r * 0.72 - px * r * 0.1, tipY + uy * r * 0.72 - py * r * 0.1, tipX, tipY);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = settings.theme === "light" ? "rgba(14,116,144,0.22)" : "rgba(125,211,252,0.24)";
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.restore();
}

function drawElectronRegionOverlay(ctx: CanvasRenderingContext2D, atoms: ProjectedAtom[], bonds: Bond[], settings: SimulationSettings) {
  const byId = new Map(atoms.map((atom) => [atom.id, atom]));
  ctx.save();
  for (const atom of atoms) {
    const analysis = analyzeAtomGeometry(atom, atoms, bonds);
    if (!analysis || analysis.electronDomains < 2) continue;
    const pulse = 0.5 + Math.sin((atom.x + atom.y + atom.depth) * 0.8) * 0.08;
    const radius = atom.screenRadius + 18 + analysis.electronDomains * 3;
    ctx.globalAlpha = clamp(0.1 + analysis.lonePairs * 0.035, 0.08, 0.22);
    ctx.fillStyle = settings.theme === "light" ? "rgba(14,165,233,0.34)" : "rgba(56,189,248,0.28)";
    ctx.beginPath();
    ctx.ellipse(atom.sx, atom.sy, radius * (1 + pulse * 0.04), radius * 0.68, -0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.32;
    ctx.strokeStyle = settings.theme === "light" ? "rgba(14,116,144,0.34)" : "rgba(125,211,252,0.36)";
    ctx.setLineDash([5, 6]);
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.setLineDash([]);
  }
  for (const bond of structuralBonds(bonds)) {
    const a = byId.get(bond.a);
    const b = byId.get(bond.b);
    if (!a || !b) continue;
    const segment = visibleBondSegment(a, b);
    if (!segment) continue;
    ctx.globalAlpha = 0.16;
    ctx.strokeStyle = settings.theme === "light" ? "#0ea5e9" : "#7dd3fc";
    ctx.lineWidth = 9;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(segment.startX, segment.startY);
    ctx.lineTo(segment.endX, segment.endY);
    ctx.stroke();
  }
  ctx.restore();
}

function drawFunctionalGroupHighlights3D(ctx: CanvasRenderingContext2D, atoms: ProjectedAtom[], bonds: Bond[], settings: SimulationSettings) {
  if (!atoms.length || settings.displayMode === "skeleton") return;
  const byId = new Map(atoms.map((atom) => [atom.id, atom]));
  const neighbors = new Map<string, ProjectedAtom[]>();
  for (const bond of structuralBonds(bonds)) {
    const a = byId.get(bond.a);
    const b = byId.get(bond.b);
    if (!a || !b) continue;
    neighbors.set(a.id, [...(neighbors.get(a.id) ?? []), b]);
    neighbors.set(b.id, [...(neighbors.get(b.id) ?? []), a]);
  }

  const groups: Array<{ ids: string[]; color: string; label: string }> = [];
  for (const atom of atoms) {
    const bonded = neighbors.get(atom.id) ?? [];
    if (atom.symbol === "O" && bonded.some((item) => item.symbol === "H")) {
      groups.push({ ids: [atom.id, ...bonded.filter((item) => item.symbol === "H").map((item) => item.id)], color: "#06b6d4", label: "OH" });
    }
    if (atom.symbol === "N" && bonded.some((item) => item.symbol === "H" || item.symbol === "C")) {
      groups.push({ ids: [atom.id, ...bonded.slice(0, 3).map((item) => item.id)], color: "#8b5cf6", label: "amine" });
    }
    if (atom.symbol === "C") {
      const oxygenDouble = structuralBonds(bonds).find((bond) => bond.order >= 2 && (bond.a === atom.id || bond.b === atom.id) && byId.get(bond.a === atom.id ? bond.b : bond.a)?.symbol === "O");
      if (oxygenDouble) groups.push({ ids: [atom.id, oxygenDouble.a === atom.id ? oxygenDouble.b : oxygenDouble.a], color: "#f43f5e", label: "C=O" });
    }
  }

  const carbonBackbone = atoms.filter((atom) => atom.symbol === "C" && (neighbors.get(atom.id) ?? []).filter((item) => item.symbol === "C").length >= 2);
  if (carbonBackbone.length >= 6) {
    groups.push({ ids: carbonBackbone.slice(0, 12).map((atom) => atom.id), color: "#f59e0b", label: "aromatic" });
  }

  const seen = new Set<string>();
  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (const group of groups) {
    const key = [...group.ids].sort().join("-");
    if (seen.has(key)) continue;
    seen.add(key);
    const pts = group.ids.map((id) => byId.get(id)).filter((atom): atom is ProjectedAtom => Boolean(atom));
    if (!pts.length) continue;
    const cx = pts.reduce((sum, atom) => sum + atom.sx, 0) / pts.length;
    const cy = pts.reduce((sum, atom) => sum + atom.sy, 0) / pts.length;
    const radius = clamp(Math.max(...pts.map((atom) => Math.hypot(atom.sx - cx, atom.sy - cy) + atom.screenRadius * 0.8)), 26, 94);
    ctx.globalAlpha = settings.theme === "light" ? 0.14 : 0.2;
    ctx.fillStyle = group.color;
    ctx.beginPath();
    ctx.ellipse(cx, cy, radius * 1.08, radius * 0.72, -0.28, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = settings.theme === "light" ? 0.42 : 0.52;
    ctx.strokeStyle = group.color;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 6]);
    ctx.stroke();
    ctx.setLineDash([]);
    if (settings.zoom >= 0.85) {
      ctx.globalAlpha = settings.theme === "light" ? 0.86 : 0.92;
      ctx.fillStyle = group.color;
      ctx.font = "800 11px Inter, system-ui";
      ctx.fillText(group.label, cx, cy - radius * 0.82);
    }
  }
  ctx.restore();
}

function draw3DBond(ctx: CanvasRenderingContext2D, a: ProjectedAtom, b: ProjectedAtom, bond: Bond, settings: SimulationSettings, budget: RenderBudget, focusIds: Set<string> | null) {
  const colors = settings.theme === "light" ? { covalent: "#465569", polar: "#2563eb", ionic: "#c2410c" } : { covalent: "#d8e1df", polar: "#38bdf8", ionic: "#f59e0b" };
  const color = bond.kind === "ionic" ? colors.ionic : bond.kind === "polar-covalent" ? colors.polar : colors.covalent;
  const segment = visibleBondSegment(a, b);
  if (!segment) return;
  const offsets = bond.order === 1 ? [0] : bond.order === 2 ? [-4, 4] : [-6, 0, 6];
  const depthAlpha = clamp(0.5 + ((a.depth + b.depth) / 2 + 2.8) * 0.14, 0.36, 1);
  const avgDepth = (a.depth + b.depth) / 2;
  const lineWidth = clamp((a.screenRadius + b.screenRadius) * 0.075 * (1 + avgDepth * 0.08), 2.6, 9.5);
  const shadeColor = settings.theme === "light" ? "rgba(15,23,42,0.26)" : "rgba(0,0,0,0.48)";
  const highlightColor = hexToRgba(settings.lightColor, settings.theme === "light" ? 0.42 : 0.3);
  const light = lightScreen(settings);
  const nearer = a.depth >= b.depth ? a : b;
  const nearT = nearer.id === b.id ? 1 : 0;
  const focusAlpha = focusIds && !focusIds.has(a.id) && !focusIds.has(b.id) ? 0.18 : 1;

  ctx.save();
  ctx.lineCap = "round";
  ctx.shadowColor = color;
  ctx.shadowBlur = settings.visualStyle === "detailed" && budget.detailedEffects ? 6 : 0;
  for (const offset of offsets) {
    const startX = segment.startX + segment.px * offset;
    const startY = segment.startY + segment.py * offset;
    const endX = segment.endX + segment.px * offset;
    const endY = segment.endY + segment.py * offset;
    const midX = startX + (endX - startX) * (nearT ? 0.56 : 0.44);
    const midY = startY + (endY - startY) * (nearT ? 0.56 : 0.44);
    const nearX = nearT ? endX : startX;
    const nearY = nearT ? endY : startY;
    const tubeShadowX = -light.x * 2.1;
    const tubeShadowY = -light.y * 2.1;
    const tubeLightX = light.x * 1.15 + segment.px * 0.34;
    const tubeLightY = light.y * 1.15 + segment.py * 0.34;

    ctx.beginPath();
    ctx.moveTo(startX + tubeShadowX, startY + tubeShadowY);
    ctx.lineTo(endX + tubeShadowX, endY + tubeShadowY);
    ctx.strokeStyle = shadeColor;
    ctx.globalAlpha = depthAlpha * 0.58 * focusAlpha;
    ctx.lineWidth = lineWidth + 2.4;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.strokeStyle = color;
    ctx.globalAlpha = depthAlpha * focusAlpha;
    ctx.lineWidth = lineWidth;
    ctx.stroke();

    if (budget.detailedEffects) {
      ctx.beginPath();
      ctx.moveTo(nearX + tubeLightX, nearY + tubeLightY);
      ctx.lineTo(midX + tubeLightX, midY + tubeLightY);
      ctx.strokeStyle = highlightColor;
      ctx.globalAlpha = clamp(depthAlpha + 0.12, 0.4, 0.92) * focusAlpha;
      ctx.lineWidth = Math.max(1.1, lineWidth * 0.32);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function draw3DBondAttachments(ctx: CanvasRenderingContext2D, a: ProjectedAtom, b: ProjectedAtom, bond: Bond, settings: SimulationSettings) {
  if (settings.zoom < 1.05 || settings.displayMode !== "full") return;
  const colors = settings.theme === "light" ? { covalent: "#465569", polar: "#2563eb", ionic: "#c2410c" } : { covalent: "#d8e1df", polar: "#38bdf8", ionic: "#f59e0b" };
  const color = bond.kind === "ionic" ? colors.ionic : bond.kind === "polar-covalent" ? colors.polar : colors.covalent;
  const segment = visibleBondSegment(a, b);
  if (!segment) return;
  const depthAlpha = clamp(0.5 + ((a.depth + b.depth) / 2 + 2.8) * 0.14, 0.42, 1);
  const lineWidth = clamp((a.screenRadius + b.screenRadius) * 0.075, 3, 8);
  if (attachmentIsVisible(a, b)) drawBondAttachment(ctx, segment.startX, segment.startY, lineWidth, color, settings, depthAlpha);
  if (attachmentIsVisible(b, a)) drawBondAttachment(ctx, segment.endX, segment.endY, lineWidth, color, settings, depthAlpha);
}

function attachmentIsVisible(endpoint: ProjectedAtom, other: ProjectedAtom) {
  const depthGap = endpoint.depth - other.depth;
  if (depthGap < -0.16) return false;
  const overlap = endpoint.screenRadius + other.screenRadius - Math.hypot(endpoint.sx - other.sx, endpoint.sy - other.sy);
  if (overlap > endpoint.screenRadius * 0.24 && depthGap < 0.18) return false;
  return true;
}

function draw3DDipoleIndicator(ctx: CanvasRenderingContext2D, a: ProjectedAtom, b: ProjectedAtom, bond: Bond, settings: SimulationSettings) {
  if ((bond.kind !== "polar-covalent" && bond.kind !== "ionic") || !bond.electronShift) return;
  const segment = visibleBondSegment(a, b);
  if (!segment) return;
  const target = bond.electronShift === a.id ? a : b;
  const source = target.id === a.id ? b : a;
  const towardTarget = target.id === b.id ? 1 : -1;
  const ux = segment.ux * towardTarget;
  const uy = segment.uy * towardTarget;
  const startX = (towardTarget === 1 ? segment.startX : segment.endX) + segment.px * 14;
  const startY = (towardTarget === 1 ? segment.startY : segment.endY) + segment.py * 14;
  const endX = (towardTarget === 1 ? segment.endX : segment.startX) + segment.px * 14;
  const endY = (towardTarget === 1 ? segment.endY : segment.startY) + segment.py * 14;
  const color = settings.theme === "light" ? "rgba(37,99,235,0.72)" : "rgba(56,189,248,0.78)";
  const strength = bond.kind === "ionic" ? 1.7 : clamp(bond.polarity, 0.2, 1.8);
  const lineWidth = clamp(1.2 + strength * 1.15, 1.4, 3.7);
  const alpha = clamp(0.32 + strength * 0.34, 0.38, 0.95);

  ctx.save();
  ctx.globalAlpha = alpha * clamp(0.56 + ((a.depth + b.depth) / 2 + 2.8) * 0.13, 0.42, 1);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = "round";
  if (bond.kind === "ionic") ctx.setLineDash([6, 5]);
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(endX - ux * 9, endY - uy * 9);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(endX, endY);
  ctx.lineTo(endX - ux * 9 + segment.py * 4.8, endY - uy * 9 - segment.px * 4.8);
  ctx.lineTo(endX - ux * 9 - segment.py * 4.8, endY - uy * 9 + segment.px * 4.8);
  ctx.closePath();
  ctx.fill();
  if (settings.showCharges) {
  ctx.font = "800 12px Inter, system-ui";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
    ctx.fillStyle = settings.theme === "light" ? "#2563eb" : "#38bdf8";
    ctx.fillText("δ-", target.sx + segment.px * 22, target.sy + segment.py * 22);
    ctx.fillStyle = settings.theme === "light" ? "#dc2626" : "#fb7185";
    ctx.fillText("+", source.sx - segment.ux * 12 - segment.px * 18, source.sy - segment.uy * 12 - segment.py * 18);
    ctx.fillText("δ+", source.sx - segment.px * 22, source.sy - segment.py * 22);
  }
  ctx.restore();
}

function drawNetDipole3D(ctx: CanvasRenderingContext2D, atoms: ProjectedAtom[], bonds: Bond[], settings: SimulationSettings) {
  const byId = new Map(atoms.map((atom) => [atom.id, atom]));
  const net = bonds.reduce((acc, bond) => {
    if ((bond.kind !== "polar-covalent" && bond.kind !== "ionic") || !bond.electronShift) return acc;
    const a = byId.get(bond.a);
    const b = byId.get(bond.b);
    const target = byId.get(bond.electronShift);
    if (!a || !b || !target) return acc;
    const source = target.id === a.id ? b : a;
    const strength = bond.kind === "ionic" ? 1.4 : clamp(bond.polarity, 0.2, 1.6);
    acc.x += (target.sx - source.sx) * strength;
    acc.y += (target.sy - source.sy) * strength;
    return acc;
  }, { x: 0, y: 0 });
  const magnitude = Math.hypot(net.x, net.y);
  if (magnitude < 18 || !atoms.length) return;
  const mass = atoms.reduce((sum, atom) => sum + atomData[atom.symbol].atomicNumber, 0) || atoms.length;
  const cx = atoms.reduce((sum, atom) => sum + atom.sx * atomData[atom.symbol].atomicNumber, 0) / mass;
  const cy = atoms.reduce((sum, atom) => sum + atom.sy * atomData[atom.symbol].atomicNumber, 0) / mass;
  const ux = net.x / magnitude;
  const uy = net.y / magnitude;
  const length = clamp(magnitude / Math.max(1, bonds.length) * 3.8, 34, 92);
  const width = clamp(2.2 + magnitude / Math.max(1, bonds.length) * 0.05, 2.4, 6);
  drawArrow(ctx, cx - ux * length * 0.42, cy - uy * length * 0.42, cx + ux * length * 0.58, cy + uy * length * 0.58, settings.theme === "light" ? "#0f766e" : "#5eead4", width, "net μ");
}

function drawElectronFlow3D(ctx: CanvasRenderingContext2D, atoms: ProjectedAtom[], bonds: Bond[], settings: SimulationSettings, time: number) {
  const byId = new Map(atoms.map((atom) => [atom.id, atom]));
  ctx.save();
  for (const bond of bonds) {
    if (bond.kind === "metallic" || bond.kind === "hydrogen" || bond.kind === "dispersion") continue;
    const a = byId.get(bond.a);
    const b = byId.get(bond.b);
    if (!a || !b) continue;
    const segment = visibleBondSegment(a, b);
    if (!segment) continue;
    const target = bond.electronShift ? byId.get(bond.electronShift) : null;
    const reverse = target?.id === a.id;
    const count = bond.order + (bond.kind === "ionic" ? 1 : 0);
    for (let index = 0; index < count; index += 1) {
      const phase = (time * (0.42 + index * 0.08) + index / count) % 1;
      const t = reverse ? 1 - phase : phase;
      const x = segment.startX + (segment.endX - segment.startX) * t + segment.px * (index - (count - 1) / 2) * 5;
      const y = segment.startY + (segment.endY - segment.startY) * t + segment.py * (index - (count - 1) / 2) * 5;
      ctx.globalAlpha = clamp(0.35 + ((a.depth + b.depth) / 2 + 2.8) * 0.12, 0.28, 0.8);
      ctx.fillStyle = bond.kind === "ionic" ? "#f97316" : settings.theme === "light" ? "#2563eb" : "#67e8f9";
      ctx.beginPath();
      ctx.arc(x, y, bond.kind === "ionic" ? 3.2 : 2.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function visibleBondSegment(a: ProjectedAtom, b: ProjectedAtom): BondSegment | null {
  const dx = b.sx - a.sx;
  const dy = b.sy - a.sy;
  const length = Math.hypot(dx, dy);
  if (length < 0.01) return null;

  const ux = dx / length;
  const uy = dy / length;
  const px = -uy;
  const py = ux;
  const minVisible = clamp(Math.min(a.screenRadius, b.screenRadius) * 0.28, 7, 18);
  const nominalStartInset = a.screenRadius * 0.92;
  const nominalEndInset = b.screenRadius * 0.92;
  const available = length - nominalStartInset - nominalEndInset;

  let startInset = nominalStartInset;
  let endInset = nominalEndInset;
  if (available < minVisible) {
    const scale = Math.max(0.1, (length - minVisible) / Math.max(1, nominalStartInset + nominalEndInset));
    startInset = Math.max(2, nominalStartInset * scale);
    endInset = Math.max(2, nominalEndInset * scale);
  }

  if (length - startInset - endInset < 2) {
    startInset = Math.max(1, length * 0.35);
    endInset = Math.max(1, length * 0.35);
  }

  return {
    ux,
    uy,
    px,
    py,
    length,
    startX: a.sx + ux * startInset,
    startY: a.sy + uy * startInset,
    endX: b.sx - ux * endInset,
    endY: b.sy - uy * endInset
  };
}

function drawBondAttachment(ctx: CanvasRenderingContext2D, x: number, y: number, lineWidth: number, color: string, settings: SimulationSettings, alpha: number) {
  const radius = clamp(lineWidth * 0.45, 1.7, 3.6);
  ctx.save();
  ctx.shadowBlur = 0;
  ctx.globalAlpha = clamp(alpha, 0.35, 0.78);
  ctx.fillStyle = settings.theme === "light" ? "rgba(255,255,255,0.9)" : "rgba(226,232,240,0.82)";
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.25;
  ctx.stroke();
  ctx.restore();
}

function draw3DAtom(ctx: CanvasRenderingContext2D, atom: ProjectedAtom, settings: SimulationSettings, budget: RenderBudget, focusIds: Set<string> | null) {
  const data = atomData[atom.symbol];
  const r = atom.screenRadius;
  const light = lightScreen(settings);
  const intensity = clamp(settings.lightIntensity, 0.25, 1.8);
  const lightX = atom.sx + r * light.x;
  const lightY = atom.sy + r * light.y;
  const gradient = ctx.createRadialGradient(lightX, lightY, 1, atom.sx + r * 0.15, atom.sy + r * 0.18, r * 1.12);
  gradient.addColorStop(0, mixHex(settings.lightColor, "#ffffff", 0.55));
  gradient.addColorStop(0.2, data.color);
  gradient.addColorStop(0.72, data.color);
  gradient.addColorStop(1, settings.theme === "light" ? "#d8e2df" : "#111827");

  ctx.save();
  const focusAlpha = focusIds && !focusIds.has(atom.id) ? 0.16 : 1;
  const depthAlpha = clamp(0.58 + (atom.depth + 2.8) * 0.13, 0.38, 1) * focusAlpha;
  ctx.globalAlpha = depthAlpha;
  ctx.filter = "none";
  ctx.shadowColor = data.glow;
  ctx.shadowBlur = settings.visualStyle === "detailed" ? budget.atomShadowBlur * intensity : 0;
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(atom.sx, atom.sy, r, 0, Math.PI * 2);
  ctx.fill();
  if (settings.visualStyle === "detailed" && budget.detailedEffects) {
    const shade = ctx.createRadialGradient(atom.sx - r * 0.34, atom.sy - r * 0.42, r * 0.08, atom.sx + r * 0.32, atom.sy + r * 0.36, r * 1.16);
    shade.addColorStop(0, "rgba(255,255,255,0)");
    shade.addColorStop(0.64, "rgba(15,23,42,0.04)");
    shade.addColorStop(1, settings.theme === "light" ? "rgba(15,23,42,0.18)" : "rgba(0,0,0,0.34)");
    ctx.fillStyle = shade;
    ctx.beginPath();
    ctx.arc(atom.sx, atom.sy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = Math.min(1, depthAlpha + 0.08);
    ctx.fillStyle = hexToRgba(mixHex(settings.lightColor, "#ffffff", 0.35), settings.theme === "light" ? 0.84 : 0.68);
    ctx.beginPath();
    ctx.arc(lightX, lightY, Math.max(4, r * 0.18), 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = depthAlpha;
  }
  ctx.shadowBlur = 0;
  ctx.filter = "none";
  ctx.strokeStyle = settings.theme === "light" ? "rgba(24,34,30,0.2)" : "rgba(255,255,255,0.24)";
  ctx.lineWidth = 1.4;
  ctx.stroke();
  ctx.fillStyle = settings.theme === "light" ? "#17211d" : "#f8fafc";
  ctx.font = `800 ${Math.max(12, r * 0.56)}px Inter, system-ui`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  if (settings.displayMode !== "skeleton") ctx.fillText(atom.symbol, atom.sx, atom.sy);
  if (shouldShowAtomLabel(atom, settings, budget, focusIds)) {
    ctx.font = "700 11px Inter, system-ui";
    ctx.fillStyle = settings.theme === "light" ? "rgba(24,38,34,0.72)" : "rgba(241,245,249,0.72)";
    ctx.fillText(data.name, atom.sx, atom.sy + r + 16);
  }
  ctx.restore();
}

function draw3DBondAngleBadge(ctx: CanvasRenderingContext2D, atoms: ProjectedAtom[], bonds: Bond[], bondId: string | null, settings: SimulationSettings) {
  if (!bondId) return;
  const bond = bonds.find((item) => item.id === bondId);
  if (!bond || bond.kind === "hydrogen" || bond.kind === "dispersion" || bond.kind === "metallic") return;
  const byId = new Map(atoms.map((atom) => [atom.id, atom]));
  const a = byId.get(bond.a);
  const b = byId.get(bond.b);
  if (!a || !b) return;
  const candidates = [bond.a, bond.b].flatMap((centerId) => {
    const center = byId.get(centerId);
    const endpoint = byId.get(centerId === bond.a ? bond.b : bond.a);
    if (!center || !endpoint) return [];
    const neighbors = bonds
      .filter((item) => item.id !== bond.id && (item.a === centerId || item.b === centerId))
      .map((item) => byId.get(item.a === centerId ? item.b : item.a))
      .filter((atom): atom is ProjectedAtom => Boolean(atom));
    return neighbors.map((other) => ({
      angle: angleBetween3D(center, endpoint, other),
      centralDegree: neighbors.length + 1,
      other
    }));
  });
  if (!candidates.length) return;
  const best = candidates.sort((left, right) => right.centralDegree - left.centralDegree || Math.abs(right.angle - 109.5) - Math.abs(left.angle - 109.5))[0];
  const x = (a.sx + b.sx + best.other.sx) / 3;
  const y = (a.sy + b.sy + best.other.sy) / 3 - 24;
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

function angleBetween3D(center: ProjectedAtom, a: ProjectedAtom, b: ProjectedAtom) {
  const ax = a.x - center.x;
  const ay = a.y - center.y;
  const az = a.z - center.z;
  const bx = b.x - center.x;
  const by = b.y - center.y;
  const bz = b.z - center.z;
  const dot = ax * bx + ay * by + az * bz;
  const mag = Math.max(0.01, Math.hypot(ax, ay, az) * Math.hypot(bx, by, bz));
  return Math.acos(clamp(dot / mag, -1, 1)) * 180 / Math.PI;
}

function drawAxisGizmo(ctx: CanvasRenderingContext2D, camera: Camera3D, settings: SimulationSettings, width: number, height: number) {
  const origin = { x: width - 92, y: height - 86 };
  const axes = [
    { label: "X", color: "#ef4444", point: rotate({ x: 1, y: 0, z: 0 }, camera.yaw, camera.pitch) },
    { label: "Y", color: "#22c55e", point: rotate({ x: 0, y: 1, z: 0 }, camera.yaw, camera.pitch) },
    { label: "Z", color: "#3b82f6", point: rotate({ x: 0, y: 0, z: 1 }, camera.yaw, camera.pitch) }
  ].sort((a, b) => a.point.z - b.point.z);

  ctx.save();
  ctx.fillStyle = settings.theme === "light" ? "rgba(255,255,255,0.76)" : "rgba(10,12,12,0.58)";
  ctx.strokeStyle = settings.theme === "light" ? "rgba(24,34,30,0.12)" : "rgba(255,255,255,0.12)";
  roundRect(ctx, origin.x - 42, origin.y - 42, 84, 84, 8);
  ctx.fill();
  ctx.stroke();
  ctx.lineCap = "round";
  for (const axis of axes) {
    const x = origin.x + axis.point.x * 30;
    const y = origin.y + axis.point.y * 30;
    ctx.globalAlpha = clamp(0.56 + axis.point.z * 0.28, 0.38, 1);
    ctx.strokeStyle = axis.color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(origin.x, origin.y);
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.fillStyle = axis.color;
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = "800 11px Inter, system-ui";
    ctx.fillText(axis.label, x + 6, y + 4);
  }
  ctx.restore();
}

function drawMini2DStructure(ctx: CanvasRenderingContext2D, atoms: AtomParticle[], bonds: Bond[], settings: SimulationSettings) {
  if (!atoms.length) return;
  const box = { x: 14, y: 14, w: 178, h: 136 };
  const xs = atoms.map((atom) => atom.x);
  const ys = atoms.map((atom) => atom.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const scale = Math.min((box.w - 34) / Math.max(1, maxX - minX), (box.h - 42) / Math.max(1, maxY - minY), 0.62);
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const pointFor = (atom: AtomParticle) => ({
    x: box.x + box.w / 2 + (atom.x - cx) * scale,
    y: box.y + box.h / 2 + (atom.y - cy) * scale + 7
  });

  ctx.save();
  ctx.fillStyle = settings.theme === "light" ? "rgba(255,255,255,0.78)" : "rgba(10,12,12,0.58)";
  ctx.strokeStyle = settings.theme === "light" ? "rgba(24,34,30,0.12)" : "rgba(255,255,255,0.12)";
  roundRect(ctx, box.x, box.y, box.w, box.h, 8);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = settings.theme === "light" ? "#20302a" : "#eef5f1";
  ctx.font = "800 11px Inter, system-ui";
  ctx.fillText("2D structure", box.x + 12, box.y + 20);

  const atomById = new Map(atoms.map((atom) => [atom.id, atom]));
  ctx.lineCap = "round";
  for (const bond of structuralBonds(bonds)) {
    const a = atomById.get(bond.a);
    const b = atomById.get(bond.b);
    if (!a || !b) continue;
    const pa = pointFor(a);
    const pb = pointFor(b);
    ctx.strokeStyle = settings.theme === "light" ? "rgba(51,65,85,0.62)" : "rgba(229,231,235,0.72)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(pa.x, pa.y);
    ctx.lineTo(pb.x, pb.y);
    ctx.stroke();
  }
  for (const atom of atoms) {
    const p = pointFor(atom);
    const data = atomData[atom.symbol];
    ctx.fillStyle = data.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, atom.symbol === "H" ? 5 : 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = settings.theme === "light" ? "rgba(24,34,30,0.18)" : "rgba(255,255,255,0.22)";
    ctx.stroke();
  }
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

function nearestProjectedAtom(atoms: SceneAtom[], camera: Camera3D, width: number, height: number, settings: SimulationSettings, x: number, y: number) {
  return projectAtoms(atoms, camera, width, height, settings)
    .sort((a, b) => b.depth - a.depth)
    .find((atom) => Math.hypot(atom.sx - x, atom.sy - y) <= atom.screenRadius + 10) ?? null;
}

function nearestProjectedBond(atoms: SceneAtom[], bonds: Bond[], camera: Camera3D, width: number, height: number, settings: SimulationSettings, x: number, y: number) {
  const projected = projectAtoms(atoms, camera, width, height, settings);
  const byId = new Map(projected.map((atom) => [atom.id, atom]));
  let best: Bond | null = null;
  let bestDistance = 12;
  for (const bond of structuralBonds(bonds)) {
    const a = byId.get(bond.a);
    const b = byId.get(bond.b);
    if (!a || !b) continue;
    const segment = visibleBondSegment(a, b);
    if (!segment) continue;
    const distance = distanceToSegment(x, y, segment.startX, segment.startY, segment.endX, segment.endY);
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

function bondDepth(bond: Bond, atoms: Map<string, ProjectedAtom>) {
  return ((atoms.get(bond.a)?.depth ?? 0) + (atoms.get(bond.b)?.depth ?? 0)) / 2;
}

function lightVector(settings: SimulationSettings): Vec3 {
  const yaw = settings.lightYaw * Math.PI / 180;
  const pitch = settings.lightPitch * Math.PI / 180;
  return {
    x: Math.sin(yaw) * Math.cos(pitch),
    y: -Math.sin(pitch),
    z: Math.cos(yaw) * Math.cos(pitch)
  };
}

function lightScreen(settings: SimulationSettings) {
  const vector = lightVector(settings);
  const length = Math.max(0.001, Math.hypot(vector.x, vector.y));
  return { x: vector.x / length, y: vector.y / length };
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

function hexToRgba(hex: string, alpha: number) {
  const clean = hex.replace("#", "");
  const value = Number.parseInt(clean.length === 3 ? clean.split("").map((item) => item + item).join("") : clean, 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

function mixHex(a: string, b: string, amount: number) {
  const ca = parseHex(a);
  const cb = parseHex(b);
  const mix = (left: number, right: number) => Math.round(left * (1 - amount) + right * amount);
  return `rgb(${mix(ca.r, cb.r)},${mix(ca.g, cb.g)},${mix(ca.b, cb.b)})`;
}

function parseHex(hex: string) {
  const clean = hex.replace("#", "");
  const value = Number.parseInt(clean.length === 3 ? clean.split("").map((item) => item + item).join("") : clean, 16);
  return { r: (value >> 16) & 255, g: (value >> 8) & 255, b: value & 255 };
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
