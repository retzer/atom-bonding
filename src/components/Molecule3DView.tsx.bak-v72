import { useEffect, useMemo, useRef, useState, type MutableRefObject, type PointerEvent } from "react";
import { Box, Crosshair, Maximize2, Minimize2, ZoomIn, ZoomOut } from "lucide-react";
import { atomData } from "../data/atoms";
import type { AtomParticle, Bond, GraphicsQuality, ProjectionMode, SimulationSettings, SimulationState } from "../types";
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
type Camera3D = { yaw: number; pitch: number; panX: number; panY: number; fitZoom: number };
type SceneAtom = AtomParticle & Vec3;
type ProjectedAtom = SceneAtom & { sx: number; sy: number; depth: number; screenRadius: number; paintDepth: number; surfaceDepth: number; sceneSize: number };
type LonePairCloud = Vec3 & { id: string; centerId: string; radius: number; direction: Vec3 };
type ProjectedLonePair = LonePairCloud & { sx: number; sy: number; depth: number; screenRadius: number };
type RenderBudget = { detailedEffects: boolean; overlays: boolean; labels: boolean };
type DetailLevel = "abstract" | "structure" | "detail";
type SceneLighting = {
  vector: Vec3;
  screen: { x: number; y: number };
  color: string;
  intensity: number;
  power: number;
  ambient: number;
  diffuse: number;
  specular: number;
  rim: number;
  shadow: number;
};
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
type SurfacePort = {
  id: string;
  x: number;
  y: number;
  rx: number;
  ry: number;
  rotation: number;
  color: string;
  alpha: number;
  light: number;
};
type WebGLMesh = {
  positions: WebGLBuffer;
  normals: WebGLBuffer;
  indices: WebGLBuffer;
  count: number;
};
type WebGLRendererState = {
  gl: WebGLRenderingContext;
  quality: GraphicsQuality;
  program: WebGLProgram;
  locations: {
    position: number;
    normal: number;
    model: WebGLUniformLocation | null;
    color: WebGLUniformLocation | null;
    alpha: WebGLUniformLocation | null;
    lightDir: WebGLUniformLocation | null;
    lightColor: WebGLUniformLocation | null;
    ambient: WebGLUniformLocation | null;
    diffuse: WebGLUniformLocation | null;
    specular: WebGLUniformLocation | null;
    rim: WebGLUniformLocation | null;
    yaw: WebGLUniformLocation | null;
    pitch: WebGLUniformLocation | null;
    scale: WebGLUniformLocation | null;
    depthBoost: WebGLUniformLocation | null;
    distance: WebGLUniformLocation | null;
    minPerspective: WebGLUniformLocation | null;
    maxPerspective: WebGLUniformLocation | null;
    viewport: WebGLUniformLocation | null;
    pan: WebGLUniformLocation | null;
    depthOffset: WebGLUniformLocation | null;
    vertexPerspective: WebGLUniformLocation | null;
  };
  sphere: WebGLMesh;
  sphereLow: WebGLMesh;
  cylinder: WebGLMesh;
  lonePair: WebGLMesh;
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

const devicePixelRatioSafe = (quality: GraphicsQuality) => Math.min(window.devicePixelRatio || 1, graphicsQualityProfile(quality).dprCap);

const defaultCamera: Camera3D = { yaw: -0.62, pitch: 0.46, panX: 0, panY: 0, fitZoom: 1 };

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
  const webglCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const webglRendererRef = useRef<WebGLRendererState | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const dragStart = useRef<{ x: number; y: number; yaw: number; pitch: number; panX: number; panY: number; fitZoom: number; mode: "rotate" | "pan" } | null>(null);
  const spinFrame = useRef<number | null>(null);
  const hoverStartedAt = useRef(0);
  const [camera, setCamera] = useState<Camera3D>(defaultCamera);
  const [hoveredAtomId, setHoveredAtomId] = useState<string | null>(null);
  const [hoveredBondId, setHoveredBondId] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const sceneAtoms = useMemo(
    () => buildSceneAtoms(state.atoms, state.bonds, settings, state.time),
    [settings.collisionStrength, settings.geometryAssist, settings.geometryMode, settings.relaxationStrength, settings.speed, settings.temperature, state.atoms, state.bonds, state.time]
  );
  const sceneKey = useMemo(
    () => `${state.atoms.map((atom) => atom.id).join("|")}::${state.bonds.map((bond) => bond.id).join("|")}`,
    [state.atoms, state.bonds]
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
    const webglCanvas = webglCanvasRef.current;
    if (!canvas) return;
    const dpr = devicePixelRatioSafe(settings.graphicsQuality);
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    if (webglCanvas) {
      webglCanvas.width = Math.floor(width * dpr);
      webglCanvas.height = Math.floor(height * dpr);
      webglCanvas.style.width = `${width}px`;
      webglCanvas.style.height = `${height}px`;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const longHover = hoveredAtomId ? clamp((Date.now() - hoverStartedAt.current) / 900, 0, 1) : 0;
    const webglReady = webglCanvas ? renderWebGL3D(webglCanvas, webglRendererRef, sceneAtoms, state.atoms, state.bonds, settings, camera, width, height, hoveredAtomId, hoveredBondId, longHover, state.time, state.selectedAtomId, dpr) : false;
    if (webglReady) {
      draw3DOverlay(ctx, sceneAtoms, state.atoms, state.bonds, settings, camera, width, height, hoveredAtomId, hoveredBondId, longHover, state.time, state.selectedAtomId);
    } else {
      draw3D(ctx, sceneAtoms, state.atoms, state.bonds, settings, camera, width, height, hoveredAtomId, hoveredBondId, longHover, state.time, state.selectedAtomId);
    }
  }, [camera, height, hoveredAtomId, hoveredBondId, sceneAtoms, settings, state.atoms, state.bonds, state.time, state.selectedAtomId, width]);

  useEffect(() => {
    const handleFullscreen = () => setIsFullscreen(document.fullscreenElement === wrapRef.current);
    document.addEventListener("fullscreenchange", handleFullscreen);
    return () => document.removeEventListener("fullscreenchange", handleFullscreen);
  }, []);

  useEffect(() => {
    const presetName = settings.cameraPreset;
    if (presetName === "free") return;
    const presets: Record<"top" | "side" | "isometric", Camera3D> = {
      top: { yaw: 0, pitch: 0, panX: 0, panY: 0, fitZoom: camera.fitZoom },
      side: { yaw: -Math.PI / 2, pitch: 0.12, panX: 0, panY: 0, fitZoom: camera.fitZoom },
      isometric: { yaw: -0.72, pitch: 0.62, panX: 0, panY: 0, fitZoom: camera.fitZoom }
    };
    setCamera((current) => frameCameraFor(sceneAtoms, { ...presets[presetName], fitZoom: current.fitZoom }, settings, width, height));
  }, [settings.cameraPreset]);

  useEffect(() => {
    if (!sceneAtoms.length) return;
    setCamera((current) => frameCameraFor(sceneAtoms, current, settings, width, height));
  }, [sceneKey, width, height, settings.projectionMode]);

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
    dragStart.current = { x: event.clientX, y: event.clientY, yaw: camera.yaw, pitch: camera.pitch, panX: camera.panX, panY: camera.panY, fitZoom: camera.fitZoom, mode };
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
        panX: clamp(dragStart.current.panX + dx, -width * 1.4, width * 1.4),
        panY: clamp(dragStart.current.panY + dy, -height * 1.4, height * 1.4),
        fitZoom: dragStart.current.fitZoom
      });
      return;
    }
    setCamera({
      yaw: dragStart.current.yaw + dx * 0.008,
      pitch: clamp(dragStart.current.pitch + dy * 0.006, -1.2, 1.2),
      panX: dragStart.current.panX,
      panY: dragStart.current.panY,
      fitZoom: dragStart.current.fitZoom
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
  const fitMolecule = () => setCamera((current) => frameCameraFor(sceneAtoms, current, settings, width, height));
  const resetCamera = () => {
    setZoom(1);
    setCamera(frameCameraFor(sceneAtoms, defaultCamera, settings, width, height));
  };
  const toggleFullscreen = async () => {
    const target = wrapRef.current;
    if (!target) return;
    if (document.fullscreenElement === target) {
      await document.exitFullscreen();
      return;
    }
    await target.requestFullscreen();
  };

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
        ref={webglCanvasRef}
        className="simulation-canvas molecule-3d-webgl"
        aria-hidden="true"
      />
      <canvas
        ref={canvasRef}
        className="simulation-canvas molecule-3d-canvas molecule-3d-overlay"
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
        <button title="Fit molecule" onClick={fitMolecule}><Crosshair size={17} /></button>
        <button title="Reset view" onClick={resetCamera}><Maximize2 size={17} /></button>
        <button title={isFullscreen ? "Exit fullscreen" : "Fullscreen"} onClick={toggleFullscreen}>
          {isFullscreen ? <Minimize2 size={17} /> : <Maximize2 size={17} />}
        </button>
      </div>
      <aside className="camera-guide" aria-label="Camera controls guide">
        <strong>Camera</strong>
        <span><kbd>Drag</kbd> Rotate</span>
        <span><kbd>Shift</kbd><kbd>Drag</kbd> Pan</span>
        <span><kbd>Wheel</kbd> Zoom</span>
        <span><kbd>Fit</kbd> Frame</span>
        <span><kbd>Right drag</kbd> Pan</span>
      </aside>
      <div className="canvas-readout">
        <span><Box size={13} /> VSEPR 3D renderer</span>
        <span>{projectionLabel(settings.projectionMode)}</span>
        <span>{Math.round(camera.fitZoom * 100)}% fit</span>
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
    componentOffset += Math.max(3.4, largeMoleculeTargetSpan(component.length) * 1.15);
  }

  centerScene(placed);
  apply3DControlResponse(placed, atoms, bonds, settings, time);
  return atoms.map((atom) => ({ ...atom, ...(placed.get(atom.id) ?? { x: 0, y: 0, z: 0 }) }));
}

function apply3DControlResponse(placed: Map<string, Vec3>, atoms: AtomParticle[], bonds: Bond[], settings: SimulationSettings, time: number) {
  if (settings.geometryMode === "rigid") return;
  if (atoms.length > 64) return;
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
  const zs = component.map((atom) => atom.z ?? 0);
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
  const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
  const cz = (Math.min(...zs) + Math.max(...zs)) / 2;
  const span = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys), (Math.max(...zs) - Math.min(...zs)) * 1.4);
  const targetSpan = largeMoleculeTargetSpan(component.length);
  const scale = targetSpan / Math.max(80, span);
  for (const atom of component) {
    placed.set(atom.id, {
      x: offset.x + (atom.x - cx) * scale,
      y: (atom.y - cy) * scale,
      z: ((atom.z ?? 0) - cz) * scale * 0.86
    });
  }
}

