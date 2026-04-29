import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import { Box, Maximize2, ZoomIn, ZoomOut } from "lucide-react";
import { atomData } from "../data/atoms";
import type { AtomParticle, Bond, ProjectionMode, SimulationSettings, SimulationState } from "../types";
import { detectFunctionalGroups, type FunctionalGroup } from "../simulation/functionalGroups";
import { buildMoleculeGraph, structuralBonds } from "../simulation/graph";
import { analyzeAtomGeometry } from "../simulation/vsepr";

type Props = {
  state: SimulationState;
  settings: SimulationSettings;
  running: boolean;
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
type RenderBudget = { detailedEffects: boolean; overlays: boolean; labels: boolean };
type DetailLevel = "abstract" | "structure" | "detail";
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
type InteractionContext = {
  selectedAtomId: string | null;
  hoveredAtomId: string | null;
  hoveredBondId: string | null;
  longHover: number;
  centralAtomIds: Set<string>;
  activeAtomIds: Set<string>;
  activeBondIds: Set<string>;
  focusIds: Set<string> | null;
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

export function Molecule3DView({ state, settings, running, width, height, onResize, onSelectAtom, onZoom }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const dragStart = useRef<{ x: number; y: number; yaw: number; pitch: number; panX: number; panY: number; mode: "rotate" | "pan" } | null>(null);
  const spinFrame = useRef<number | null>(null);
  const hoverStartedAt = useRef(0);
  const [camera, setCamera] = useState<Camera3D>({ yaw: -0.62, pitch: 0.46, panX: 0, panY: 0 });
  const [hoveredAtomId, setHoveredAtomId] = useState<string | null>(null);
  const [hoveredBondId, setHoveredBondId] = useState<string | null>(null);
  const sceneAtoms = useMemo(
    () => buildSceneAtoms(state.atoms, state.bonds, settings, state.time),
    [settings.collisionStrength, settings.geometryAssist, settings.geometryMode, settings.relaxationStrength, settings.speed, settings.temperature, state.atoms, state.bonds, state.time]
  );

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
    const longHover = hoveredAtomId ? clamp((Date.now() - hoverStartedAt.current) / 900, 0, 1) : 0;
    draw3D(ctx, sceneAtoms, state.atoms, state.bonds, settings, camera, width, height, hoveredAtomId, hoveredBondId, longHover, state.time, state.selectedAtomId);
  }, [camera, height, hoveredAtomId, hoveredBondId, sceneAtoms, settings, state.atoms, state.bonds, state.time, state.selectedAtomId, width]);

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
    if (!running || !sceneAtoms.length) {
      if (spinFrame.current !== null) {
        window.cancelAnimationFrame(spinFrame.current);
        spinFrame.current = null;
      }
      return;
    }
    const tick = () => {
      if (!dragStart.current && sceneAtoms.length) {
        setCamera((current) => ({ ...current, yaw: current.yaw + 0.0022 }));
      }
      spinFrame.current = window.requestAnimationFrame(tick);
    };
    spinFrame.current = window.requestAnimationFrame(tick);
    return () => {
      if (spinFrame.current !== null) window.cancelAnimationFrame(spinFrame.current);
      spinFrame.current = null;
    };
  }, [running, sceneAtoms.length]);

  const onPointerDown = (event: PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const hit = nearestProjectedAtom(sceneAtoms, camera, width, height, settings, x, y);
    if (hit) onSelectAtom(hit.id);
    if (!hit && settings.focusMode) onSelectAtom(null);
    const mode = event.shiftKey || event.button === 1 || event.button === 2 ? "pan" : "rotate";
    dragStart.current = { x: event.clientX, y: event.clientY, yaw: camera.yaw, pitch: camera.pitch, panX: camera.panX, panY: camera.panY, mode };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!dragStart.current) {
      const rect = event.currentTarget.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const atom = nearestProjectedAtom(sceneAtoms, camera, width, height, settings, x, y);
      setHoveredAtomId((current) => {
        const next = atom?.id ?? null;
        if (current !== next) hoverStartedAt.current = Date.now();
        return next;
      });
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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const handleWheel = (event: globalThis.WheelEvent) => {
      event.preventDefault();
      setZoom(settings.zoom + (event.deltaY > 0 ? -0.08 : 0.08));
    };
    canvas.addEventListener("wheel", handleWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", handleWheel);
  }, [settings.zoom]);

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
        onPointerLeave={() => {
          setHoveredAtomId(null);
          setHoveredBondId(null);
        }}
        onContextMenu={(event) => event.preventDefault()}
      />
      <div className="zoom-controls" aria-label="3D view controls">
        <button title="Zoom out" onClick={() => setZoom(settings.zoom - 0.12)}><ZoomOut size={17} /></button>
        <span>{Math.round(settings.zoom * 100)}%</span>
        <button title="Zoom in" onClick={() => setZoom(settings.zoom + 0.12)}><ZoomIn size={17} /></button>
        <button title="Reset view" onClick={() => { setZoom(1); setCamera({ yaw: -0.62, pitch: 0.46, panX: 0, panY: 0 }); }}><Maximize2 size={17} /></button>
      </div>
      <aside className="camera-guide" aria-label="Camera controls guide">
        <strong>Camera</strong>
        <span><kbd>Drag</kbd> Rotate</span>
        <span><kbd>Shift</kbd><kbd>Drag</kbd> Pan</span>
        <span><kbd>Wheel</kbd> Zoom</span>
        <span><kbd>Right drag</kbd> Pan</span>
      </aside>
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

function buildSceneAtoms(atoms: AtomParticle[], bonds: Bond[], settings: SimulationSettings, time: number): SceneAtom[] {
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
  apply3DControlResponse(placed, atoms, bonds, settings, time);
  return atoms.map((atom) => ({ ...atom, ...(placed.get(atom.id) ?? { x: 0, y: 0, z: 0 }) }));
}

function apply3DControlResponse(placed: Map<string, Vec3>, atoms: AtomParticle[], bonds: Bond[], settings: SimulationSettings, time: number) {
  if (settings.geometryMode === "rigid") return;
  const relaxation = clamp(settings.relaxationStrength / 1.2, 0, 1);
  const livePoints = normalizedLivePoints(atoms);
  const liveBlend = settings.geometryAssist
    ? clamp((1 - relaxation) * 0.34 + settings.collisionStrength * 0.02, 0.035, 0.38)
    : 0.58;

  for (const atom of atoms) {
    const point = placed.get(atom.id);
    const live = livePoints.get(atom.id);
    if (!point || !live) continue;
    point.x = point.x * (1 - liveBlend) + live.x * liveBlend;
    point.y = point.y * (1 - liveBlend) + live.y * liveBlend;
    point.z = point.z * (1 - liveBlend) + live.z * liveBlend;
  }

  const thermalAmplitude = clamp(settings.temperature * (1 - relaxation * 0.48) * 0.018, 0.001, 0.04);
  const rate = 1.15 + settings.speed * 0.95;
  for (const atom of atoms) {
    const point = placed.get(atom.id);
    if (!point) continue;
    const seed = atomSeed(atom.id);
    const guidedDamping = atom.guided ? 0.64 : 1;
    point.x += Math.sin(time * rate + seed) * thermalAmplitude * guidedDamping;
    point.y += Math.cos(time * (rate * 0.86) + seed * 1.7) * thermalAmplitude * guidedDamping;
    point.z += Math.sin(time * (rate * 1.12) + seed * 2.3) * thermalAmplitude * 0.72 * guidedDamping;
  }

  applySceneRepulsion(placed, atoms, bonds, settings.collisionStrength * (0.045 + (1 - relaxation) * 0.055));
}