function largeMoleculeTargetSpan(atomCount: number) {
  if (atomCount > 120) return clamp(Math.sqrt(atomCount) * 1.36, 14, 22);
  if (atomCount > 72) return clamp(Math.sqrt(atomCount) * 1.24, 11, 17);
  if (atomCount > 36) return clamp(Math.sqrt(atomCount) * 1.04, 7.2, 12);
  return 5.2;
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
  const lighting = sceneLighting(settings);
  draw3DBackground(ctx, settings, width, height, lighting);
  const detailLevel = detailLevelFor(settings);
  const interaction = buildInteractionContext(sourceAtoms, bonds, settings, selectedAtomId, hoveredAtomId, hoveredBondId, longHover);
  const projected = applyProjectedEmphasis(projectAtoms(atoms, camera, width, height, settings), interaction, settings);
  const budget = renderBudgetFor(projected, settings);
  const showChemistryDetail = settings.analysisMode === "chemistry" && detailLevel === "detail";
  const showLonePairDetail = budget.overlays && settings.highlightLonePairs && detailLevel !== "abstract";
  const lonePairs = (showLonePairDetail || showChemistryDetail && settings.showElectronRegions) ? projectLonePairs(lonePairClouds(atoms, bonds), camera, width, height, settings) : [];
  const byId = new Map(projected.map((atom) => [atom.id, atom]));
  const visibleBonds = structuralBonds(bonds).filter((bond) => bondVisibleInMode(bond, byId, settings));
  const surfacePorts = buildSurfacePorts(projected, visibleBonds, settings, interaction, lighting);
  draw3DLightSource(ctx, lighting, settings, width);
  draw3DMoleculeShadow(ctx, atoms, bonds, settings, camera, width, height, budget, lighting);
  if (showChemistryDetail && settings.showElectronRegions && budget.overlays) drawElectronRegionOverlay(ctx, projected, bonds, settings, false);
  if (shouldShowFunctionalGroups(settings, detailLevel)) drawFunctionalGroupHighlights3D(ctx, projected, structuralBonds(bonds), settings, detailLevel);

  for (const bond of [...visibleBonds].sort((a, b) => bondDepth(a, byId) - bondDepth(b, byId))) {
    const a = byId.get(bond.a);
    const b = byId.get(bond.b);
    if (a && b) draw3DBond(ctx, a, b, bond, settings, budget, interaction, lighting);
  }
  if (showChemistryDetail && (settings.showBondDipoles || settings.showNetDipole) && budget.overlays) {
    if (settings.showBondDipoles) for (const bond of [...visibleBonds].sort((a, b) => bondDepth(a, byId) - bondDepth(b, byId))) {
      const a = byId.get(bond.a);
      const b = byId.get(bond.b);
      if (a && b) draw3DDipoleIndicator(ctx, a, b, bond, settings, interaction);
    }
    if (settings.showNetDipole) drawNetDipole3D(ctx, projected, visibleBonds, settings);
  }
  drawDepthSortedStructure(ctx, projected, lonePairs, visibleBonds, settings, budget, interaction, time, byId, surfacePorts, lighting);
  if (showChemistryDetail && settings.showElectronFlow && budget.overlays) drawElectronFlow3D(ctx, projected, visibleBonds.filter((bond) => bond.id !== hoveredBondId), settings, time);
  if (budget.overlays) draw3DBondAngleBadge(ctx, projected, visibleBonds, hoveredBondId, settings);
  drawAxisGizmo(ctx, camera, settings, width, height);
  drawMini2DStructure(ctx, sourceAtoms, bonds, settings);
}

function draw3DOverlay(ctx: CanvasRenderingContext2D, atoms: SceneAtom[], sourceAtoms: AtomParticle[], bonds: Bond[], settings: SimulationSettings, camera: Camera3D, width: number, height: number, hoveredAtomId: string | null, hoveredBondId: string | null, longHover: number, time: number, selectedAtomId: string | null) {
  ctx.clearRect(0, 0, width, height);
  const lighting = sceneLighting(settings);
  const detailLevel = detailLevelFor(settings);
  const interaction = buildInteractionContext(sourceAtoms, bonds, settings, selectedAtomId, hoveredAtomId, hoveredBondId, longHover);
  const projected = applyProjectedEmphasis(projectAtoms(atoms, camera, width, height, settings), interaction, settings);
  const budget = renderBudgetFor(projected, settings);
  const showChemistryDetail = settings.analysisMode === "chemistry" && detailLevel === "detail";
  const byId = new Map(projected.map((atom) => [atom.id, atom]));
  const visibleBonds = structuralBonds(bonds).filter((bond) => bondVisibleInMode(bond, byId, settings));

  draw3DLightSource(ctx, lighting, settings, width);
  if (showChemistryDetail && settings.showElectronRegions && budget.overlays) drawElectronRegionOverlay(ctx, projected, bonds, settings);
  if (shouldShowFunctionalGroups(settings, detailLevel)) drawFunctionalGroupHighlights3D(ctx, projected, structuralBonds(bonds), settings, detailLevel);
  if (showChemistryDetail && settings.showNetDipole && budget.overlays) {
    drawNetDipole3D(ctx, projected, visibleBonds, settings);
  }
  draw3DAtomLabels(ctx, projected, visibleBonds, settings, budget, interaction);
  if (budget.overlays) draw3DBondAngleBadge(ctx, projected, visibleBonds, hoveredBondId, settings);
  drawAxisGizmo(ctx, camera, settings, width, height);
  drawMini2DStructure(ctx, sourceAtoms, bonds, settings);
}

function draw3DAtomLabels(ctx: CanvasRenderingContext2D, atoms: ProjectedAtom[], bonds: Bond[], settings: SimulationSettings, budget: RenderBudget, interaction: InteractionContext) {
  if (settings.displayMode === "skeleton") return;
  ctx.save();
  const visibleAtoms = atoms.filter((atom) => atomVisibleInMode(atom, settings));
  for (const atom of [...visibleAtoms].sort((a, b) => a.depth - b.depth)) {
    if (!projectedAtomOverlayVisible(atom, visibleAtoms)) continue;
    const data = atomData[atom.symbol];
    const muted = interaction.focusIds && !interaction.focusIds.has(atom.id);
    const focusAlpha = muted ? 0.22 : 1;
    const r = modelScreenRadius(atom);
    const showSymbol = atom.symbol !== "H" || settings.zoom >= 1.25 || interaction.activeAtomIds.has(atom.id);
    const showName = shouldShowAtomLabel(atom, settings, budget, interaction.focusIds) && (atom.symbol !== "H" || settings.zoom >= 1.38 || interaction.activeAtomIds.has(atom.id));
    ctx.globalAlpha = clamp(0.68 + (atom.depth + 2.8) * 0.1, 0.44, 1) * focusAlpha;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineJoin = "round";
    ctx.font = `900 ${clamp(r * 0.5, 11, 22)}px Inter, system-ui`;
    ctx.strokeStyle = settings.theme === "light" ? "rgba(239,247,243,0.42)" : "rgba(4,8,10,0.58)";
    ctx.lineWidth = Math.max(2.5, r * 0.08);
    if (showSymbol) {
      ctx.strokeText(atom.symbol, atom.sx, atom.sy);
      ctx.fillStyle = settings.theme === "light" ? "#17211d" : "#f8fafc";
      ctx.fillText(atom.symbol, atom.sx, atom.sy);
    }
    if (showName) {
      ctx.font = "750 11px Inter, system-ui";
      ctx.globalAlpha = clamp(0.5 + (atom.depth + 2.8) * 0.1, 0.32, 0.82) * focusAlpha;
      ctx.strokeStyle = settings.theme === "light" ? "rgba(239,247,243,0.76)" : "rgba(4,8,10,0.64)";
      ctx.lineWidth = 3.5;
      ctx.strokeText(data.name, atom.sx, atom.sy + r + 16);
      ctx.fillStyle = settings.theme === "light" ? "rgba(24,38,34,0.72)" : "rgba(241,245,249,0.74)";
      ctx.fillText(data.name, atom.sx, atom.sy + r + 16);
    }
  }
  ctx.restore();
}

function projectedAtomOverlayVisible(atom: ProjectedAtom, atoms: ProjectedAtom[]) {
  for (const other of atoms) {
    if (other.id === atom.id) continue;
    if (other.depth <= atom.depth + 0.06) continue;
    const distance = Math.hypot(atom.sx - other.sx, atom.sy - other.sy);
    if (distance < other.screenRadius * 0.82) return false;
  }
  return true;
}

function modelWorldRadiusFor(atom: Pick<SceneAtom, "symbol">, sceneSize = 1) {
  const covalent = atomData[atom.symbol].covalentRadius;
  const scale = largeMoleculeAtomScale(sceneSize);
  if (atom.symbol === "H") return 0.12 * scale;
  if (atom.symbol === "He") return 0.14 * scale;
  const base = 0.19 + (covalent - 70) * 0.00125;
  return clamp(base * scale, 0.11, 0.34);
}

function modelScreenRadiusSource(atom: Pick<SceneAtom, "symbol">, sceneSize = 1) {
  const radius = modelWorldRadiusFor(atom, sceneSize);
  const detailLift = atom.symbol === "H" ? 0.98 : 1.08;
  return radius * 104 * detailLift;
}

function modelScreenRadius(atom: ProjectedAtom) {
  const scale = largeMoleculeAtomScale(atom.sceneSize);
  return clamp(atom.screenRadius, atom.symbol === "H" ? 7 * scale : 10 * scale, atom.symbol === "H" ? 18 : 34);
}

function largeMoleculeAtomScale(atomCount: number) {
  if (atomCount > 150) return 0.52;
  if (atomCount > 96) return 0.58;
  if (atomCount > 56) return 0.68;
  if (atomCount > 32) return 0.82;
  return 1;
}

function renderWebGL3D(
  canvas: HTMLCanvasElement,
  rendererRef: MutableRefObject<WebGLRendererState | null>,
  atoms: SceneAtom[],
  sourceAtoms: AtomParticle[],
  bonds: Bond[],
  settings: SimulationSettings,
  camera: Camera3D,
  width: number,
  height: number,
  hoveredAtomId: string | null,
  hoveredBondId: string | null,
  longHover: number,
  time: number,
  selectedAtomId: string | null,
  dpr: number
) {
  const renderer = rendererRef.current?.quality === settings.graphicsQuality
    ? rendererRef.current
    : createWebGLRenderer(canvas, settings.graphicsQuality);
  if (!renderer) return false;
  rendererRef.current = renderer;

  const gl = renderer.gl;
  if (gl.isContextLost()) return false;
  gl.viewport(0, 0, Math.floor(width * dpr), Math.floor(height * dpr));
  gl.clearColor(0, 0, 0, 0);
  gl.clearDepth(1);
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.disable(gl.CULL_FACE);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  if (!atoms.length) return true;

  const lighting = sceneLighting(settings);
  const profile = projectionProfile(settings.projectionMode);
  const totalZoom = settings.zoom * camera.fitZoom;
  const scale = Math.min(width, height) * profile.scale * totalZoom * 1.08;
  const interaction = buildInteractionContext(sourceAtoms, bonds, settings, selectedAtomId, hoveredAtomId, hoveredBondId, longHover);
  const projected = applyProjectedEmphasis(projectAtoms(atoms, camera, width, height, settings), interaction, settings);
  const budget = renderBudgetFor(projected, settings);
  const byId = new Map(projected.map((atom) => [atom.id, atom]));
  const visibleBonds = structuralBonds(bonds).filter((bond) => bondVisibleInMode(bond, byId, settings));
  const worldRadii = new Map(projected.map((atom) => [atom.id, webGLWorldRadius(atom)]));
  const lightColor = rgbUnit(lighting.color);
  const lightDir = normalizeVec({ x: lighting.screen.x * 0.62, y: lighting.screen.y * 0.62, z: 0.78 + lighting.power * 0.12 });

  gl.useProgram(renderer.program);
  gl.uniform3f(renderer.locations.lightDir, lightDir.x, lightDir.y, lightDir.z);
  gl.uniform3f(renderer.locations.lightColor, lightColor.r, lightColor.g, lightColor.b);
  gl.uniform1f(renderer.locations.ambient, lighting.ambient);
  gl.uniform1f(renderer.locations.diffuse, lighting.diffuse);
  gl.uniform1f(renderer.locations.specular, lighting.specular);
  gl.uniform1f(renderer.locations.rim, lighting.rim);
  gl.uniform1f(renderer.locations.yaw, camera.yaw);
  gl.uniform1f(renderer.locations.pitch, camera.pitch);
  gl.uniform1f(renderer.locations.scale, scale);
  gl.uniform1f(renderer.locations.depthBoost, profile.depthBoost);
  gl.uniform1f(renderer.locations.distance, profile.distance === Infinity ? 100000 : profile.distance);
  gl.uniform1f(renderer.locations.minPerspective, profile.minPerspective);
  gl.uniform1f(renderer.locations.maxPerspective, profile.maxPerspective);
  gl.uniform2f(renderer.locations.viewport, width, height);
  gl.uniform2f(renderer.locations.pan, camera.panX, camera.panY);

  if (settings.visualStyle === "detailed") {
    drawWebGLGroundShadow(renderer, projected, visibleBonds, worldRadii, settings, lighting, budget);
  }
  drawWebGLBonds(renderer, projected, visibleBonds, worldRadii, settings, camera, interaction);
  drawWebGLAtoms(renderer, projected, visibleBonds, worldRadii, settings, interaction, budget);
  if (settings.visualStyle === "detailed" && budget.detailedEffects && settings.displayMode !== "skeleton") {
    drawWebGLSurfaceSockets(renderer, projected, visibleBonds, worldRadii, settings, camera, interaction);
  }
  drawWebGLLonePairs(renderer, atoms, projected, bonds, worldRadii, settings, time, budget);
  return true;
}