function normalizedLivePoints(atoms: AtomParticle[]) {
  const points = new Map<string, Vec3>();
  if (!atoms.length) return points;
  const minX = Math.min(...atoms.map((atom) => atom.x));
  const maxX = Math.max(...atoms.map((atom) => atom.x));
  const minY = Math.min(...atoms.map((atom) => atom.y));
  const maxY = Math.max(...atoms.map((atom) => atom.y));
  const minZ = Math.min(...atoms.map((atom) => atom.z ?? 0));
  const maxZ = Math.max(...atoms.map((atom) => atom.z ?? 0));
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const cz = (minZ + maxZ) / 2;
  const span = Math.max(80, maxX - minX, maxY - minY, (maxZ - minZ) * 1.4);
  const scale = Math.min(0.058, 5.2 / span);
  for (const atom of atoms) {
    points.set(atom.id, {
      x: (atom.x - cx) * scale,
      y: (atom.y - cy) * scale,
      z: ((atom.z ?? 0) - cz) * scale * 0.9
    });
  }
  return points;
}

function applySceneRepulsion(placed: Map<string, Vec3>, atoms: AtomParticle[], bonds: Bond[], strength: number) {
  if (strength <= 0 || atoms.length < 2 || atoms.length > 220) return;
  const bonded = new Set(structuralBonds(bonds).map((bond) => [bond.a, bond.b].sort().join("|")));
  for (let i = 0; i < atoms.length; i += 1) {
    for (let j = i + 1; j < atoms.length; j += 1) {
      const a = atoms[i];
      const b = atoms[j];
      if (bonded.has([a.id, b.id].sort().join("|"))) continue;
      const pa = placed.get(a.id);
      const pb = placed.get(b.id);
      if (!pa || !pb) continue;
      const dx = pb.x - pa.x;
      const dy = pb.y - pa.y;
      const dz = pb.z - pa.z;
      const dist = Math.max(0.001, Math.hypot(dx, dy, dz));
      const minDist = clamp((a.radius + b.radius) / 86 + 0.12, 0.46, 0.82);
      if (dist >= minDist) continue;
      const push = (minDist - dist) * strength;
      const nx = dx / dist;
      const ny = dy / dist;
      const nz = dz / dist;
      pa.x -= nx * push;
      pa.y -= ny * push;
      pa.z -= nz * push;
      pb.x += nx * push;
      pb.y += ny * push;
      pb.z += nz * push;
    }
  }
}

function atomSeed(id: string) {
  let hash = 0;
  for (let index = 0; index < id.length; index += 1) {
    hash = (hash * 31 + id.charCodeAt(index)) % 100000;
  }
  return hash / 100000 * Math.PI * 2;
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

function draw3D(ctx: CanvasRenderingContext2D, atoms: SceneAtom[], sourceAtoms: AtomParticle[], bonds: Bond[], settings: SimulationSettings, camera: Camera3D, width: number, height: number, hoveredAtomId: string | null, hoveredBondId: string | null, longHover: number, time: number, selectedAtomId: string | null) {
  ctx.clearRect(0, 0, width, height);
  draw3DBackground(ctx, settings, width, height);
  const detailLevel = detailLevelFor(settings);
  const interaction = buildInteractionContext(sourceAtoms, bonds, settings, selectedAtomId, hoveredAtomId, hoveredBondId, longHover);
  const projected = applyProjectedEmphasis(projectAtoms(atoms, camera, width, height, settings), interaction, settings);
  const budget = renderBudgetFor(projected);
  const showChemistryDetail = settings.analysisMode === "chemistry" && detailLevel === "detail";
  const showLonePairDetail = budget.overlays && settings.highlightLonePairs && detailLevel !== "abstract";
  const lonePairs = (showLonePairDetail || showChemistryDetail && settings.showElectronRegions) ? projectLonePairs(lonePairClouds(atoms, bonds), camera, width, height, settings) : [];
  const byId = new Map(projected.map((atom) => [atom.id, atom]));
  const visibleBonds = structuralBonds(bonds).filter((bond) => bondVisibleInMode(bond, byId, settings));
  draw3DMoleculeShadow(ctx, atoms, bonds, settings, camera, width, height, budget);
  if (showChemistryDetail && settings.showElectronRegions && budget.overlays) drawElectronRegionOverlay(ctx, projected, bonds, settings);
  if (shouldShowFunctionalGroups(settings, detailLevel)) drawFunctionalGroupHighlights3D(ctx, projected, structuralBonds(bonds), settings, detailLevel);

  for (const bond of [...visibleBonds].sort((a, b) => bondDepth(a, byId) - bondDepth(b, byId))) {
    const a = byId.get(bond.a);
    const b = byId.get(bond.b);
    if (a && b) draw3DBond(ctx, a, b, bond, settings, budget, interaction);
  }
  if (showChemistryDetail && (settings.showBondDipoles || settings.showNetDipole) && budget.overlays) {
    if (settings.showBondDipoles) for (const bond of [...visibleBonds].sort((a, b) => bondDepth(a, byId) - bondDepth(b, byId))) {
      const a = byId.get(bond.a);
      const b = byId.get(bond.b);
      if (a && b) draw3DDipoleIndicator(ctx, a, b, bond, settings, interaction);
    }
    if (settings.showNetDipole) drawNetDipole3D(ctx, projected, visibleBonds, settings);
  }
  drawDepthSortedStructure(ctx, projected, lonePairs, visibleBonds, settings, budget, interaction, time, byId);
  if (showChemistryDetail && settings.visualStyle === "detailed" && budget.detailedEffects) draw3DBondEndpointCaps(ctx, projected, visibleBonds, settings, interaction.focusIds);
  if (showChemistryDetail && settings.showElectronFlow && budget.overlays) drawElectronFlow3D(ctx, projected, visibleBonds, settings, time);
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
    overlays: atoms.length <= 90,
    labels: !veryHeavy
  };
}

function detailLevelFor(settings: SimulationSettings): DetailLevel {
  if (settings.analysisMode === "structure") {
    if (settings.zoom < 0.95) return "abstract";
    if (settings.zoom < 1.45) return "structure";
    return "detail";
  }
  if (settings.zoom < 0.75) return "abstract";
  if (settings.zoom < 1.12) return "structure";
  return "detail";
}

function shouldShowFunctionalGroups(settings: SimulationSettings, detailLevel: DetailLevel) {
  return settings.showFunctionalGroups || settings.analysisMode === "structure" || detailLevel === "abstract";
}