function createWebGLRenderer(canvas: HTMLCanvasElement, quality: GraphicsQuality): WebGLRendererState | null {
  const gl = canvas.getContext("webgl", { alpha: true, antialias: true, depth: true, premultipliedAlpha: false });
  if (!gl) return null;
  const program = createWebGLProgram(gl, webGLVertexShader, webGLFragmentShader);
  if (!program) return null;
  const profile = graphicsQualityProfile(quality);
  return {
    gl,
    quality,
    program,
    locations: {
      position: gl.getAttribLocation(program, "aPosition"),
      normal: gl.getAttribLocation(program, "aNormal"),
      model: gl.getUniformLocation(program, "uModel"),
      color: gl.getUniformLocation(program, "uColor"),
      alpha: gl.getUniformLocation(program, "uAlpha"),
      lightDir: gl.getUniformLocation(program, "uLightDir"),
      lightColor: gl.getUniformLocation(program, "uLightColor"),
      ambient: gl.getUniformLocation(program, "uAmbient"),
      diffuse: gl.getUniformLocation(program, "uDiffuse"),
      specular: gl.getUniformLocation(program, "uSpecular"),
      rim: gl.getUniformLocation(program, "uRim"),
      yaw: gl.getUniformLocation(program, "uYaw"),
      pitch: gl.getUniformLocation(program, "uPitch"),
      scale: gl.getUniformLocation(program, "uScale"),
      depthBoost: gl.getUniformLocation(program, "uDepthBoost"),
      distance: gl.getUniformLocation(program, "uDistance"),
      minPerspective: gl.getUniformLocation(program, "uMinPerspective"),
      maxPerspective: gl.getUniformLocation(program, "uMaxPerspective"),
      viewport: gl.getUniformLocation(program, "uViewport"),
      pan: gl.getUniformLocation(program, "uPan"),
      depthOffset: gl.getUniformLocation(program, "uDepthOffset"),
      vertexPerspective: gl.getUniformLocation(program, "uVertexPerspective")
    },
    sphere: createWebGLMesh(gl, createSphereGeometry(profile.sphereRows, profile.sphereColumns)),
    sphereLow: createWebGLMesh(gl, createSphereGeometry(profile.sphereLowRows, profile.sphereLowColumns)),
    cylinder: createWebGLMesh(gl, createCylinderGeometry(profile.cylinderSegments)),
    lonePair: createWebGLMesh(gl, createLonePairGeometry(profile.lonePairRows, profile.lonePairColumns))
  };
}

function drawWebGLBonds(renderer: WebGLRendererState, atoms: ProjectedAtom[], bonds: Bond[], worldRadii: Map<string, number>, settings: SimulationSettings, camera: Camera3D, interaction: InteractionContext) {
  const byId = new Map(atoms.map((atom) => [atom.id, atom]));
  const view = cameraForward(camera);
  for (const bond of bonds) {
    const a = byId.get(bond.a);
    const b = byId.get(bond.b);
    if (!a || !b) continue;
    const startCenter = { x: a.x, y: a.y, z: a.z };
    const endCenter = { x: b.x, y: b.y, z: b.z };
    const dir = normalizeVec({ x: endCenter.x - startCenter.x, y: endCenter.y - startCenter.y, z: endCenter.z - startCenter.z });
    const distance = Math.hypot(endCenter.x - startCenter.x, endCenter.y - startCenter.y, endCenter.z - startCenter.z);
    if (distance <= 0.01) continue;
    const offsetDir = stablePerpendicular(dir, view);
    const lanes = bond.order === 1 ? [0] : bond.order === 2 ? [-1, 1] : [-1.45, 0, 1.45];
    const baseTube = clamp(0.045 - (bond.order - 1) * 0.005, 0.032, 0.052);
    const active = interaction.activeBondIds.has(bond.id) || interaction.hoveredBondId === bond.id;
    const focusAlpha = interaction.focusIds && !interaction.focusIds.has(a.id) && !interaction.focusIds.has(b.id) ? 0.24 : 1;
    const depthOffset = 0.008;
    const laneGap = baseTube * (bond.order === 1 ? 0 : bond.order === 2 ? 1.72 : 2.02);
    for (const lane of lanes) {
      const offset = lane * laneGap;
      const tubeRadius = baseTube * (active ? 1.32 : 1);
      const laneStart = {
        x: startCenter.x + offsetDir.x * offset,
        y: startCenter.y + offsetDir.y * offset,
        z: startCenter.z + offsetDir.z * offset
      };
      const laneEnd = {
        x: endCenter.x + offsetDir.x * offset,
        y: endCenter.y + offsetDir.y * offset,
        z: endCenter.z + offsetDir.z * offset
      };
      const colorA = rgbUnit(bondAtomTubeColor(a, settings));
      const colorB = rgbUnit(bondAtomTubeColor(b, settings));
      const baseColor = {
        r: (colorA.r + colorB.r) / 2,
        g: (colorA.g + colorB.g) / 2,
        b: (colorA.b + colorB.b) / 2
      };
      const tubeColor = active
        ? mixRgb(baseColor, rgbUnit(settings.theme === "light" ? "#14b8a6" : "#5eead4"), 0.36)
        : baseColor;
      const alpha = focusAlpha >= 0.99 ? 1 : clamp(focusAlpha, 0.14, 1);
      drawWebGLMesh(renderer, renderer.cylinder, cylinderMatrix(laneStart, laneEnd, tubeRadius), tubeColor, alpha, depthOffset, true);
    }
  }
}

function drawWebGLGroundShadow(renderer: WebGLRendererState, atoms: ProjectedAtom[], bonds: Bond[], worldRadii: Map<string, number>, settings: SimulationSettings, lighting: SceneLighting, budget: RenderBudget) {
  if (!atoms.length || settings.displayMode === "skeleton") return;
  const visibleAtoms = atoms.filter((atom) => atomVisibleInMode(atom, settings));
  if (!visibleAtoms.length) return;
  const byId = new Map(atoms.map((atom) => [atom.id, atom]));
  const maxRadius = visibleAtoms.reduce((max, atom) => Math.max(max, worldRadii.get(atom.id) ?? 0.2), 0.2);
  const floorY = visibleAtoms.reduce((max, atom) => Math.max(max, atom.y + (worldRadii.get(atom.id) ?? 0.2)), -Infinity) + maxRadius * 3.8 + 0.42;
  const light = normalizeVec({
    x: lighting.vector.x,
    y: Math.abs(lighting.vector.y) + 0.5,
    z: lighting.vector.z * 0.72
  });
  const cast = (point: Vec3): Vec3 => {
    const drop = Math.max(0, floorY - point.y);
    const travel = drop / Math.max(0.28, light.y);
    return {
      x: point.x - light.x * travel * 0.34,
      y: floorY,
      z: point.z - light.z * travel * 0.34
    };
  };
  const shadowColor = rgbUnit(settings.theme === "light" ? "#334155" : "#020617");
  const countFade = atoms.length > 160 ? 0.58 : atoms.length > 80 ? 0.72 : 1;
  const baseAlpha = (settings.theme === "light" ? 0.12 : 0.2) * clamp(lighting.shadow, 0.18, 0.95) * countFade;
  const softPass = budget.detailedEffects && atoms.length <= 96;

  for (const bond of bonds) {
    const a = byId.get(bond.a);
    const b = byId.get(bond.b);
    if (!a || !b || !atomVisibleInMode(a, settings) || !atomVisibleInMode(b, settings)) continue;
    const start = cast({ x: a.x, y: a.y, z: a.z });
    const end = cast({ x: b.x, y: b.y, z: b.z });
    const radiusA = worldRadii.get(a.id) ?? 0.2;
    const radiusB = worldRadii.get(b.id) ?? 0.2;
    const radius = clamp(Math.min(radiusA, radiusB) * 0.18, 0.022, 0.074);
    drawWebGLMesh(renderer, renderer.cylinder, cylinderMatrix(start, end, radius), shadowColor, baseAlpha * 0.32, 0.12);
  }

  for (const atom of visibleAtoms) {
    const radius = worldRadii.get(atom.id) ?? 0.2;
    const center = cast({ x: atom.x, y: atom.y, z: atom.z });
    if (softPass) {
      drawWebGLMesh(
        renderer,
        renderer.sphereLow,
        basisMatrix(center, { x: radius * 1.95, y: 0, z: 0 }, { x: 0, y: 0.012, z: 0 }, { x: 0, y: 0, z: radius * 0.78 }),
        shadowColor,
        baseAlpha * 0.16,
        0.13
      );
    }
    drawWebGLMesh(
      renderer,
      renderer.sphereLow,
      basisMatrix(center, { x: radius * 1.34, y: 0, z: 0 }, { x: 0, y: 0.018, z: 0 }, { x: 0, y: 0, z: radius * 0.5 }),
      shadowColor,
      baseAlpha * 0.42,
      0.11
    );
  }
}

function bondAtomTubeColor(atom: ProjectedAtom, settings: SimulationSettings) {
  const dataColor = atomData[atom.symbol].color;
  const neutral = settings.theme === "light" ? "#6b7280" : "#cbd5e1";
  const amount = atom.symbol === "H" ? 0.34 : 0.42;
  return mixHex(dataColor, neutral, amount);
}