function atomVisibleInMode(atom: ProjectedAtom, settings: SimulationSettings) {
  const detailLevel = detailLevelFor(settings);
  if (settings.displayMode === "skeleton") return false;
  if (settings.displayMode === "simplified" && atom.symbol === "H") return false;
  if (detailLevel === "abstract" && atom.symbol === "H") return false;
  if (settings.analysisMode === "structure" && detailLevel !== "detail" && atom.symbol === "H") return false;
  return true;
}

function shouldShowAtomLabel(atom: ProjectedAtom, settings: SimulationSettings, budget: RenderBudget, focusIds: Set<string> | null) {
  const detailLevel = detailLevelFor(settings);
  if (!settings.showLabels || !budget.labels || settings.displayMode === "skeleton") return false;
  if (settings.analysisMode === "structure" && detailLevel !== "detail") return focusIds?.has(atom.id) || atom.symbol !== "H" && atom.screenRadius > 34;
  if (detailLevel === "abstract") return focusIds?.has(atom.id) || atom.symbol !== "H" && atom.screenRadius > 34;
  if (detailLevel === "structure") return focusIds?.has(atom.id) || atom.symbol !== "H";
  if (focusIds?.has(atom.id)) return true;
  if (settings.displayMode === "simplified" && atom.symbol === "H") return false;
  if (settings.zoom < 0.8) return atom.symbol !== "H" && atom.screenRadius > 24;
  if (settings.zoom < 1.15) return atom.symbol !== "H";
  return true;
}