function drawWebGLAtoms(renderer: WebGLRendererState, atoms: ProjectedAtom[], bonds: Bond[], worldRadii: Map<string, number>, settings: SimulationSettings, interaction: InteractionContext, budget: RenderBudget) {
  const mesh = atoms.length > 90 ? renderer.sphereLow : renderer.sphere;
  const visibleAtoms = atoms.filter((atom) => atomVisibleInMode(atom, settings));
  for (const atom of visibleAtoms.sort((a, b) => a.depth - b.depth)) {
    const data = atomData[atom.symbol];
    const muted = interaction.focusIds && !interaction.focusIds.has(atom.id);
    const selected = interaction.selectedAtomId === atom.id;
    const hovered = interaction.hoveredAtomId === atom.id;
    const active = interaction.activeAtomIds.has(atom.id);
    const central = interaction.centralAtomIds.has(atom.id);
    const emphasis = (selected ? 0.055 : 0) + (hovered ? 0.04 + interaction.longHover * 0.035 : 0) + (active ? 0.018 : 0) + (central ? 0.016 : 0);
    const radius = (worldRadii.get(atom.id) ?? 0.2) * (1 + emphasis);
    const base = rgbUnit(data.color);
    const alpha = muted ? 0.28 : 1;
    const model = sphereMatrix({ x: atom.x, y: atom.y, z: atom.z }, radius);
    drawWebGLMesh(renderer, mesh, model, base, alpha, 0);
    if (selected && settings.visualStyle === "detailed") {
      drawWebGLMesh(renderer, mesh, sphereMatrix({ x: atom.x, y: atom.y, z: atom.z }, radius * 1.045), rgbUnit("#facc15"), 0.18, -0.006);
    }
  }
}

function drawWebGLSurfaceSockets(renderer: WebGLRendererState, atoms: ProjectedAtom[], bonds: Bond[], worldRadii: Map<string, number>, settings: SimulationSettings, camera: Camera3D, interaction: InteractionContext) {
  const contextual = Boolean(interaction.selectedAtomId || interaction.hoveredAtomId || interaction.focusIds);
  if (!contextual) return;
  const byId = new Map(atoms.map((atom) => [atom.id, atom]));
  const view = cameraForward(camera);
  for (const bond of bonds) {
    const a = byId.get(bond.a);
    const b = byId.get(bond.b);
    if (!a || !b) continue;
    const color = rgbUnit(bondRenderColor(bond, settings));
    drawWebGLSocketSet(renderer, atoms, a, b, bond, worldRadii, color, view, settings, interaction);
    drawWebGLSocketSet(renderer, atoms, b, a, bond, worldRadii, color, view, settings, interaction);
  }
}

function drawWebGLSocketSet(renderer: WebGLRendererState, atoms: ProjectedAtom[], atom: ProjectedAtom, other: ProjectedAtom, bond: Bond, worldRadii: Map<string, number>, color: { r: number; g: number; b: number }, view: Vec3, settings: SimulationSettings, interaction: InteractionContext) {
  if (settings.displayMode === "simplified" && atom.symbol === "H") return;
  const activeBond = interaction.activeBondIds.has(bond.id) || interaction.hoveredBondId === bond.id;
  const contextual = interaction.selectedAtomId === atom.id || interaction.hoveredAtomId === atom.id || Boolean(interaction.focusIds?.has(atom.id)) || activeBond;
  if (!contextual) return;
  const radius = worldRadii.get(atom.id) ?? 0.2;
  const dir = normalizeVec({ x: other.x - atom.x, y: other.y - atom.y, z: other.z - atom.z });
  if (other.depth < atom.depth - 0.26) return;
  const tangent = stablePerpendicular(dir, view);
  const bitangent = normalizeVec(crossVec(dir, tangent));
  const lanes = bond.order === 1 ? [0] : bond.order === 2 ? [-1, 1] : [-1.45, 0, 1.45];
  const active = activeBond || interaction.activeAtomIds.has(atom.id);
  const muted = interaction.focusIds && !interaction.focusIds.has(atom.id);
  const alpha = muted ? 0.08 : active ? 0.32 : 0.14;
  for (const lane of lanes) {
    const offset = lane * radius * 0.075;
    const center = {
      x: atom.x + dir.x * radius * 0.998 + tangent.x * offset,
      y: atom.y + dir.y * radius * 0.998 + tangent.y * offset,
      z: atom.z + dir.z * radius * 0.998 + tangent.z * offset
    };
    const model = basisMatrix(center, scaleVec(tangent, radius * 0.052), scaleVec(dir, radius * 0.008), scaleVec(bitangent, radius * 0.026));
    drawWebGLMesh(renderer, renderer.sphereLow, model, color, alpha, 0.002);
  }
}

function drawWebGLLonePairs(renderer: WebGLRendererState, sceneAtoms: SceneAtom[], projectedAtoms: ProjectedAtom[], bonds: Bond[], worldRadii: Map<string, number>, settings: SimulationSettings, time: number, budget: RenderBudget) {
  if (settings.displayMode === "skeleton" || !budget.overlays && settings.analysisMode !== "chemistry") return;
  const detailLevel = detailLevelFor(settings);
  const showLonePairDetail = settings.highlightLonePairs && detailLevel !== "abstract" || settings.analysisMode === "chemistry" && settings.showElectronRegions;
  if (!showLonePairDetail) return;
  const projectedById = new Map(projectedAtoms.map((atom) => [atom.id, atom]));
  const visibleProjectedAtoms = projectedAtoms.filter((atom) => atomVisibleInMode(atom, settings));
  const clouds = lonePairClouds(sceneAtoms, bonds);
  const color = rgbUnit(settings.theme === "light" ? "#c9b8f3" : "#b7a5f7");
  const softColor = rgbUnit(settings.theme === "light" ? "#d9cef8" : "#cfc4ff");
  const electronColor = rgbUnit("#111827");
  for (const cloud of clouds) {
    const center = projectedById.get(cloud.centerId);
    if (!center || !atomVisibleInMode(center, settings)) continue;
    if (!projectedAtomOverlayVisible(center, visibleProjectedAtoms)) continue;
    const radius = worldRadii.get(center.id) ?? 0.2;
    const dir = normalizeVec({ x: cloud.x - center.x, y: cloud.y - center.y, z: cloud.z - center.z });
    const tangent = stablePerpendicular(dir, { x: 0.2, y: 0.7, z: 1 });
    const bitangent = normalizeVec(crossVec(dir, tangent));
    const base = { x: center.x + dir.x * radius * 1.055, y: center.y + dir.y * radius * 1.055, z: center.z + dir.z * radius * 1.055 };
    const length = radius * 0.72;
    const width = radius * 0.5;
    if (budget.detailedEffects) {
      const shellBase = { x: center.x + dir.x * radius * 1.08, y: center.y + dir.y * radius * 1.08, z: center.z + dir.z * radius * 1.08 };
      drawWebGLMesh(renderer, renderer.lonePair, basisMatrix(shellBase, scaleVec(tangent, width * 1.12), scaleVec(dir, length * 1.02), scaleVec(bitangent, width * 1.04)), softColor, 0.1, 0.004);
    }
    drawWebGLMesh(renderer, renderer.lonePair, basisMatrix(base, scaleVec(tangent, width), scaleVec(dir, length), scaleVec(bitangent, width * 0.96)), color, 0.54, 0.002);

    const seed = atomSeed(cloud.id);
    const phase = (time * 0.82 + seed) % 1;
    const blink = phase > 0.84 ? Math.max(0.12, Math.abs(phase - 0.92) / 0.08) : 1;
    const eyeCenter = { x: base.x + dir.x * length * 0.64, y: base.y + dir.y * length * 0.64, z: base.z + dir.z * length * 0.64 };
    const eyeGap = width * 0.34;
    const eyeRadius = width * 0.12;
    const eyes = [
      { x: eyeCenter.x + tangent.x * eyeGap, y: eyeCenter.y + tangent.y * eyeGap, z: eyeCenter.z + tangent.z * eyeGap },
      { x: eyeCenter.x - tangent.x * eyeGap, y: eyeCenter.y - tangent.y * eyeGap, z: eyeCenter.z - tangent.z * eyeGap }
    ];
    for (const eye of eyes) {
      const model = basisMatrix(eye, scaleVec(tangent, eyeRadius), scaleVec(dir, eyeRadius * blink), scaleVec(bitangent, eyeRadius));
      drawWebGLMesh(renderer, renderer.sphereLow, model, electronColor, 0.88, 0);
    }
  }
}

function webGLWorldRadius(atom: ProjectedAtom) {
  return modelWorldRadiusFor(atom, atom.sceneSize);
}

function drawWebGLMesh(renderer: WebGLRendererState, mesh: WebGLMesh, model: number[], color: { r: number; g: number; b: number }, alpha: number, depthOffset: number, vertexPerspective = false) {
  const gl = renderer.gl;
  gl.bindBuffer(gl.ARRAY_BUFFER, mesh.positions);
  gl.enableVertexAttribArray(renderer.locations.position);
  gl.vertexAttribPointer(renderer.locations.position, 3, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, mesh.normals);
  gl.enableVertexAttribArray(renderer.locations.normal);
  gl.vertexAttribPointer(renderer.locations.normal, 3, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.indices);
  gl.uniformMatrix4fv(renderer.locations.model, false, new Float32Array(model));
  gl.uniform3f(renderer.locations.color, color.r, color.g, color.b);
  gl.uniform1f(renderer.locations.alpha, alpha);
  gl.uniform1f(renderer.locations.depthOffset, depthOffset);
  gl.uniform1f(renderer.locations.vertexPerspective, vertexPerspective ? 1 : 0);
  gl.depthMask(alpha > 0.96);
  gl.drawElements(gl.TRIANGLES, mesh.count, gl.UNSIGNED_SHORT, 0);
  gl.depthMask(true);
}

function createWebGLProgram(gl: WebGLRenderingContext, vertexSource: string, fragmentSource: string) {
  const vertex = compileWebGLShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fragment = compileWebGLShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
  if (!vertex || !fragment) return null;
  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
  return program;
}

function compileWebGLShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return null;
  return shader;
}

function createWebGLMesh(gl: WebGLRenderingContext, geometry: { positions: number[]; normals: number[]; indices: number[] }): WebGLMesh {
  const positions = gl.createBuffer()!;
  gl.bindBuffer(gl.ARRAY_BUFFER, positions);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(geometry.positions), gl.STATIC_DRAW);
  const normals = gl.createBuffer()!;
  gl.bindBuffer(gl.ARRAY_BUFFER, normals);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(geometry.normals), gl.STATIC_DRAW);
  const indices = gl.createBuffer()!;
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indices);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(geometry.indices), gl.STATIC_DRAW);
  return { positions, normals, indices, count: geometry.indices.length };
}

function createSphereGeometry(rows: number, columns: number) {
  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];
  for (let y = 0; y <= rows; y += 1) {
    const v = y / rows;
    const theta = v * Math.PI;
    for (let x = 0; x <= columns; x += 1) {
      const u = x / columns;
      const phi = u * Math.PI * 2;
      const px = Math.sin(theta) * Math.cos(phi);
      const py = Math.cos(theta);
      const pz = Math.sin(theta) * Math.sin(phi);
      positions.push(px, py, pz);
      normals.push(...normalizeArray([px, py, pz]));
    }
  }
  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < columns; x += 1) {
      const a = y * (columns + 1) + x;
      const b = a + columns + 1;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  return { positions, normals, indices };
}

function createCylinderGeometry(segments: number) {
  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];
  for (let i = 0; i <= segments; i += 1) {
    const angle = i / segments * Math.PI * 2;
    const x = Math.cos(angle);
    const z = Math.sin(angle);
    positions.push(x, -0.5, z, x, 0.5, z);
    normals.push(x, 0, z, x, 0, z);
  }
  for (let i = 0; i < segments; i += 1) {
    const a = i * 2;
    indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
  }
  return { positions, normals, indices };
}

function createLonePairGeometry(rows: number, columns: number) {
  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];
  for (let y = 0; y <= rows; y += 1) {
    const t = y / rows;
    const py = t;
    const taper = Math.pow(Math.max(0, Math.sin(Math.PI * t)), 0.58);
    const ringRadius = Math.max(0.018, taper * (0.34 + t * 0.24));
    for (let x = 0; x <= columns; x += 1) {
      const angle = x / columns * Math.PI * 2;
      const asymmetry = 1 + Math.cos(angle) * 0.14;
      const px = Math.cos(angle) * ringRadius * asymmetry;
      const pz = Math.sin(angle) * ringRadius * (0.78 + t * 0.16);
      positions.push(px, py, pz);
      normals.push(...normalizeArray([px, 0.24 - t * 0.18, pz]));
    }
  }
  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < columns; x += 1) {
      const a = y * (columns + 1) + x;
      const b = a + columns + 1;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  return { positions, normals, indices };
}

const webGLVertexShader = `
attribute vec3 aPosition;
attribute vec3 aNormal;
uniform mat4 uModel;
uniform float uYaw;
uniform float uPitch;
uniform float uScale;
uniform float uDepthBoost;
uniform float uDistance;
uniform float uMinPerspective;
uniform float uMaxPerspective;
uniform vec2 uViewport;
uniform vec2 uPan;
uniform float uDepthOffset;
uniform float uVertexPerspective;
varying vec3 vNormal;
varying vec3 vViewNormal;

vec3 rotateView(vec3 point) {
  float cosy = cos(uYaw);
  float siny = sin(uYaw);
  float cosp = cos(uPitch);
  float sinp = sin(uPitch);
  float x = point.x * cosy - point.z * siny;
  float z = point.x * siny + point.z * cosy;
  return vec3(x, point.y * cosp - z * sinp, point.y * sinp + z * cosp);
}

void main() {
  vec3 world = (uModel * vec4(aPosition, 1.0)).xyz;
  vec3 normal = normalize(mat3(uModel) * aNormal);
  vec3 center = uModel[3].xyz;
  vec3 local = world - center;
  vec3 rotatedCenter = rotateView(vec3(center.x, center.y, center.z * uDepthBoost));
  vec3 rotated = rotatedCenter + rotateView(local);
  float centerPerspective = uDistance > 9999.0 ? 1.0 : clamp(uDistance / max(1.1, uDistance - rotatedCenter.z), uMinPerspective, uMaxPerspective);
  float vertexPerspective = uDistance > 9999.0 ? 1.0 : clamp(uDistance / max(1.1, uDistance - rotated.z), uMinPerspective, uMaxPerspective);
  float perspective = mix(centerPerspective, vertexPerspective, uVertexPerspective);
  float sx = uViewport.x * 0.5 + uPan.x + rotated.x * uScale * perspective;
  float sy = uViewport.y * 0.5 + uPan.y + rotated.y * uScale * perspective;
  float clipX = sx / uViewport.x * 2.0 - 1.0;
  float clipY = 1.0 - sy / uViewport.y * 2.0;
  float depth = clamp(0.5 - rotated.z * 0.075 + uDepthOffset, 0.02, 0.98);
  gl_Position = vec4(clipX, clipY, depth, 1.0);
  vNormal = normalize(rotateView(normal));
  vViewNormal = vNormal;
}
`;

const webGLFragmentShader = `
precision mediump float;
uniform vec3 uColor;
uniform float uAlpha;
uniform vec3 uLightDir;
uniform vec3 uLightColor;
uniform float uAmbient;
uniform float uDiffuse;
uniform float uSpecular;
uniform float uRim;
varying vec3 vNormal;
varying vec3 vViewNormal;

void main() {
  vec3 normal = normalize(vNormal);
  vec3 light = normalize(uLightDir);
  vec3 viewNormal = normalize(vViewNormal);
  float rawDiffuse = max(dot(normal, light), 0.0);
  float wrappedDiffuse = 0.18 + rawDiffuse * 0.82;
  vec3 halfDir = normalize(light + vec3(0.0, 0.12, 1.0));
  float specular = pow(max(dot(normal, halfDir), 0.0), 46.0);
  float broadSpecular = pow(max(dot(normal, halfDir), 0.0), 9.0) * 0.18;
  float rim = pow(1.0 - max(dot(viewNormal, vec3(0.0, 0.0, 1.0)), 0.0), 2.45);
  float terminator = smoothstep(-0.22, 0.54, dot(normal, light));
  vec3 shadedBase = mix(uColor * 0.62, uColor, terminator);
  vec3 color = shadedBase * (uAmbient + uDiffuse * wrappedDiffuse) + uLightColor * (uSpecular * (specular + broadSpecular) + uRim * rim);
  gl_FragColor = vec4(clamp(color, 0.0, 1.0), uAlpha);
}
`;

function projectAtoms(atoms: SceneAtom[], camera: Camera3D, width: number, height: number, settings: SimulationSettings): ProjectedAtom[] {
  const minRadius = atoms.length > 96 ? 4.8 : atoms.length > 56 ? 5.8 : 8;
  return atoms.map((atom) => ({ ...atom, ...projectPoint(atom, modelScreenRadiusSource(atom, atoms.length), camera, width, height, settings, minRadius), sceneSize: atoms.length }));
}

function projectLonePairs(clouds: LonePairCloud[], camera: Camera3D, width: number, height: number, settings: SimulationSettings): ProjectedLonePair[] {
  return clouds.map((cloud) => ({ ...cloud, ...projectPoint(cloud, cloud.radius, camera, width, height, settings) }));
}

function projectPoint(point: Vec3, radius: number, camera: Camera3D, width: number, height: number, settings: SimulationSettings, minScreenRadius = 8) {
  const profile = projectionProfile(settings.projectionMode);
  const totalZoom = settings.zoom * camera.fitZoom;
  const scale = Math.min(width, height) * profile.scale * totalZoom;
  const rotated = rotate({ ...point, z: point.z * profile.depthBoost }, camera.yaw, camera.pitch);
  const perspective = profile.distance === Infinity
    ? 1
    : clamp(profile.distance / Math.max(1.1, profile.distance - rotated.z), profile.minPerspective, profile.maxPerspective);
  const radiusPerspective = profile.scaleAtomRadius ? perspective : 1;
  return {
    sx: width / 2 + camera.panX + rotated.x * scale * perspective,
    sy: height / 2 + camera.panY + rotated.y * scale * perspective,
    depth: rotated.z,
    screenRadius: clamp(radius * radiusPerspective * totalZoom, minScreenRadius, 82),
    paintDepth: rotated.z,
    surfaceDepth: rotated.z
  };
}

function renderBudgetFor(atoms: ProjectedAtom[], settings: SimulationSettings): RenderBudget {
  const profile = graphicsQualityProfile(settings.graphicsQuality);
  const maxRadius = atoms.reduce((max, atom) => Math.max(max, atom.screenRadius), 0);
  const heavy = atoms.length > 36 || maxRadius > 72;
  const veryHeavy = atoms.length > 120;
  return {
    detailedEffects: profile.detailMultiplier > 0.45 && (!heavy || profile.detailMultiplier > 1.1 && atoms.length <= 64),
    overlays: atoms.length <= profile.overlayLimit,
    labels: !veryHeavy && atoms.length <= profile.labelLimit
  };
}