function bondVisibleInMode(bond: Bond, atoms: Map<string, ProjectedAtom>, settings: SimulationSettings) {
  const detailLevel = detailLevelFor(settings);
  if (settings.displayMode === "skeleton") return true;
  const a = atoms.get(bond.a);
  const b = atoms.get(bond.b);
  if (!a || !b) return false;
  if (detailLevel === "abstract" || settings.analysisMode === "structure" && detailLevel !== "detail") return a.symbol !== "H" && b.symbol !== "H";
  if (settings.displayMode === "full") return true;
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

function buildInteractionContext(atoms: AtomParticle[], bonds: Bond[], settings: SimulationSettings, selectedAtomId: string | null, hoveredAtomId: string | null, hoveredBondId: string | null, longHover: number): InteractionContext {
  const graph = buildMoleculeGraph(atoms, bonds);
  const centralAtomIds = new Set<string>();
  for (const atom of atoms) {
    const degree = graph.neighborsById.get(atom.id)?.length ?? 0;
    const analysis = analyzeAtomGeometry(atom, atoms, bonds);
    if (atom.symbol !== "H" && degree >= 2 && analysis?.bondedAtoms) centralAtomIds.add(atom.id);
  }

  const activeAtomIds = new Set<string>();
  const addAtomAndNeighbors = (id: string | null | undefined) => {
    if (!id) return;
    activeAtomIds.add(id);
    for (const neighbor of graph.neighborsById.get(id) ?? []) activeAtomIds.add(neighbor.id);
  };
  addAtomAndNeighbors(selectedAtomId);
  addAtomAndNeighbors(hoveredAtomId);
  const hoveredBond = hoveredBondId ? structuralBonds(bonds).find((bond) => bond.id === hoveredBondId) : null;
  if (hoveredBond) {
    addAtomAndNeighbors(hoveredBond.a);
    addAtomAndNeighbors(hoveredBond.b);
  }

  const activeBondIds = new Set<string>();
  for (const bond of structuralBonds(bonds)) {
    if (bond.id === hoveredBondId || activeAtomIds.has(bond.a) && activeAtomIds.has(bond.b)) activeBondIds.add(bond.id);
  }

  return {
    selectedAtomId,
    hoveredAtomId,
    hoveredBondId,
    longHover,
    centralAtomIds,
    activeAtomIds,
    activeBondIds,
    focusIds: focusAtomIds(atoms, bonds, settings, selectedAtomId)
  };
}

function applyProjectedEmphasis(atoms: ProjectedAtom[], interaction: InteractionContext, settings: SimulationSettings): ProjectedAtom[] {
  if (settings.displayMode === "skeleton") return atoms;
  return atoms.map((atom) => {
    const scale = emphasisScaleForAtom(atom, interaction);
    if (scale === 1) return atom;
    return {
      ...atom,
      screenRadius: clamp(atom.screenRadius * scale, 10, 92)
    };
  });
}

function emphasisScaleForAtom(atom: ProjectedAtom, interaction: InteractionContext) {
  let scale = 1;
  if (interaction.centralAtomIds.has(atom.id)) scale += atom.symbol === "H" ? 0 : 0.055;
  if (interaction.activeAtomIds.has(atom.id)) scale += 0.035;
  if (interaction.selectedAtomId === atom.id) scale += 0.12;
  if (interaction.hoveredAtomId === atom.id) scale += 0.065 + interaction.longHover * 0.07;
  return scale;
}

function drawDepthSortedStructure(
  ctx: CanvasRenderingContext2D,
  atoms: ProjectedAtom[],
  lonePairs: ProjectedLonePair[],
  bonds: Bond[],
  settings: SimulationSettings,
  budget: RenderBudget,
  interaction: InteractionContext,
  time: number,
  byId: Map<string, ProjectedAtom>
) {
  const visibleAtoms = atoms.filter((atom) => atomVisibleInMode(atom, settings));
  const atomIds = new Set(visibleAtoms.map((atom) => atom.id));
  const items = [
    ...visibleAtoms.map((atom) => ({ kind: "atom" as const, id: atom.id, depth: atomPaintDepth(atom, atoms, bonds), atom })),
    ...lonePairs
      .filter((cloud) => atomIds.has(cloud.centerId))
      .map((cloud) => ({ kind: "lonePair" as const, id: cloud.id, depth: lonePairPaintDepth(cloud, byId.get(cloud.centerId)), cloud }))
  ].sort((a, b) => a.depth - b.depth);

  for (const item of items) {
    if (item.kind === "atom") {
      draw3DAtom(ctx, item.atom, settings, budget, interaction);
      continue;
    }
    const center = byId.get(item.cloud.centerId);
    if (center) drawLonePairCloud(ctx, item.cloud, center, settings, time);
  }
}

function lonePairPaintDepth(cloud: ProjectedLonePair, center: ProjectedAtom | undefined) {
  const ownSurface = cloud.depth + cloud.screenRadius * 0.034;
  if (!center) return ownSurface;
  const outwardDepth = cloud.depth - center.depth;
  return ownSurface + clamp(outwardDepth, -0.5, 0.5) * 1.4;
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
    if ((componentSize.get(atom.id) ?? atoms.length) > 80) continue;
    const neighbors = graph.neighborsById.get(atom.id) ?? [];
    const vectors = lonePairDirectionsFor(atom, neighbors as SceneAtom[], analysis.lonePairs);
    vectors.forEach((vector, index) => {
      const direction = normalizeVec(vector);
      const offset = 0.46 + Math.min(0.16, atom.radius / 190);
      clouds.push({
        id: `lp-${atom.id}-${index}`,
        centerId: atom.id,
        direction,
        x: atom.x + direction.x * offset,
        y: atom.y + direction.y * offset,
        z: atom.z + direction.z * offset,
        radius: Math.max(15, atom.radius * 0.5)
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

function lonePairDirectionsFor(atom: SceneAtom, neighbors: SceneAtom[], lonePairs: number): Vec3[] {
  if (lonePairs <= 0) return [];
  const bondSum = neighbors.reduce((sum, neighbor) => {
    const vector = normalizeVec({ x: neighbor.x - atom.x, y: neighbor.y - atom.y, z: neighbor.z - atom.z });
    return { x: sum.x + vector.x, y: sum.y + vector.y, z: sum.z + vector.z };
  }, { x: 0, y: 0, z: 0 });
  const fallback = atom.symbol === "O" || atom.symbol === "S" ? { x: 0, y: -0.82, z: 0.58 } : { x: 0, y: -0.35, z: 0.94 };
  const away = Math.hypot(bondSum.x, bondSum.y, bondSum.z) > 0.02
    ? normalizeVec({ x: -bondSum.x, y: -bondSum.y, z: -bondSum.z })
    : normalizeVec(fallback);
  const side = perpendicularTo(away);

  if (lonePairs === 1) return [away];
  if (lonePairs === 2) {
    return [
      normalizeVec({ x: away.x * 0.82 + side.x * 0.56, y: away.y * 0.82 + side.y * 0.56, z: away.z * 0.82 + side.z * 0.56 }),
      normalizeVec({ x: away.x * 0.82 - side.x * 0.56, y: away.y * 0.82 - side.y * 0.56, z: away.z * 0.82 - side.z * 0.56 })
    ];
  }

  return Array.from({ length: lonePairs }, (_, index) => {
    const angle = index * Math.PI * 2 / lonePairs;
    const spread = Math.cos(angle) * 0.58;
    const lift = Math.sin(angle) * 0.42;
    return normalizeVec({
      x: away.x * 0.74 + side.x * spread,
      y: away.y * 0.74 + side.y * spread,
      z: away.z * 0.74 + lift
    });
  });
}

function perpendicularTo(vector: Vec3): Vec3 {
  const primary = Math.abs(vector.z) < 0.78 ? { x: 0, y: 0, z: 1 } : { x: 0, y: 1, z: 0 };
  const cross = {
    x: vector.y * primary.z - vector.z * primary.y,
    y: vector.z * primary.x - vector.x * primary.z,
    z: vector.x * primary.y - vector.y * primary.x
  };
  return normalizeVec(cross);
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
  const intensity = clamp(settings.lightIntensity, 0.25, 1.8);
  const shadowColor = settings.theme === "light"
    ? `rgba(15,23,42,${clamp(0.09 + intensity * 0.055, 0.1, 0.19)})`
    : `rgba(0,0,0,${clamp(0.22 + intensity * 0.12, 0.26, 0.46)})`;
  if (shadowAtoms.length > 34) {
    drawAggregateMoleculeShadow(ctx, shadowAtoms, settings, budget);
    return;
  }
  ctx.save();
  ctx.filter = budget.detailedEffects ? "blur(1.2px)" : "none";
  ctx.globalAlpha = budget.detailedEffects ? clamp(0.32 + intensity * 0.14, 0.36, 0.58) : clamp(0.26 + intensity * 0.1, 0.3, 0.44);
  ctx.lineCap = "butt";
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
  const intensity = clamp(settings.lightIntensity, 0.25, 1.8);
  const core = settings.theme === "light"
    ? `rgba(15,23,42,${clamp(0.1 + intensity * 0.055, 0.11, 0.2)})`
    : `rgba(0,0,0,${clamp(0.22 + intensity * 0.12, 0.26, 0.46)})`;
  const edge = settings.theme === "light" ? "rgba(15,23,42,0)" : "rgba(0,0,0,0)";
  const gradient = ctx.createRadialGradient(cx, cy, 2, cx, cy, Math.max(rx, ry));
  gradient.addColorStop(0, core);
  gradient.addColorStop(0.45, settings.theme === "light" ? `rgba(15,23,42,${clamp(0.04 + intensity * 0.03, 0.05, 0.09)})` : `rgba(0,0,0,${clamp(0.1 + intensity * 0.06, 0.12, 0.2)})`);
  gradient.addColorStop(1, edge);

  ctx.save();
  ctx.filter = budget.detailedEffects ? "blur(1.4px)" : "none";
  ctx.fillStyle = gradient;
  ctx.globalAlpha = budget.detailedEffects ? clamp(0.38 + intensity * 0.16, 0.42, 0.66) : clamp(0.28 + intensity * 0.1, 0.32, 0.46);
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();

  const stride = Math.max(2, Math.ceil(atoms.length / 46));
  ctx.fillStyle = settings.theme === "light" ? `rgba(15,23,42,${clamp(0.04 + intensity * 0.025, 0.05, 0.085)})` : `rgba(0,0,0,${clamp(0.12 + intensity * 0.055, 0.14, 0.22)})`;
  ctx.globalAlpha = budget.detailedEffects ? clamp(0.2 + intensity * 0.11, 0.22, 0.38) : clamp(0.16 + intensity * 0.06, 0.18, 0.26);
  atoms.forEach((atom, index) => {
    if (index % stride !== 0) return;
    ctx.beginPath();
    ctx.ellipse(atom.sx, atom.sy, atom.screenRadius * 0.22, Math.max(1.6, atom.screenRadius * 0.05), 0, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}

function drawLonePairCloud(ctx: CanvasRenderingContext2D, cloud: ProjectedLonePair, center: ProjectedAtom, settings: SimulationSettings, time: number) {
  const r = clamp(cloud.screenRadius, 12, 27);
  const dx = cloud.sx - center.sx;
  const dy = cloud.sy - center.sy;
  const length = Math.max(0.01, Math.hypot(dx, dy));
  const ux = dx / length;
  const uy = dy / length;
  const px = -uy;
  const py = ux;
  const tipX = center.sx + ux * center.screenRadius * 0.78;
  const tipY = center.sy + uy * center.screenRadius * 0.78;
  const lobeLength = r * 1.12;
  const lobeWidth = r * 1.12;
  const neckWidth = r * 0.42;
  const bulbX = tipX + ux * lobeLength;
  const bulbY = tipY + uy * lobeLength;
  const baseX = tipX + ux * lobeLength * 0.42;
  const baseY = tipY + uy * lobeLength * 0.42;
  const alpha = clamp(0.58 + (cloud.depth + 2.4) * 0.11, 0.44, 0.88);
  const bodyOuter = settings.theme === "light" ? "#c8b7f2" : "#b6a3f4";
  const bodyInner = settings.theme === "light" ? "#efe9ff" : "#ddd3ff";
  const bodyEdge = settings.theme === "light" ? "#9f8bd8" : "#c4b5fd";
  const gradient = ctx.createRadialGradient(bulbX - ux * r * 0.34 - px * r * 0.18, bulbY - uy * r * 0.34 - py * r * 0.18, 1, bulbX, bulbY, r * 1.42);
  gradient.addColorStop(0, hexToRgba("#ffffff", 0.78));
  gradient.addColorStop(0.26, hexToRgba(bodyInner, 0.84));
  gradient.addColorStop(0.72, hexToRgba(bodyOuter, 0.78));
  gradient.addColorStop(1, hexToRgba(bodyEdge, 0.44));

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.shadowColor = settings.theme === "light" ? "rgba(124,58,237,0.22)" : "rgba(196,181,253,0.28)";
  ctx.shadowBlur = 5;
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.moveTo(tipX, tipY);
  ctx.bezierCurveTo(
    baseX + px * neckWidth,
    baseY + py * neckWidth,
    bulbX + px * lobeWidth,
    bulbY + py * lobeWidth,
    bulbX + ux * r * 0.04,
    bulbY + uy * r * 0.04
  );
  ctx.bezierCurveTo(
    bulbX - px * lobeWidth,
    bulbY - py * lobeWidth,
    baseX - px * neckWidth,
    baseY - py * neckWidth,
    tipX,
    tipY
  );
  ctx.closePath();
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.strokeStyle = hexToRgba(bodyEdge, settings.theme === "light" ? 0.46 : 0.56);
  ctx.lineWidth = 1.25;
  ctx.stroke();

  ctx.globalAlpha = alpha * 0.42;
  ctx.strokeStyle = "rgba(255,255,255,0.75)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(baseX + px * r * 0.2, baseY + py * r * 0.2);
  ctx.quadraticCurveTo(bulbX - ux * r * 0.08 + px * r * 0.46, bulbY - uy * r * 0.08 + py * r * 0.46, bulbX + px * r * 0.5, bulbY + py * r * 0.5);
  ctx.stroke();

  const seed = atomSeed(cloud.id);
  const phase = (time * 0.82 + seed) % 1;
  const blink = phase > 0.84 ? Math.max(0.08, Math.abs(phase - 0.92) / 0.08) : 1;
  const eyeCenterX = tipX + ux * lobeLength * 0.7;
  const eyeCenterY = tipY + uy * lobeLength * 0.7;
  const eyeGap = lobeWidth * 0.48;
  const eyeRadius = clamp(r * 0.15, 2.4, 4.4);
  drawBlinkingElectron(ctx, eyeCenterX + px * eyeGap * 0.5, eyeCenterY + py * eyeGap * 0.5, eyeRadius, blink, alpha);
  drawBlinkingElectron(ctx, eyeCenterX - px * eyeGap * 0.5, eyeCenterY - py * eyeGap * 0.5, eyeRadius, blink, alpha);
  ctx.restore();
}

function drawBlinkingElectron(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, blink: number, alpha: number) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = "#111827";
  if (blink > 0.22) {
    ctx.beginPath();
    ctx.ellipse(x, y, radius, radius * blink, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = alpha * 0.42;
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.beginPath();
    ctx.arc(x - radius * 0.28, y - radius * 0.32, Math.max(0.7, radius * 0.28), 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.strokeStyle = "#111827";
    ctx.lineWidth = Math.max(1.4, radius * 0.48);
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x - radius * 0.72, y);
    ctx.lineTo(x + radius * 0.72, y);
    ctx.stroke();
  }
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

function drawFunctionalGroupHighlights3D(ctx: CanvasRenderingContext2D, atoms: ProjectedAtom[], bonds: Bond[], settings: SimulationSettings, detailLevel: DetailLevel) {
  if (!atoms.length || settings.displayMode === "skeleton") return;
  const byId = new Map(atoms.map((atom) => [atom.id, atom]));
  const groups = detectFunctionalGroups(atoms, bonds);
  if (!groups.length) return;

  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (const group of groups) {
    const pts = group.atomIds.map((id) => byId.get(id)).filter((atom): atom is ProjectedAtom => Boolean(atom));
    if (!pts.length) continue;
    const cx = pts.reduce((sum, atom) => sum + atom.sx, 0) / pts.length;
    const cy = pts.reduce((sum, atom) => sum + atom.sy, 0) / pts.length;
    const radius = clamp(Math.max(...pts.map((atom) => Math.hypot(atom.sx - cx, atom.sy - cy) + atom.screenRadius * 0.86)), detailLevel === "abstract" ? 34 : 26, group.kind === "aromatic" ? 138 : 96);
    const isAbstraction = detailLevel === "abstract" || settings.analysisMode === "structure";
    ctx.globalAlpha = settings.theme === "light" ? isAbstraction ? 0.2 : 0.14 : isAbstraction ? 0.26 : 0.2;
    ctx.fillStyle = group.color;
    ctx.beginPath();
    ctx.ellipse(cx, cy, radius * (group.kind === "aromatic" ? 1.16 : 1.08), radius * (group.kind === "aromatic" ? 0.82 : 0.72), -0.28, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = settings.theme === "light" ? isAbstraction ? 0.62 : 0.42 : isAbstraction ? 0.7 : 0.52;
    ctx.strokeStyle = group.color;
    ctx.lineWidth = isAbstraction ? 2.2 : 1.5;
    ctx.setLineDash(group.kind === "aromatic" ? [3, 4] : [6, 6]);
    ctx.stroke();
    ctx.setLineDash([]);
    if (settings.zoom >= 0.7 || isAbstraction) {
      ctx.globalAlpha = settings.theme === "light" ? 0.86 : 0.92;
      ctx.fillStyle = group.color;
      ctx.font = `${isAbstraction ? 900 : 800} ${isAbstraction ? 12 : 11}px Inter, system-ui`;
      ctx.lineJoin = "round";
      ctx.strokeStyle = settings.theme === "light" ? "rgba(248,251,255,0.86)" : "rgba(2,6,23,0.72)";
      ctx.lineWidth = 4;
      ctx.strokeText(group.label, cx, cy - radius * 0.82);
      ctx.fillText(group.label, cx, cy - radius * 0.82);
    }
  }
  ctx.restore();
}

function draw3DBond(ctx: CanvasRenderingContext2D, a: ProjectedAtom, b: ProjectedAtom, bond: Bond, settings: SimulationSettings, budget: RenderBudget, interaction: InteractionContext) {
  const colors = settings.theme === "light" ? { covalent: "#465569", polar: "#2563eb", ionic: "#c2410c" } : { covalent: "#d8e1df", polar: "#38bdf8", ionic: "#f59e0b" };
  const color = bond.kind === "ionic" ? colors.ionic : bond.kind === "polar-covalent" ? colors.polar : colors.covalent;
  const segment = visibleBondSegment(a, b);
  if (!segment) return;
  const intensity = clamp(settings.lightIntensity, 0.25, 1.8);
  const lightPower = clamp((intensity - 0.25) / 1.55, 0, 1);
  const highlight = interaction.hoveredBondId === bond.id ? 1 : interaction.activeBondIds.has(bond.id) ? 0.58 : 0;
  const offsets = bond.order === 1 ? [0] : bond.order === 2 ? [-4, 4] : [-6, 0, 6];
  const depthAlpha = clamp(0.46 + ((a.depth + b.depth) / 2 + 2.8) * 0.15, 0.32, 1);
  const avgDepth = (a.depth + b.depth) / 2;
  const lineWidth = clamp((a.screenRadius + b.screenRadius) * 0.075 * (1 + avgDepth * 0.08 + lightPower * 0.08) * (1 + highlight * 0.2), 2.6, 12.4);
  const shadeColor = settings.theme === "light" ? `rgba(15,23,42,${0.22 + lightPower * 0.18})` : `rgba(0,0,0,${0.44 + lightPower * 0.2})`;
  const highlightTint = mixHex(settings.lightColor, "#ffffff", 0.18);
  const highlightColor = hexToRgba(highlightTint, settings.theme === "light" ? 0.45 + lightPower * 0.3 : 0.34 + lightPower * 0.26);
  const light = lightScreen(settings);
  const nearer = a.depth >= b.depth ? a : b;
  const nearT = nearer.id === b.id ? 1 : 0;
  const focusAlpha = interaction.focusIds && !interaction.focusIds.has(a.id) && !interaction.focusIds.has(b.id) ? 0.13 : 1;

  ctx.save();
  ctx.lineCap = "butt";
  ctx.shadowColor = mixHex(color, settings.lightColor, lightPower * 0.28);
  ctx.shadowBlur = settings.visualStyle === "detailed" && budget.detailedEffects ? 3 + lightPower * 11 + highlight * 10 : 0;
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

    if (highlight > 0) {
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.strokeStyle = settings.theme === "light" ? "rgba(20,184,166,0.5)" : "rgba(94,234,212,0.48)";
      ctx.globalAlpha = highlight * focusAlpha;
      ctx.lineWidth = lineWidth + 8;
      ctx.lineCap = "round";
      ctx.stroke();
      ctx.lineCap = "butt";
    }

    ctx.beginPath();
    ctx.moveTo(startX + tubeShadowX, startY + tubeShadowY);
    ctx.lineTo(endX + tubeShadowX, endY + tubeShadowY);
    ctx.strokeStyle = shadeColor;
    ctx.globalAlpha = depthAlpha * clamp(0.26 + lightPower * 0.34, 0.28, 0.7) * focusAlpha;
    ctx.lineWidth = lineWidth + 2.4;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.strokeStyle = color;
    ctx.globalAlpha = clamp(depthAlpha + highlight * 0.2, 0.36, 1) * focusAlpha;
    ctx.lineWidth = lineWidth;
    ctx.stroke();

    if (budget.detailedEffects) {
      ctx.beginPath();
      ctx.moveTo(nearX + tubeLightX, nearY + tubeLightY);
      ctx.lineTo(midX + tubeLightX, midY + tubeLightY);
      ctx.strokeStyle = highlightColor;
      ctx.globalAlpha = clamp(depthAlpha * (0.36 + lightPower * 0.5), 0.3, 1) * focusAlpha;
      ctx.lineCap = "round";
      ctx.lineWidth = Math.max(1.1, lineWidth * 0.32);
      ctx.stroke();
      ctx.lineCap = "butt";
    }
  }
  ctx.restore();
}

function draw3DBondEndpointCaps(ctx: CanvasRenderingContext2D, atoms: ProjectedAtom[], bonds: Bond[], settings: SimulationSettings, focusIds: Set<string> | null) {
  if (settings.displayMode === "skeleton" || settings.zoom < 0.72) return;
  const byId = new Map(atoms.map((atom) => [atom.id, atom]));
  const colors = settings.theme === "light" ? { covalent: "#64748b", polar: "#2563eb", ionic: "#c2410c" } : { covalent: "#d8e1df", polar: "#38bdf8", ionic: "#f59e0b" };

  ctx.save();
  for (const bond of [...bonds].sort((a, b) => bondDepth(a, byId) - bondDepth(b, byId))) {
    const a = byId.get(bond.a);
    const b = byId.get(bond.b);
    if (!a || !b) continue;
    const color = bond.kind === "ionic" ? colors.ionic : bond.kind === "polar-covalent" ? colors.polar : colors.covalent;
    drawEndpointCap(ctx, atoms, a, b, bond, color, settings, focusIds);
    drawEndpointCap(ctx, atoms, b, a, bond, color, settings, focusIds);
  }
  ctx.restore();
}

function drawEndpointCap(ctx: CanvasRenderingContext2D, atoms: ProjectedAtom[], atom: ProjectedAtom, other: ProjectedAtom, bond: Bond, color: string, settings: SimulationSettings, focusIds: Set<string> | null) {
  if (settings.displayMode === "simplified" && atom.symbol === "H") return;
  const focusAlpha = focusIds && !focusIds.has(atom.id) ? 0.18 : 1;
  const dx = other.sx - atom.sx;
  const dy = other.sy - atom.sy;
  const length = Math.max(0.01, Math.hypot(dx, dy));
  const ux = dx / length;
  const uy = dy / length;
  const px = -uy;
  const py = ux;
  const lanes = bond.order === 1 ? [0] : bond.order === 2 ? [-1, 1] : [-1.45, 0, 1.45];
  const laneGap = clamp((atom.screenRadius + other.screenRadius) * 0.018, 1.6, 4.6);
  const capAlpha = clamp(0.5 + (atom.depth + 2.4) * 0.12, 0.34, 0.86) * focusAlpha;
  const capRotation = Math.atan2(py, px);
  const atomColor = atomData[atom.symbol].color;

  for (const lane of lanes) {
    const laneOffset = lane * laneGap;
    const x = atom.sx + ux * atom.screenRadius * 0.9 + px * laneOffset;
    const y = atom.sy + uy * atom.screenRadius * 0.9 + py * laneOffset;
    if (!endpointCapIsVisible(atom, other, atoms, x, y)) continue;

    const wide = clamp(atom.screenRadius * 0.13 / Math.sqrt(lanes.length), 4.2, 9.5);
    const tall = clamp(atom.screenRadius * 0.052, 2.1, 4.8);
    const rim = ctx.createRadialGradient(x - ux * wide * 0.55 - px * wide * 0.18, y - uy * wide * 0.55 - py * wide * 0.18, 1, x, y, wide * 1.35);
    rim.addColorStop(0, settings.theme === "light" ? "rgba(255,255,255,0.92)" : "rgba(226,232,240,0.5)");
    rim.addColorStop(0.5, mixHex(atomColor, "#ffffff", settings.theme === "light" ? 0.42 : 0.24));
    rim.addColorStop(1, settings.theme === "light" ? "rgba(15,23,42,0.12)" : "rgba(0,0,0,0.32)");

    ctx.globalAlpha = capAlpha * 0.9;
    ctx.fillStyle = rim;
    ctx.beginPath();
    ctx.ellipse(x, y, wide + 1.4, tall + 1.2, capRotation, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = Math.min(0.96, capAlpha + 0.08);
    ctx.strokeStyle = color;
    ctx.lineWidth = clamp(wide * 0.18, 1.1, 1.8);
    ctx.beginPath();
    ctx.ellipse(x, y, wide, tall, capRotation, 0, Math.PI * 2);
    ctx.stroke();

    ctx.globalAlpha = capAlpha * 0.32;
    ctx.strokeStyle = settings.theme === "light" ? "rgba(255,255,255,0.82)" : "rgba(255,255,255,0.34)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(x - ux * wide * 0.18, y - uy * wide * 0.18, wide * 0.55, Math.max(1, tall * 0.42), capRotation, Math.PI * 1.05, Math.PI * 1.85);
    ctx.stroke();
  }
}

function endpointCapIsVisible(endpoint: ProjectedAtom, other: ProjectedAtom, atoms: ProjectedAtom[], x: number, y: number) {
  if (other.depth < endpoint.depth - 1.1) return false;
  const overlap = endpoint.screenRadius + other.screenRadius - Math.hypot(endpoint.sx - other.sx, endpoint.sy - other.sy);
  if (overlap > endpoint.screenRadius * 0.48 && other.depth < endpoint.depth + 0.08) return false;
  for (const atom of atoms) {
    if (atom.id === endpoint.id) continue;
    const coversCap = Math.hypot(x - atom.sx, y - atom.sy) < atom.screenRadius * 0.92;
    if (!coversCap) continue;
    const visuallyInFront = atom.depth >= endpoint.depth - 0.22 || atom.screenRadius > endpoint.screenRadius * 0.72;
    if (visuallyInFront) return false;
  }
  return true;
}

function draw3DDipoleIndicator(ctx: CanvasRenderingContext2D, a: ProjectedAtom, b: ProjectedAtom, bond: Bond, settings: SimulationSettings, interaction: InteractionContext) {
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
  const active = interaction.activeBondIds.has(bond.id) || interaction.hoveredBondId === bond.id;
  const lineWidth = clamp(1.2 + strength * 1.15 + (active ? 1.2 : 0), 1.4, 4.9);
  const alpha = clamp(0.32 + strength * 0.34 + (active ? 0.18 : 0), 0.38, 1);

  ctx.save();
  if (active) {
    ctx.shadowColor = settings.theme === "light" ? "#2563eb" : "#38bdf8";
    ctx.shadowBlur = 9;
  }
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
    const directionX = target.sx - source.sx;
    const directionY = target.sy - source.sy;
    const directionLength = Math.max(0.01, Math.hypot(directionX, directionY));
    const dx = directionX / directionLength;
    const dy = directionY / directionLength;
    drawChargeLabel3D(
      ctx,
      "δ-",
      target.sx + dx * (target.screenRadius + 12) + segment.px * 9,
      target.sy + dy * (target.screenRadius + 12) + segment.py * 9,
      settings.theme === "light" ? "#2563eb" : "#38bdf8",
      settings
    );
    drawChargeLabel3D(
      ctx,
      "δ+",
      source.sx - dx * (source.screenRadius + 12) - segment.px * 9,
      source.sy - dy * (source.screenRadius + 12) - segment.py * 9,
      settings.theme === "light" ? "#dc2626" : "#fb7185",
      settings
    );
  }
  ctx.restore();
}

function drawChargeLabel3D(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color: string, settings: SimulationSettings) {
  ctx.save();
  ctx.font = "800 12px Inter, system-ui";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineJoin = "round";
  ctx.strokeStyle = settings.theme === "light" ? "rgba(248,251,255,0.9)" : "rgba(10,12,12,0.72)";
  ctx.lineWidth = 4;
  ctx.strokeText(text, x, y);
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
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
  const cx = atoms.reduce((sum, atom) => sum + atom.sx, 0) / atoms.length;
  const cy = atoms.reduce((sum, atom) => sum + atom.sy, 0) / atoms.length;
  const ux = net.x / magnitude;
  const uy = net.y / magnitude;
  const strength = magnitude / Math.max(1, bonds.length);
  const length = clamp(30 + strength * 4.6, 48, 132);
  const width = clamp(5.4 + strength * 0.08, 5.8, 10.5);
  const startOffset = clamp(9 + length * 0.07, 12, 20);
  const startX = cx + ux * startOffset;
  const startY = cy + uy * startOffset;
  drawArrow(ctx, startX, startY, startX + ux * length, startY + uy * length, settings.theme === "light" ? "#0f766e" : "#5eead4", width, "μ", clamp(strength / 40, 0.35, 1));
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
  const nominalStartInset = a.screenRadius * 0.74;
  const nominalEndInset = b.screenRadius * 0.74;
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

function draw3DAtom(ctx: CanvasRenderingContext2D, atom: ProjectedAtom, settings: SimulationSettings, budget: RenderBudget, interaction: InteractionContext, overlayPass = false) {
  const data = atomData[atom.symbol];
  const r = atom.screenRadius;
  const light = lightScreen(settings);
  const intensity = clamp(settings.lightIntensity, 0.25, 1.8);
  const selected = interaction.selectedAtomId === atom.id;
  const hovered = interaction.hoveredAtomId === atom.id;
  const central = interaction.centralAtomIds.has(atom.id);
  const active = interaction.activeAtomIds.has(atom.id);
  const muted = interaction.focusIds && !interaction.focusIds.has(atom.id);
  const emphasis = (selected ? 1 : 0) + (hovered ? 0.82 + interaction.longHover * 0.55 : 0) + (central ? 0.4 : 0) + (active ? 0.28 : 0);
  const lightX = atom.sx + r * light.x;
  const lightY = atom.sy + r * light.y;
  const lightPower = clamp((intensity - 0.25) / 1.55, 0, 1);
  const lightTint = clamp(0.18 + lightPower * 0.34, 0.18, 0.52);
  const materialLift = settings.theme === "light" ? clamp(0.06 + (1 - lightPower) * 0.06, 0.06, 0.12) : clamp(0.04 + lightPower * 0.08, 0.04, 0.12);
  const litColor = mixHex(data.color, settings.lightColor, lightTint);
  const midColor = mixHex(data.color, settings.theme === "light" ? "#f8fafc" : "#dbeafe", materialLift);
  const rimColor = mixHex(data.color, settings.theme === "light" ? "#0f172a" : "#020617", clamp(0.2 + lightPower * 0.28, 0.2, 0.48));
  const gradient = ctx.createRadialGradient(lightX, lightY, Math.max(3, r * 0.18), atom.sx + r * 0.12, atom.sy + r * 0.16, r * 1.14);
  gradient.addColorStop(0, mixHex(settings.lightColor, "#ffffff", clamp(0.34 + lightPower * 0.42, 0.34, 0.78)));
  gradient.addColorStop(0.16, litColor);
  gradient.addColorStop(0.56, midColor);
  gradient.addColorStop(0.84, mixHex(data.color, rimColor, 0.34));
  gradient.addColorStop(1, rimColor);

  ctx.save();
  const focusAlpha = muted ? 0.14 : 1;
  const depthAlpha = clamp(0.58 + (atom.depth + 2.8) * 0.13, 0.38, 1) * focusAlpha;
  ctx.globalAlpha = depthAlpha;
  ctx.filter = "none";
  ctx.shadowBlur = 0;
  if (!overlayPass && settings.visualStyle === "detailed" && budget.detailedEffects) {
    drawAtomRadialGlow(ctx, atom, data.glow, settings, depthAlpha, emphasis, intensity);
    ctx.globalAlpha = depthAlpha;
  }
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(atom.sx, atom.sy, r, 0, Math.PI * 2);
  ctx.fill();
  if (settings.visualStyle === "detailed" && budget.detailedEffects) {
    const shade = ctx.createLinearGradient(atom.sx + light.x * r * 0.9, atom.sy + light.y * r * 0.9, atom.sx - light.x * r * 0.95, atom.sy - light.y * r * 0.95);
    shade.addColorStop(0, "rgba(255,255,255,0)");
    shade.addColorStop(0.48, "rgba(255,255,255,0)");
    shade.addColorStop(1, settings.theme === "light" ? `rgba(15,23,42,${clamp(0.1 + lightPower * 0.2, 0.1, 0.3)})` : `rgba(0,0,0,${clamp(0.22 + lightPower * 0.28, 0.22, 0.5)})`);
    ctx.fillStyle = shade;
    ctx.beginPath();
    ctx.arc(atom.sx, atom.sy, r, 0, Math.PI * 2);
    ctx.fill();

    const rim = ctx.createRadialGradient(atom.sx - light.x * r * 0.55, atom.sy - light.y * r * 0.55, r * 0.3, atom.sx, atom.sy, r * 1.08);
    rim.addColorStop(0, "rgba(255,255,255,0)");
    rim.addColorStop(0.72, "rgba(255,255,255,0)");
    rim.addColorStop(1, hexToRgba(settings.lightColor, settings.theme === "light" ? 0.08 + lightPower * 0.16 : 0.12 + lightPower * 0.22));
    ctx.fillStyle = rim;
    ctx.beginPath();
    ctx.arc(atom.sx, atom.sy, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = clamp(0.18 + lightPower * 0.44, 0.18, 0.62) * depthAlpha;
    ctx.fillStyle = hexToRgba(mixHex(settings.lightColor, "#ffffff", 0.18), settings.theme === "light" ? 0.82 : 0.64);
    ctx.beginPath();
    ctx.arc(lightX, lightY, clamp(r * (0.085 + lightPower * 0.035), 2.8, 9.5), 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = depthAlpha;
  }
  ctx.shadowBlur = 0;
  ctx.filter = "none";
  ctx.strokeStyle = settings.theme === "light" ? "rgba(24,34,30,0.2)" : "rgba(255,255,255,0.24)";
  ctx.lineWidth = 1.4;
  ctx.stroke();
  if (!overlayPass && (selected || hovered || central || active)) {
    drawAtomEmphasisRing(ctx, atom, settings, { selected, hovered, central, active, muted });
  }
  ctx.fillStyle = settings.theme === "light" ? "#17211d" : "#f8fafc";
  ctx.font = `800 ${Math.max(12, r * 0.56)}px Inter, system-ui`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  if (settings.displayMode !== "skeleton") ctx.fillText(atom.symbol, atom.sx, atom.sy);
  if (!overlayPass && shouldShowAtomLabel(atom, settings, budget, interaction.focusIds)) {
    ctx.font = "700 11px Inter, system-ui";
    ctx.fillStyle = settings.theme === "light" ? "rgba(24,38,34,0.72)" : "rgba(241,245,249,0.72)";
    ctx.fillText(data.name, atom.sx, atom.sy + r + 16);
  }
  ctx.restore();
}

function drawAtomRadialGlow(ctx: CanvasRenderingContext2D, atom: ProjectedAtom, glow: string, settings: SimulationSettings, alpha: number, emphasis: number, intensity: number) {
  const r = atom.screenRadius;
  const lightPower = clamp((intensity - 0.25) / 1.55, 0, 1);
  const glowColor = mixHex(glow, settings.lightColor, clamp(0.12 + lightPower * 0.22, 0.12, 0.34));
  const glowRadius = r * clamp(1.28 + emphasis * 0.18 + lightPower * 0.2, 1.34, 1.9);
  const gradient = ctx.createRadialGradient(atom.sx, atom.sy, r * 0.68, atom.sx, atom.sy, glowRadius);
  gradient.addColorStop(0, hexToRgba(glowColor, (0.09 + lightPower * 0.05) * alpha));
  gradient.addColorStop(0.48, hexToRgba(glowColor, (0.04 + emphasis * 0.055 + lightPower * 0.052) * alpha));
  gradient.addColorStop(1, hexToRgba(glowColor, 0));
  ctx.save();
  ctx.globalAlpha = 1;
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(atom.sx, atom.sy, glowRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  if (emphasis <= 0.1) return;
  const auraColor = settings.theme === "light" ? "#14b8a6" : "#5eead4";
  const aura = ctx.createRadialGradient(atom.sx, atom.sy, r * 0.84, atom.sx, atom.sy, r * (1.42 + emphasis * 0.08));
  aura.addColorStop(0, hexToRgba(auraColor, 0));
  aura.addColorStop(0.62, hexToRgba(auraColor, clamp(0.035 + emphasis * 0.035, 0.04, 0.14) * alpha));
  aura.addColorStop(1, hexToRgba(auraColor, 0));
  ctx.save();
  ctx.globalAlpha = 1;
  ctx.fillStyle = aura;
  ctx.beginPath();
  ctx.arc(atom.sx, atom.sy, r * (1.46 + emphasis * 0.08), 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawAtomEmphasisRing(ctx: CanvasRenderingContext2D, atom: ProjectedAtom, settings: SimulationSettings, state: { selected: boolean; hovered: boolean; central: boolean; active: boolean; muted: boolean | null }) {
  if (state.muted) return;
  const color = state.selected
    ? "#facc15"
    : state.hovered
      ? "#14b8a6"
      : state.central
        ? "#0f766e"
        : settings.theme === "light" ? "#2dd4bf" : "#5eead4";
  const alpha = state.selected ? 0.72 : state.hovered ? 0.6 : state.central ? 0.42 : 0.26;
  const lineWidth = state.selected ? 2.5 : state.hovered ? 2.1 : state.central ? 1.45 : 1.1;
  ctx.save();
  ctx.strokeStyle = hexToRgba(color, alpha);
  ctx.lineWidth = lineWidth;
  ctx.setLineDash(state.central && !state.selected && !state.hovered ? [4, 5] : []);
  ctx.beginPath();
  ctx.arc(atom.sx, atom.sy, atom.screenRadius + (state.selected ? 4.5 : 3), 0, Math.PI * 2);
  ctx.stroke();
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

function drawArrow(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string, width: number, label?: string, strength = 0.55) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.max(0.01, Math.hypot(dx, dy));
  const ux = dx / length;
  const uy = dy / length;
  const px = -uy;
  const py = ux;
  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = 8 + strength * 14;
  ctx.globalAlpha = 0.2 + strength * 0.24;
  ctx.strokeStyle = color;
  ctx.lineWidth = width + 7;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2 - ux * 10, y2 - uy * 10);
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
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
    ctx.font = "900 14px Inter, system-ui";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const labelX = x2 + px * 13 - ux * 3;
    const labelY = y2 + py * 13 - uy * 3;
    ctx.lineJoin = "round";
    ctx.strokeStyle = "rgba(247, 253, 250, 0.88)";
    ctx.lineWidth = 4;
    ctx.strokeText(label, labelX, labelY);
    ctx.fillText(label, labelX, labelY);
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