function graphicsQualityProfile(quality: GraphicsQuality) {
  if (quality === "low") {
    return {
      dprCap: 1,
      sphereRows: 12,
      sphereColumns: 16,
      sphereLowRows: 8,
      sphereLowColumns: 12,
      cylinderSegments: 12,
      lonePairRows: 8,
      lonePairColumns: 12,
      overlayLimit: 48,
      labelLimit: 38,
      detailMultiplier: 0.35
    };
  }
  if (quality === "medium") {
    return {
      dprCap: 1.35,
      sphereRows: 20,
      sphereColumns: 26,
      sphereLowRows: 12,
      sphereLowColumns: 16,
      cylinderSegments: 20,
      lonePairRows: 12,
      lonePairColumns: 16,
      overlayLimit: 72,
      labelLimit: 56,
      detailMultiplier: 0.75
    };
  }
  if (quality === "very-high") {
    return {
      dprCap: 2.25,
      sphereRows: 42,
      sphereColumns: 58,
      sphereLowRows: 22,
      sphereLowColumns: 30,
      cylinderSegments: 48,
      lonePairRows: 26,
      lonePairColumns: 34,
      overlayLimit: 130,
      labelLimit: 96,
      detailMultiplier: 1.25
    };
  }
  return {
    dprCap: 1.8,
    sphereRows: 30,
    sphereColumns: 40,
    sphereLowRows: 16,
    sphereLowColumns: 22,
    cylinderSegments: 32,
    lonePairRows: 18,
    lonePairColumns: 24,
    overlayLimit: 90,
    labelLimit: 72,
    detailMultiplier: 1
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
    const minRadius = atom.sceneSize > 96 ? 5.2 : atom.sceneSize > 56 ? 6.2 : 10;
    return {
      ...atom,
      screenRadius: clamp(atom.screenRadius * scale, minRadius, 92)
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
  byId: Map<string, ProjectedAtom>,
  surfacePorts: Map<string, SurfacePort[]>,
  lighting: SceneLighting
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
      draw3DAtom(ctx, item.atom, settings, budget, interaction, surfacePorts.get(item.atom.id) ?? [], lighting);
      continue;
    }
    const center = byId.get(item.cloud.centerId);
    if (center) drawLonePairCloud(ctx, item.cloud, center, settings, time, lighting);
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

function frameCameraFor(atoms: SceneAtom[], camera: Camera3D, settings: SimulationSettings, width: number, height: number): Camera3D {
  if (!atoms.length) return { ...camera, panX: 0, panY: 0, fitZoom: 1 };
  const frame = cameraFrameFor(atoms, camera, settings, width, height);
  return {
    ...camera,
    panX: frame.panX,
    panY: frame.panY,
    fitZoom: frame.fitZoom
  };
}

function cameraFrameFor(atoms: SceneAtom[], camera: Camera3D, settings: SimulationSettings, width: number, height: number) {
  const baseCamera = { ...camera, panX: 0, panY: 0, fitZoom: 1 };
  const projected = projectAtoms(atoms, baseCamera, width, height, { ...settings, zoom: 1 });
  const bounds = projectedBounds(projected);
  if (!bounds) return { panX: 0, panY: 0, fitZoom: 1 };

  const reservedTop = 104;
  const reservedBottom = 74;
  const reservedRight = 128;
  const reservedLeft = 34;
  const usableWidth = Math.max(260, width - reservedLeft - reservedRight);
  const usableHeight = Math.max(260, height - reservedTop - reservedBottom);
  const fitZoom = clamp(Math.min(usableWidth / Math.max(1, bounds.width), usableHeight / Math.max(1, bounds.height)), 0.18, 1.18);
  const desiredCenterX = reservedLeft + usableWidth / 2;
  const desiredCenterY = reservedTop + usableHeight / 2;
  const scaledCenterX = width / 2 + (bounds.centerX - width / 2) * fitZoom;
  const scaledCenterY = height / 2 + (bounds.centerY - height / 2) * fitZoom;

  return {
    fitZoom,
    panX: desiredCenterX - scaledCenterX,
    panY: desiredCenterY - scaledCenterY
  };
}

function projectedBounds(atoms: ProjectedAtom[]) {
  if (!atoms.length) return null;
  const minX = Math.min(...atoms.map((atom) => atom.sx - atom.screenRadius));
  const maxX = Math.max(...atoms.map((atom) => atom.sx + atom.screenRadius));
  const minY = Math.min(...atoms.map((atom) => atom.sy - atom.screenRadius));
  const maxY = Math.max(...atoms.map((atom) => atom.sy + atom.screenRadius));
  return {
    minX,
    maxX,
    minY,
    maxY,
    width: Math.max(1, maxX - minX),
    height: Math.max(1, maxY - minY),
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2
  };
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

function crossVec(a: Vec3, b: Vec3): Vec3 {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x
  };
}

function scaleVec(vector: Vec3, scale: number): Vec3 {
  return { x: vector.x * scale, y: vector.y * scale, z: vector.z * scale };
}

function stablePerpendicular(direction: Vec3, reference: Vec3): Vec3 {
  let tangent = crossVec(direction, reference);
  if (Math.hypot(tangent.x, tangent.y, tangent.z) < 0.001) tangent = crossVec(direction, { x: 0, y: 1, z: 0 });
  if (Math.hypot(tangent.x, tangent.y, tangent.z) < 0.001) tangent = crossVec(direction, { x: 1, y: 0, z: 0 });
  return normalizeVec(tangent);
}

function cameraForward(camera: Camera3D): Vec3 {
  return normalizeVec({
    x: Math.sin(camera.yaw) * Math.cos(camera.pitch),
    y: -Math.sin(camera.pitch),
    z: Math.cos(camera.yaw) * Math.cos(camera.pitch)
  });
}

function basisMatrix(origin: Vec3, xAxis: Vec3, yAxis: Vec3, zAxis: Vec3) {
  return [
    xAxis.x, xAxis.y, xAxis.z, 0,
    yAxis.x, yAxis.y, yAxis.z, 0,
    zAxis.x, zAxis.y, zAxis.z, 0,
    origin.x, origin.y, origin.z, 1
  ];
}

function sphereMatrix(center: Vec3, radius: number) {
  return basisMatrix(center, { x: radius, y: 0, z: 0 }, { x: 0, y: radius, z: 0 }, { x: 0, y: 0, z: radius });
}

function cylinderMatrix(start: Vec3, end: Vec3, radius: number) {
  const axis = { x: end.x - start.x, y: end.y - start.y, z: end.z - start.z };
  const length = Math.max(0.001, Math.hypot(axis.x, axis.y, axis.z));
  const yAxis = scaleVec(normalizeVec(axis), length);
  const xAxis = scaleVec(stablePerpendicular(normalizeVec(axis), { x: 0.18, y: 1, z: 0.31 }), radius);
  const zAxis = scaleVec(normalizeVec(crossVec(normalizeVec(yAxis), normalizeVec(xAxis))), radius);
  const center = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2, z: (start.z + end.z) / 2 };
  return basisMatrix(center, xAxis, yAxis, zAxis);
}

function normalizeArray(values: number[]) {
  const length = Math.max(0.001, Math.hypot(values[0], values[1], values[2]));
  return [values[0] / length, values[1] / length, values[2] / length];
}

function draw3DBackground(ctx: CanvasRenderingContext2D, settings: SimulationSettings, width: number, height: number, lighting: SceneLighting) {
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  if (settings.theme === "light") {
    gradient.addColorStop(0, mixHex("#f8fbff", lighting.color, 0.035 + lighting.power * 0.025));
    gradient.addColorStop(1, "#edf6f1");
  } else {
    gradient.addColorStop(0, mixHex("#101316", lighting.color, 0.025 + lighting.power * 0.025));
    gradient.addColorStop(1, "#161c1b");
  }
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  draw3DFadingFloor(ctx, settings, width, height, lighting);
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

function draw3DFadingFloor(ctx: CanvasRenderingContext2D, settings: SimulationSettings, width: number, height: number, lighting: SceneLighting) {
  const horizon = height * 0.38;
  const floor = ctx.createLinearGradient(0, horizon, 0, height);
  if (settings.theme === "light") {
    floor.addColorStop(0, "rgba(226,239,235,0)");
    floor.addColorStop(0.28, hexToRgba(mixHex("#e1eeea", lighting.color, lighting.power * 0.06), 0.16));
    floor.addColorStop(0.72, hexToRgba(mixHex("#d2e4e0", lighting.color, lighting.power * 0.07), 0.34));
    floor.addColorStop(1, hexToRgba(mixHex("#c4dad6", lighting.color, lighting.power * 0.08), 0.5));
  } else {
    floor.addColorStop(0, "rgba(255,255,255,0)");
    floor.addColorStop(0.36, hexToRgba(mixHex("#ffffff", lighting.color, 0.2), 0.035));
    floor.addColorStop(0.76, hexToRgba(mixHex("#ffffff", lighting.color, 0.22), 0.07));
    floor.addColorStop(1, hexToRgba(mixHex("#ffffff", lighting.color, 0.24), 0.105));
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

function draw3DMoleculeShadow(ctx: CanvasRenderingContext2D, atoms: SceneAtom[], bonds: Bond[], settings: SimulationSettings, camera: Camera3D, width: number, height: number, budget: RenderBudget, lighting: SceneLighting) {
  if (!atoms.length || settings.visualStyle !== "detailed") return;
  const shadowAtoms = projectWorldShadowAtoms(atoms, camera, width, height, settings, lighting);
  const byId = new Map(shadowAtoms.map((atom) => [atom.id, atom]));
  const shadowColor = settings.theme === "light"
    ? `rgba(15,23,42,${clamp(0.08 + lighting.shadow * 0.18, 0.09, 0.2)})`
    : `rgba(0,0,0,${clamp(0.2 + lighting.shadow * 0.28, 0.24, 0.5)})`;
  if (shadowAtoms.length > 34) {
    drawAggregateMoleculeShadow(ctx, shadowAtoms, settings, budget, lighting);
    return;
  }
  ctx.save();
  ctx.filter = budget.detailedEffects ? "blur(1px)" : "none";
  ctx.globalAlpha = budget.detailedEffects ? clamp(0.28 + lighting.shadow * 0.34, 0.34, 0.62) : clamp(0.22 + lighting.shadow * 0.28, 0.28, 0.46);
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

function projectWorldShadowAtoms(atoms: SceneAtom[], camera: Camera3D, width: number, height: number, settings: SimulationSettings, lighting: SceneLighting): ProjectedAtom[] {
  const floorY = Math.max(...atoms.map((atom) => atom.y)) + 1.65;
  const ray = { x: -lighting.vector.x * 0.82, y: 1, z: -lighting.vector.z * 0.82 };
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
      ...projectPoint(shadowPoint, atom.radius * 0.34, camera, width, height, settings),
      sceneSize: atoms.length
    };
  });
}

function drawAggregateMoleculeShadow(ctx: CanvasRenderingContext2D, atoms: ProjectedAtom[], settings: SimulationSettings, budget: RenderBudget, lighting: SceneLighting) {
  const minX = Math.min(...atoms.map((atom) => atom.sx - atom.screenRadius * 0.42));
  const maxX = Math.max(...atoms.map((atom) => atom.sx + atom.screenRadius * 0.42));
  const minY = Math.min(...atoms.map((atom) => atom.sy));
  const maxY = Math.max(...atoms.map((atom) => atom.sy));
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const rx = clamp((maxX - minX) * 0.52, 42, 360);
  const ry = clamp((maxY - minY) * 0.42 + 10, 8, 34);
  const core = settings.theme === "light"
    ? `rgba(15,23,42,${clamp(0.08 + lighting.shadow * 0.2, 0.1, 0.22)})`
    : `rgba(0,0,0,${clamp(0.2 + lighting.shadow * 0.32, 0.25, 0.5)})`;
  const edge = settings.theme === "light" ? "rgba(15,23,42,0)" : "rgba(0,0,0,0)";
  const gradient = ctx.createRadialGradient(cx, cy, 2, cx, cy, Math.max(rx, ry));
  gradient.addColorStop(0, core);
  gradient.addColorStop(0.45, settings.theme === "light" ? `rgba(15,23,42,${clamp(0.035 + lighting.shadow * 0.08, 0.045, 0.1)})` : `rgba(0,0,0,${clamp(0.09 + lighting.shadow * 0.16, 0.12, 0.24)})`);
  gradient.addColorStop(1, edge);

  ctx.save();
  ctx.filter = budget.detailedEffects ? "blur(1.2px)" : "none";
  ctx.fillStyle = gradient;
  ctx.globalAlpha = budget.detailedEffects ? clamp(0.34 + lighting.shadow * 0.38, 0.4, 0.68) : clamp(0.24 + lighting.shadow * 0.26, 0.3, 0.48);
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();

  const stride = Math.max(2, Math.ceil(atoms.length / 46));
  ctx.fillStyle = settings.theme === "light" ? `rgba(15,23,42,${clamp(0.035 + lighting.shadow * 0.06, 0.045, 0.09)})` : `rgba(0,0,0,${clamp(0.1 + lighting.shadow * 0.14, 0.13, 0.25)})`;
  ctx.globalAlpha = budget.detailedEffects ? clamp(0.18 + lighting.shadow * 0.24, 0.22, 0.42) : clamp(0.14 + lighting.shadow * 0.16, 0.18, 0.28);
  atoms.forEach((atom, index) => {
    if (index % stride !== 0) return;
    ctx.beginPath();
    ctx.ellipse(atom.sx, atom.sy, atom.screenRadius * 0.22, Math.max(1.6, atom.screenRadius * 0.05), 0, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}

function drawLonePairCloud(ctx: CanvasRenderingContext2D, cloud: ProjectedLonePair, center: ProjectedAtom, settings: SimulationSettings, time: number, lighting: SceneLighting) {
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
  const lightDot = clamp(ux * lighting.screen.x + uy * lighting.screen.y, -1, 1);
  const lightX = bulbX + (lighting.screen.x * 0.45 - ux * 0.24) * r;
  const lightY = bulbY + (lighting.screen.y * 0.45 - uy * 0.24) * r;
  const gradient = ctx.createRadialGradient(lightX, lightY, 1, bulbX - lighting.screen.x * r * 0.12, bulbY - lighting.screen.y * r * 0.12, r * 1.46);
  gradient.addColorStop(0, hexToRgba(mixHex("#ffffff", lighting.color, lighting.power * 0.16), 0.78));
  gradient.addColorStop(0.26, hexToRgba(mixHex(bodyInner, lighting.color, lighting.power * 0.1), 0.84));
  gradient.addColorStop(0.72, hexToRgba(bodyOuter, 0.78));
  gradient.addColorStop(1, hexToRgba(mixHex(bodyEdge, "#1e1b4b", settings.theme === "light" ? 0.1 : 0.2), 0.44 + lighting.power * 0.08));

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.shadowColor = settings.theme === "light" ? hexToRgba(mixHex("#7c3aed", lighting.color, 0.16), 0.2 + lighting.power * 0.1) : hexToRgba(mixHex("#c4b5fd", lighting.color, 0.18), 0.22 + lighting.power * 0.12);
  ctx.shadowBlur = 4 + lighting.power * 4;
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

  ctx.globalAlpha = alpha * clamp(0.14 + lighting.rim * 0.42 + lightDot * 0.08, 0.08, 0.44);
  ctx.strokeStyle = hexToRgba(lighting.color, settings.theme === "light" ? 0.34 : 0.42);
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.moveTo(baseX - px * neckWidth * 0.42, baseY - py * neckWidth * 0.42);
  ctx.quadraticCurveTo(bulbX - lighting.screen.x * r * 0.2 - px * lobeWidth * 0.56, bulbY - lighting.screen.y * r * 0.2 - py * lobeWidth * 0.56, bulbX - px * lobeWidth * 0.48, bulbY - py * lobeWidth * 0.48);
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

function drawElectronRegionOverlay(ctx: CanvasRenderingContext2D, atoms: ProjectedAtom[], bonds: Bond[], settings: SimulationSettings, drawBondRegions = true) {
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
  if (!drawBondRegions) {
    ctx.restore();
    return;
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

function draw3DBond(ctx: CanvasRenderingContext2D, a: ProjectedAtom, b: ProjectedAtom, bond: Bond, settings: SimulationSettings, budget: RenderBudget, interaction: InteractionContext, lighting: SceneLighting) {
  const color = bondRenderColor(bond, settings);
  const segment = visibleBondSegment(a, b);
  if (!segment) return;
  const highlight = interaction.hoveredBondId === bond.id ? 1 : interaction.activeBondIds.has(bond.id) ? 0.58 : 0;
  const offsets = bond.order === 1 ? [0] : bond.order === 2 ? [-4, 4] : [-6, 0, 6];
  const depthAlpha = clamp(0.46 + ((a.depth + b.depth) / 2 + 2.8) * 0.15, 0.32, 1);
  const avgDepth = (a.depth + b.depth) / 2;
  const lineWidth = clamp((a.screenRadius + b.screenRadius) * 0.075 * (1 + avgDepth * 0.08 + lighting.power * 0.08) * (1 + highlight * 0.2), 2.6, 12.4);
  const nearer = a.depth >= b.depth ? a : b;
  const nearT = nearer.id === b.id ? 1 : 0;
  const focusAlpha = interaction.focusIds && !interaction.focusIds.has(a.id) && !interaction.focusIds.has(b.id) ? 0.13 : 1;
  const lightSide = clamp(segment.px * lighting.screen.x + segment.py * lighting.screen.y, -1, 1);
  const lightOffset = lightSide >= 0 ? 1 : -1;
  const highlightTint = mixHex(lighting.color, "#ffffff", 0.22);
  const highlightColor = hexToRgba(highlightTint, settings.theme === "light" ? 0.48 + lighting.power * 0.3 : 0.36 + lighting.power * 0.28);
  const shadeColor = settings.theme === "light" ? `rgba(15,23,42,${0.24 + lighting.power * 0.18})` : `rgba(0,0,0,${0.46 + lighting.power * 0.2})`;

  ctx.save();
  ctx.lineCap = "butt";
  ctx.shadowColor = mixHex(color, lighting.color, lighting.power * 0.32);
  ctx.shadowBlur = settings.visualStyle === "detailed" && budget.detailedEffects ? 3 + lighting.power * 11 + highlight * 10 : 0;
  for (const offset of offsets) {
    const startX = segment.startX + segment.px * offset;
    const startY = segment.startY + segment.py * offset;
    const endX = segment.endX + segment.px * offset;
    const endY = segment.endY + segment.py * offset;
    const midX = startX + (endX - startX) * (nearT ? 0.56 : 0.44);
    const midY = startY + (endY - startY) * (nearT ? 0.56 : 0.44);
    const nearX = nearT ? endX : startX;
    const nearY = nearT ? endY : startY;
    const tubeShadowX = -lighting.screen.x * 2.2 - segment.px * lightOffset * 1.2;
    const tubeShadowY = -lighting.screen.y * 2.2 - segment.py * lightOffset * 1.2;
    const tubeLightX = lighting.screen.x * 1.15 + segment.px * lightOffset * lineWidth * 0.12;
    const tubeLightY = lighting.screen.y * 1.15 + segment.py * lightOffset * lineWidth * 0.12;

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

    const tubeGradient = ctx.createLinearGradient(
      startX - segment.px * lineWidth * 0.58 * lightOffset,
      startY - segment.py * lineWidth * 0.58 * lightOffset,
      startX + segment.px * lineWidth * 0.58 * lightOffset,
      startY + segment.py * lineWidth * 0.58 * lightOffset
    );
    tubeGradient.addColorStop(0, settings.theme === "light" ? "rgba(15,23,42,0.42)" : "rgba(0,0,0,0.62)");
    tubeGradient.addColorStop(0.22, mixHex(color, settings.theme === "light" ? "#1f2937" : "#020617", 0.18));
    tubeGradient.addColorStop(0.54, color);
    tubeGradient.addColorStop(0.82, mixHex(color, highlightTint, 0.42 + lighting.power * 0.18));
    tubeGradient.addColorStop(1, hexToRgba(highlightTint, settings.theme === "light" ? 0.88 : 0.72));

    ctx.beginPath();
    ctx.moveTo(startX + tubeShadowX, startY + tubeShadowY);
    ctx.lineTo(endX + tubeShadowX, endY + tubeShadowY);
    ctx.strokeStyle = shadeColor;
    ctx.globalAlpha = depthAlpha * clamp(0.26 + lighting.power * 0.34, 0.28, 0.7) * focusAlpha;
    ctx.lineWidth = lineWidth + 2.4;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.strokeStyle = budget.detailedEffects ? tubeGradient : color;
    ctx.globalAlpha = clamp(depthAlpha + highlight * 0.2, 0.36, 1) * focusAlpha;
    ctx.lineWidth = lineWidth;
    ctx.stroke();

    if (budget.detailedEffects) {
      ctx.beginPath();
      ctx.moveTo(nearX + tubeLightX, nearY + tubeLightY);
      ctx.lineTo(midX + tubeLightX, midY + tubeLightY);
      ctx.strokeStyle = highlightColor;
      ctx.globalAlpha = clamp(depthAlpha * (0.36 + lighting.power * 0.5), 0.3, 1) * focusAlpha;
      ctx.lineCap = "round";
      ctx.lineWidth = Math.max(1.1, lineWidth * 0.32);
      ctx.stroke();
      ctx.lineCap = "butt";

      ctx.beginPath();
      ctx.moveTo(startX - tubeLightX * 0.42, startY - tubeLightY * 0.42);
      ctx.lineTo(endX - tubeLightX * 0.42, endY - tubeLightY * 0.42);
      ctx.strokeStyle = settings.theme === "light" ? "rgba(2,6,23,0.16)" : "rgba(0,0,0,0.28)";
      ctx.globalAlpha = clamp(depthAlpha * (0.16 + lighting.power * 0.22), 0.12, 0.38) * focusAlpha;
      ctx.lineWidth = Math.max(1, lineWidth * 0.18);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function bondRenderColor(bond: Bond, settings: SimulationSettings) {
  const colors = settings.theme === "light"
    ? { covalent: "#465569", polar: "#2563eb", ionic: "#c2410c" }
    : { covalent: "#d8e1df", polar: "#38bdf8", ionic: "#f59e0b" };
  return bond.kind === "ionic" ? colors.ionic : bond.kind === "polar-covalent" ? colors.polar : colors.covalent;
}

function buildSurfacePorts(atoms: ProjectedAtom[], bonds: Bond[], settings: SimulationSettings, interaction: InteractionContext, lighting: SceneLighting) {
  const ports = new Map<string, SurfacePort[]>();
  if (settings.displayMode === "skeleton" || settings.zoom < 0.72) return ports;
  const byId = new Map(atoms.map((atom) => [atom.id, atom]));

  for (const bond of bonds) {
    const a = byId.get(bond.a);
    const b = byId.get(bond.b);
    if (!a || !b) continue;
    const color = bondRenderColor(bond, settings);
    collectSurfacePorts(ports, atoms, a, b, bond, color, settings, interaction, lighting);
    collectSurfacePorts(ports, atoms, b, a, bond, color, settings, interaction, lighting);
  }
  return ports;
}

function collectSurfacePorts(
  ports: Map<string, SurfacePort[]>,
  atoms: ProjectedAtom[],
  atom: ProjectedAtom,
  other: ProjectedAtom,
  bond: Bond,
  color: string,
  settings: SimulationSettings,
  interaction: InteractionContext,
  lighting: SceneLighting
) {
  if (settings.displayMode === "simplified" && atom.symbol === "H") return;
  const dx = other.sx - atom.sx;
  const dy = other.sy - atom.sy;
  const length = Math.max(0.01, Math.hypot(dx, dy));
  const ux = dx / length;
  const uy = dy / length;
  const px = -uy;
  const py = ux;
  const lanes = bond.order === 1 ? [0] : bond.order === 2 ? [-1, 1] : [-1.45, 0, 1.45];
  const laneGap = clamp((atom.screenRadius + other.screenRadius) * 0.017, 1.5, 4.8);
  const depthDelta = other.depth - atom.depth;
  const frontFacing = clamp(0.55 + depthDelta * 0.36, 0, 1);
  const focusAlpha = interaction.focusIds && !interaction.focusIds.has(atom.id) ? 0.18 : 1;
  const active = interaction.activeBondIds.has(bond.id) || interaction.activeAtomIds.has(atom.id);
  const surfaceDepth = atom.depth + atom.screenRadius * 0.026 + clamp(depthDelta, -0.25, 0.6) * 0.22;

  for (const lane of lanes) {
    const laneOffset = lane * laneGap;
    const x = atom.sx + ux * atom.screenRadius * 0.9 + px * laneOffset;
    const y = atom.sy + uy * atom.screenRadius * 0.9 + py * laneOffset;
    if (!surfacePortIsVisible(atom, other, atoms, x, y, surfaceDepth)) continue;

    const lightFacing = clamp(0.46 + (ux * lighting.screen.x + uy * lighting.screen.y) * 0.28 + lighting.power * 0.22, 0.22, 1);
    const port: SurfacePort = {
      id: `${bond.id}:${atom.id}:${lane}`,
      x,
      y,
      rx: clamp(atom.screenRadius * 0.12 / Math.sqrt(lanes.length), 3.8, 9.4),
      ry: clamp(atom.screenRadius * 0.048 * (0.8 + frontFacing * 0.28), 1.7, 4.9),
      rotation: Math.atan2(py, px),
      color,
      alpha: clamp((0.28 + frontFacing * 0.56 + (active ? 0.12 : 0)) * focusAlpha, 0, 0.92),
      light: lightFacing
    };
    const existing = ports.get(atom.id) ?? [];
    existing.push(port);
    ports.set(atom.id, existing);
  }
}

function surfacePortIsVisible(endpoint: ProjectedAtom, other: ProjectedAtom, atoms: ProjectedAtom[], x: number, y: number, surfaceDepth: number) {
  if (other.depth < endpoint.depth - 0.16) return false;
  for (const atom of atoms) {
    if (atom.id === endpoint.id) continue;
    const coversPort = Math.hypot(x - atom.sx, y - atom.sy) < atom.screenRadius * 0.9;
    if (!coversPort) continue;
    const atomSurfaceDepth = atom.depth + atom.screenRadius * 0.028;
    if (atomSurfaceDepth >= surfaceDepth - 0.04) return false;
  }
  return true;
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
  const overlayOffset = clamp((a.screenRadius + b.screenRadius) * 0.36, 22, 38);
  const startX = (towardTarget === 1 ? segment.startX : segment.endX) + segment.px * overlayOffset;
  const startY = (towardTarget === 1 ? segment.startY : segment.endY) + segment.py * overlayOffset;
  const endX = (towardTarget === 1 ? segment.endX : segment.startX) + segment.px * overlayOffset;
  const endY = (towardTarget === 1 ? segment.endY : segment.startY) + segment.py * overlayOffset;
  const color = settings.theme === "light" ? "rgba(37,99,235,0.72)" : "rgba(56,189,248,0.78)";
  const strength = bond.kind === "ionic" ? 1.7 : clamp(bond.polarity, 0.2, 1.8);
  const active = interaction.activeBondIds.has(bond.id) && interaction.hoveredBondId !== bond.id;
  const lineWidth = clamp(0.95 + strength * 0.82 + (active ? 0.45 : 0), 1.1, 3.2);
  const alpha = clamp(0.22 + strength * 0.22 + (active ? 0.12 : 0), 0.28, 0.72);

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

function draw3DAtom(ctx: CanvasRenderingContext2D, atom: ProjectedAtom, settings: SimulationSettings, budget: RenderBudget, interaction: InteractionContext, ports: SurfacePort[], lighting: SceneLighting, overlayPass = false) {
  const data = atomData[atom.symbol];
  const r = atom.screenRadius;
  const light = lighting.screen;
  const selected = interaction.selectedAtomId === atom.id;
  const hovered = interaction.hoveredAtomId === atom.id;
  const central = interaction.centralAtomIds.has(atom.id);
  const active = interaction.activeAtomIds.has(atom.id);
  const muted = interaction.focusIds && !interaction.focusIds.has(atom.id);
  const emphasis = (selected ? 1 : 0) + (hovered ? 0.82 + interaction.longHover * 0.55 : 0) + (central ? 0.4 : 0) + (active ? 0.28 : 0);
  const lightX = atom.sx + r * light.x;
  const lightY = atom.sy + r * light.y;
  const lightPower = lighting.power;
  const lightTint = clamp(0.18 + lightPower * 0.34, 0.18, 0.52);
  const materialLift = settings.theme === "light" ? clamp(0.06 + (1 - lightPower) * 0.06, 0.06, 0.12) : clamp(0.04 + lightPower * 0.08, 0.04, 0.12);
  const litColor = mixHex(data.color, lighting.color, lightTint);
  const midColor = mixHex(data.color, settings.theme === "light" ? "#f8fafc" : "#dbeafe", materialLift);
  const rimColor = mixHex(data.color, settings.theme === "light" ? "#0f172a" : "#020617", clamp(0.2 + lightPower * 0.28, 0.2, 0.48));
  const gradient = ctx.createRadialGradient(lightX, lightY, Math.max(3, r * 0.18), atom.sx + r * 0.12, atom.sy + r * 0.16, r * 1.14);
  gradient.addColorStop(0, mixHex(lighting.color, "#ffffff", clamp(0.34 + lightPower * 0.42, 0.34, 0.78)));
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
    drawAtomRadialGlow(ctx, atom, data.glow, settings, depthAlpha, emphasis, lighting);
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
    rim.addColorStop(1, hexToRgba(lighting.color, settings.theme === "light" ? 0.08 + lightPower * 0.16 : 0.12 + lightPower * 0.22));
    ctx.fillStyle = rim;
    ctx.beginPath();
    ctx.arc(atom.sx, atom.sy, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = clamp(0.18 + lightPower * 0.44, 0.18, 0.62) * depthAlpha;
    ctx.fillStyle = hexToRgba(mixHex(lighting.color, "#ffffff", 0.18), settings.theme === "light" ? 0.82 : 0.64);
    ctx.beginPath();
    ctx.arc(lightX, lightY, clamp(r * (0.085 + lightPower * 0.035), 2.8, 9.5), 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = depthAlpha;
  }
  if (!overlayPass && ports.length && settings.visualStyle === "detailed") {
    drawSurfacePortsOnAtom(ctx, atom, ports, settings, lighting);
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

function drawSurfacePortsOnAtom(ctx: CanvasRenderingContext2D, atom: ProjectedAtom, ports: SurfacePort[], settings: SimulationSettings, lighting: SceneLighting) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(atom.sx, atom.sy, atom.screenRadius * 1.01, 0, Math.PI * 2);
  ctx.clip();

  for (const port of ports.sort((a, b) => a.alpha - b.alpha)) {
    if (port.alpha <= 0.02) continue;
    const socketGradient = ctx.createRadialGradient(
      port.x - lighting.screen.x * port.rx * 0.55,
      port.y - lighting.screen.y * port.rx * 0.55,
      1,
      port.x,
      port.y,
      port.rx * 1.42
    );
    const socketBase = mixHex(atomData[atom.symbol].color, port.color, 0.28);
    socketGradient.addColorStop(0, hexToRgba(mixHex("#ffffff", lighting.color, lighting.power * 0.18), 0.92));
    socketGradient.addColorStop(0.42, hexToRgba(mixHex(socketBase, "#ffffff", 0.26 + port.light * 0.18), 0.84));
    socketGradient.addColorStop(1, hexToRgba(mixHex(socketBase, "#020617", settings.theme === "light" ? 0.08 : 0.26), 0.58));

    ctx.globalAlpha = port.alpha;
    ctx.fillStyle = settings.theme === "light" ? "rgba(15,23,42,0.18)" : "rgba(0,0,0,0.34)";
    ctx.beginPath();
    ctx.ellipse(
      port.x - lighting.screen.x * port.rx * 0.24,
      port.y - lighting.screen.y * port.ry * 0.4,
      port.rx * 1.18,
      port.ry * 1.26,
      port.rotation,
      0,
      Math.PI * 2
    );
    ctx.fill();

    ctx.fillStyle = socketGradient;
    ctx.beginPath();
    ctx.ellipse(port.x, port.y, port.rx, port.ry, port.rotation, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = clamp(port.alpha + 0.12, 0, 0.98);
    ctx.strokeStyle = hexToRgba(port.color, settings.theme === "light" ? 0.64 : 0.72);
    ctx.lineWidth = clamp(port.rx * 0.18, 1.05, 1.8);
    ctx.beginPath();
    ctx.ellipse(port.x, port.y, port.rx * 0.96, port.ry * 0.94, port.rotation, 0, Math.PI * 2);
    ctx.stroke();

    ctx.globalAlpha = port.alpha * clamp(0.26 + lighting.specular * 0.5, 0.28, 0.68);
    ctx.fillStyle = hexToRgba(mixHex(lighting.color, "#ffffff", 0.55), settings.theme === "light" ? 0.78 : 0.62);
    ctx.beginPath();
    ctx.ellipse(
      port.x - lighting.screen.x * port.rx * 0.28,
      port.y - lighting.screen.y * port.ry * 0.34,
      Math.max(1.2, port.rx * 0.22),
      Math.max(0.8, port.ry * 0.22),
      port.rotation,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }
  ctx.restore();
}

function drawAtomRadialGlow(ctx: CanvasRenderingContext2D, atom: ProjectedAtom, glow: string, settings: SimulationSettings, alpha: number, emphasis: number, lighting: SceneLighting) {
  const r = atom.screenRadius;
  const lightPower = lighting.power;
  const glowColor = mixHex(glow, lighting.color, clamp(0.12 + lightPower * 0.22, 0.12, 0.34));
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

function sceneLighting(settings: SimulationSettings): SceneLighting {
  const vector = lightVector(settings);
  const screenLength = Math.max(0.001, Math.hypot(vector.x, vector.y));
  const power = clamp((clamp(settings.lightIntensity, 0.25, 1.8) - 0.25) / 1.55, 0, 1);
  return {
    vector,
    screen: { x: vector.x / screenLength, y: vector.y / screenLength },
    color: settings.lightColor,
    intensity: clamp(settings.lightIntensity, 0.25, 1.8),
    power,
    ambient: settings.theme === "light" ? 0.58 - power * 0.1 : 0.32 + power * 0.08,
    diffuse: 0.38 + power * 0.52,
    specular: 0.22 + power * 0.58,
    rim: 0.18 + power * 0.36,
    shadow: settings.theme === "light" ? 0.24 + power * 0.58 : 0.42 + power * 0.5
  };
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

function draw3DLightSource(ctx: CanvasRenderingContext2D, lighting: SceneLighting, settings: SimulationSettings, width: number) {
  if (settings.displayMode === "skeleton" || settings.visualStyle !== "detailed") return;
  const x = clamp(width * 0.5 + lighting.screen.x * width * 0.32, 96, width - 96);
  const y = 76 + lighting.screen.y * 34;
  const glow = ctx.createRadialGradient(x, y, 2, x, y, 44 + lighting.power * 18);
  glow.addColorStop(0, hexToRgba(mixHex(lighting.color, "#ffffff", 0.65), 0.18 + lighting.power * 0.2));
  glow.addColorStop(0.38, hexToRgba(lighting.color, 0.08 + lighting.power * 0.1));
  glow.addColorStop(1, hexToRgba(lighting.color, 0));

  ctx.save();
  ctx.globalAlpha = settings.theme === "light" ? 0.8 : 0.62;
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, y, 58 + lighting.power * 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = hexToRgba(mixHex(lighting.color, "#ffffff", 0.72), 0.42 + lighting.power * 0.18);
  ctx.beginPath();
  ctx.arc(x, y, 3.5 + lighting.power * 1.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
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
  const { r, g, b } = parseHex(hex);
  return `rgba(${r},${g},${b},${alpha})`;
}

function mixHex(a: string, b: string, amount: number) {
  const ca = parseHex(a);
  const cb = parseHex(b);
  const mix = (left: number, right: number) => Math.round(left * (1 - amount) + right * amount);
  return `rgb(${mix(ca.r, cb.r)},${mix(ca.g, cb.g)},${mix(ca.b, cb.b)})`;
}

function rgbUnit(color: string) {
  const parsed = parseHex(color);
  return { r: parsed.r / 255, g: parsed.g / 255, b: parsed.b / 255 };
}

function mixRgb(a: { r: number; g: number; b: number }, b: { r: number; g: number; b: number }, amount: number) {
  return {
    r: a.r * (1 - amount) + b.r * amount,
    g: a.g * (1 - amount) + b.g * amount,
    b: a.b * (1 - amount) + b.b * amount
  };
}

function parseHex(hex: string) {
  const rgb = hex.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (rgb) return { r: Number(rgb[1]), g: Number(rgb[2]), b: Number(rgb[3]) };
  const clean = hex.replace("#", "");
  const value = Number.parseInt(clean.length === 3 ? clean.split("").map((item) => item + item).join("") : clean, 16);
  return { r: (value >> 16) & 255, g: (value >> 8) & 255, b: value & 255 };
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
