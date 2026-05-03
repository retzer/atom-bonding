import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from "react";
import { atomData } from "../data/atoms.js";
import { periodicElements } from "../data/periodicTable.js";
import { bondKindLabel } from "../simulation/chemistry.js";
import { detectFunctionalGroups } from "../simulation/functionalGroups.js";
const devicePixelRatioSafe = (quality) => Math.min(window.devicePixelRatio || 1, graphicsQualityProfile(quality).dprCap);
const lightDirection = { x: -0.44, y: -0.5 };
const originCamera = { x: 0, y: 0 };
import { LessonOverlay } from "./LessonOverlay.js";
export function SimulationCanvas({ state, settings, width, height, onResize, onSelectAtom, onSelectBond, onMoveAtom, onZoom, onCameraPreset, onToggle3D, onFlingAtom, lessonAnnotations, highlightedAtomIds, highlightedBondIds, lessonStepText, lessonStepIndex, lessonTotalSteps, animParts, revealedCount }) {
    const canvasRef = useRef(null);
    const wrapRef = useRef(null);
    const [dragging, setDragging] = useState(null);
    const [panning, setPanning] = useState(false);
    const [camera, setCamera] = useState(originCamera);
    const [hoveredBondId, setHoveredBondId] = useState(null);
    const lastDragPoint = useRef(null);
    const lastPanPoint = useRef(null);
    const lessonActive = Boolean(lessonAnnotations.length || animParts?.length);
    const displayState = displayStateFor2D(state, settings);
    const focusCamera = focusCamera2D(displayState, width, height, settings);
    const presetCamera = settings.geometry3D || lessonActive || focusCamera ? null : presetCamera2D(displayState, width, height, settings);
    const activeCamera = settings.geometry3D || lessonActive ? originCamera : focusCamera ?? presetCamera ?? camera;
    useEffect(() => {
        if (!wrapRef.current)
            return;
        const observer = new ResizeObserver(([entry]) => {
            const box = entry.contentRect;
            onResize(box.width, box.height);
        });
        observer.observe(wrapRef.current);
        return () => observer.disconnect();
    }, [onResize]);
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas)
            return;
        const dpr = devicePixelRatioSafe(settings.graphicsQuality);
        canvas.width = Math.floor(width * dpr);
        canvas.height = Math.floor(height * dpr);
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        const ctx = canvas.getContext("2d");
        if (!ctx)
            return;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        draw(ctx, state, settings, width, height, hoveredBondId, highlightedAtomIds, highlightedBondIds, activeCamera);
    }, [height, hoveredBondId, settings, state, width, highlightedAtomIds, highlightedBondIds, activeCamera]);
    const pointerScreenPoint = (event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        return {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
        };
    };
    const pointerPoint = (event) => {
        const point = pointerScreenPoint(event);
        return screenToWorld(point.x, point.y, width, height, settings.zoom, activeCamera);
    };
    const onPointerDown = (event) => {
        const point = pointerPoint(event);
        const atom = nearestAtom(displayState.atoms, point.x, point.y);
        if (atom) {
            setDragging(atom.id);
            onSelectAtom(atom.id);
            lastDragPoint.current = { x: point.x, y: point.y, time: Date.now() };
            event.currentTarget.setPointerCapture(event.pointerId);
            return;
        }
        const bond = nearestBond(displayState.bonds, displayState.atoms, point.x, point.y);
        if (bond) {
            onSelectBond(bond.id);
            return;
        }
        onSelectAtom(null);
        onSelectBond(null);
        if (!settings.geometry3D && !lessonActive && !settings.focusMode) {
            setPanning(true);
            lastPanPoint.current = pointerScreenPoint(event);
            event.currentTarget.setPointerCapture(event.pointerId);
        }
    };
    const onPointerMove = (event) => {
        if (panning && lastPanPoint.current) {
            const screen = pointerScreenPoint(event);
            const dx = (screen.x - lastPanPoint.current.x) / settings.zoom;
            const dy = (screen.y - lastPanPoint.current.y) / settings.zoom;
            setCamera((current) => ({ x: current.x + dx, y: current.y + dy }));
            lastPanPoint.current = screen;
            return;
        }
        const point = pointerPoint(event);
        if (!dragging) {
            setHoveredBondId(nearestBond(displayState.bonds, displayState.atoms, point.x, point.y)?.id ?? null);
            return;
        }
        lastDragPoint.current = { x: point.x, y: point.y, time: Date.now() };
        onMoveAtom(dragging, point.x, point.y);
    };
    const onPointerUp = (event) => {
        if (dragging && onFlingAtom && lastDragPoint.current) {
            const elapsed = Math.max(16, Date.now() - lastDragPoint.current.time);
            const screenToWorldScale = 1 / settings.zoom;
            const vx = (lastDragPoint.current.x - (state.atoms.find((a) => a.id === dragging)?.x ?? lastDragPoint.current.x)) * screenToWorldScale * 60 / elapsed;
            const vy = (lastDragPoint.current.y - (state.atoms.find((a) => a.id === dragging)?.y ?? lastDragPoint.current.y)) * screenToWorldScale * 60 / elapsed;
            const speed = Math.hypot(vx, vy);
            if (speed > 20) {
                onFlingAtom(dragging, vx * 0.35, vy * 0.35);
            }
        }
        setDragging(null);
        setPanning(false);
        lastDragPoint.current = null;
        lastPanPoint.current = null;
        try {
            event.currentTarget.releasePointerCapture(event.pointerId);
        }
        catch {
            // Pointer capture may already be released by the browser.
        }
    };
    const setZoom = (zoom) => {
        onZoom(clamp(zoom, 0.55, 2.2));
    };
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas)
            return;
        const handleWheel = (event) => {
            event.preventDefault();
            const direction = event.deltaY > 0 ? -0.08 : 0.08;
            setZoom(settings.zoom + direction);
        };
        canvas.addEventListener("wheel", handleWheel, { passive: false });
        return () => canvas.removeEventListener("wheel", handleWheel);
    }, [settings.zoom]);
    return (_jsxs("div", { className: "simulation-wrap", ref: wrapRef, children: [_jsx("canvas", { ref: canvasRef, className: "simulation-canvas", "aria-label": "Interactive atom bonding simulation", onPointerDown: onPointerDown, onPointerMove: onPointerMove, onPointerUp: onPointerUp, onPointerCancel: onPointerUp, onPointerLeave: () => setHoveredBondId(null) }), _jsx(LessonOverlay, { annotations: lessonAnnotations, animParts: animParts, revealedCount: revealedCount, stepText: lessonStepText, stepIndex: lessonStepIndex, totalSteps: lessonTotalSteps, atoms: state.atoms.map((a, i) => ({ ...a, index: i })), bonds: state.bonds, width: width, height: height, theme: settings.theme, zoom: settings.zoom }), !settings.geometry3D && !lessonActive && (_jsx("div", { className: "viewport-camera-settings", "aria-label": "2D camera settings", children: [
                    ["free", "Free", "Keep the current 2D camera position."],
                    ["top", "Origin", "Snap the 2D camera to the coordinate origin."],
                    ["side", "Center", "Center the 2D camera on the current atoms."],
                    ["isometric", "Overview", "Use an overview-style 2D camera centered on the scene."]
                ].map(([preset, label, title]) => (_jsx("button", { className: settings.cameraPreset === preset ? "active" : "", title: title, onClick: () => onCameraPreset(preset), children: label }, preset))) })), _jsxs("div", { className: "canvas-readout", children: [_jsxs("span", { children: [state.atoms.length, " atoms"] }), _jsxs("span", { children: [state.bonds.length, " bonds"] }), _jsx("span", { children: settings.geometry3D ? "VSEPR 3D" : state.metallicLattice ? "metal lattice" : "particle space" }), !settings.geometry3D && !lessonActive && _jsxs("span", { children: ["x ", Math.round(-activeCamera.x), " y ", Math.round(-activeCamera.y)] })] }), state.atoms.length === 0 && (!lessonAnnotations.length && !animParts?.length) && (_jsxs("div", { className: "empty-canvas-hint", children: [_jsx("strong", { children: "Empty simulation space" }), _jsx("span", { children: "Click any element in the periodic table or controls to add an atom instantly." })] }))] }));
}
function graphicsQualityProfile(quality) {
    if (quality === "low")
        return { dprCap: 1 };
    if (quality === "medium")
        return { dprCap: 1.35 };
    if (quality === "very-high")
        return { dprCap: 2.25 };
    return { dprCap: 1.8 };
}
function draw(ctx, state, settings, width, height, hoveredBondId, highlightedAtomIds = [], highlightedBondIds = [], camera = originCamera) {
    ctx.clearRect(0, 0, width, height);
    drawBackground(ctx, settings, width, height);
    if (state.metallicLattice && settings.visualStyle === "detailed")
        drawMetalElectronCloud(ctx, state, width, height, settings.zoom, camera);
    const renderState = settings.geometry3D ? projectedState(state) : displayStateFor2D(state, settings);
    const detailLevel = detailLevelFor2D(settings);
    const showChemistryDetail = settings.analysisMode === "chemistry" && detailLevel === "detail";
    const focusedIds = focusAtomIds2D(renderState, settings);
    ctx.save();
    applyCamera(ctx, width, height, settings.zoom, camera);
    if (!settings.geometry3D)
        drawCoordinateSystem(ctx, width, height, settings, camera);
    drawMoleculeShadow(ctx, renderState, settings, width, height);
    const visibleBonds = depthSortedBonds(renderState).filter((bond) => bondVisibleInMode2D(bond, renderState, settings));
    const visibleAtoms = depthSortedAtoms(renderState).filter((atom) => atomVisibleInMode2D(atom, settings));
    const dimmedBonds = focusedIds ? visibleBonds.filter((bond) => !bondFocused2D(bond, renderState, focusedIds)) : [];
    const focusedBonds = focusedIds ? visibleBonds.filter((bond) => bondFocused2D(bond, renderState, focusedIds)) : visibleBonds;
    const dimmedAtoms = focusedIds ? visibleAtoms.filter((atom) => !focusedIds.has(atom.id)) : [];
    const focusedAtoms = focusedIds ? visibleAtoms.filter((atom) => focusedIds.has(atom.id)) : visibleAtoms;
    if (shouldShowFunctionalGroups2D(settings, detailLevel))
        drawFunctionalGroupHighlights2D(ctx, renderState, settings, detailLevel);
    for (const hBond of renderState.hydrogenBonds)
        drawHydrogenBond(ctx, renderState, hBond, settings);
    for (const bond of dimmedBonds)
        drawBond(ctx, renderState, bond, settings, 0.18);
    for (const bond of focusedBonds)
        drawBond(ctx, renderState, bond, settings);
    if (settings.showBondTypes && detailLevel !== "abstract") {
        for (const bond of dimmedBonds)
            drawBondTypeLabel(ctx, renderState, bond, settings, 0.16);
        for (const bond of focusedBonds)
            drawBondTypeLabel(ctx, renderState, bond, settings);
    }
    if (showChemistryDetail && settings.showElectronFlow)
        drawElectronFlow(ctx, renderState, settings, focusedIds);
    for (const electron of renderState.metallicElectrons)
        drawFreeElectron(ctx, electron.x, electron.y, settings);
    for (const effect of renderState.effects)
        drawEffect(ctx, renderState, effect, settings);
    for (const atom of dimmedAtoms)
        drawAtom(ctx, atom, renderState, settings, highlightedAtomIds, 0.2);
    for (const atom of focusedAtoms)
        drawAtom(ctx, atom, renderState, settings, highlightedAtomIds);
    if (settings.geometry3D) {
        for (const atom of frontBondedAtoms(renderState).filter((atom) => atomVisibleInMode2D(atom, settings)))
            drawAtom(ctx, atom, renderState, settings, highlightedAtomIds);
    }
    if (showChemistryDetail && settings.showNetDipole)
        drawNetDipole(ctx, renderState, settings);
    if (showChemistryDetail)
        drawBondAngleBadge(ctx, renderState, hoveredBondId ?? renderState.selectedBondId, settings);
    ctx.restore();
}
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const periodicElementBySymbol = new Map(periodicElements.map((element) => [element.symbol, element]));
function detailLevelFor2D(settings) {
    if (settings.analysisMode === "structure") {
        if (settings.zoom < 0.95)
            return "abstract";
        if (settings.zoom < 1.45)
            return "structure";
        return "detail";
    }
    if (settings.zoom < 0.75)
        return "abstract";
    if (settings.zoom < 1.12)
        return "structure";
    return "detail";
}
function shouldShowFunctionalGroups2D(settings, detailLevel) {
    return settings.showFunctionalGroups || settings.analysisMode === "structure" && detailLevel !== "detail";
}
function projectedState(state) {
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
function displayStateFor2D(state, settings) {
    const scale = clamp(settings.expansionScale2D, 1, 3.2);
    if (settings.geometry3D || scale <= 1.01 || state.atoms.length < 2)
        return state;
    const cx = state.atoms.reduce((sum, atom) => sum + atom.x, 0) / state.atoms.length;
    const cy = state.atoms.reduce((sum, atom) => sum + atom.y, 0) / state.atoms.length;
    return {
        ...state,
        atoms: state.atoms.map((atom) => ({
            ...atom,
            x: cx + (atom.x - cx) * scale,
            y: cy + (atom.y - cy) * scale,
            radius: atom.radius * 0.96
        })),
        metallicElectrons: state.metallicElectrons.map((electron) => ({
            ...electron,
            x: cx + (electron.x - cx) * scale,
            y: cy + (electron.y - cy) * scale
        }))
    };
}
function focusCamera2D(state, width, height, settings) {
    if (settings.geometry3D || !settings.focusMode || !state.selectedAtomId)
        return null;
    const selected = state.atoms.find((atom) => atom.id === state.selectedAtomId);
    if (!selected)
        return null;
    return { x: width / 2 - selected.x, y: height / 2 - selected.y };
}
function presetCamera2D(state, width, height, settings) {
    if (settings.cameraPreset === "free")
        return null;
    if (settings.cameraPreset === "top" || !state.atoms.length)
        return originCamera;
    const bounds = moleculeBounds2D(state);
    const centerCamera = { x: width / 2 - bounds.cx, y: height / 2 - bounds.cy };
    if (settings.cameraPreset === "side")
        return centerCamera;
    return {
        x: centerCamera.x,
        y: centerCamera.y - Math.min(120, Math.max(28, bounds.height * 0.08))
    };
}
function moleculeBounds2D(state) {
    const xs = state.atoms.map((atom) => atom.x);
    const ys = state.atoms.map((atom) => atom.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    return {
        minX,
        maxX,
        minY,
        maxY,
        width: maxX - minX,
        height: maxY - minY,
        cx: (minX + maxX) / 2,
        cy: (minY + maxY) / 2
    };
}
function focusAtomIds2D(state, settings) {
    if (settings.geometry3D || !settings.focusMode || !state.selectedAtomId || !state.atoms.some((atom) => atom.id === state.selectedAtomId))
        return null;
    const ids = new Set([state.selectedAtomId]);
    for (const bond of state.bonds) {
        if (bond.kind === "hydrogen" || bond.kind === "dispersion")
            continue;
        if (bond.a === state.selectedAtomId)
            ids.add(bond.b);
        if (bond.b === state.selectedAtomId)
            ids.add(bond.a);
    }
    return ids;
}
function depthSortedAtoms(state) {
    return [...state.atoms].sort((a, b) => (a.z ?? 0) - (b.z ?? 0));
}
function depthSortedBonds(state) {
    const zFor = (id) => state.atoms.find((atom) => atom.id === id)?.z ?? 0;
    return [...state.bonds].sort((a, b) => (zFor(a.a) + zFor(a.b)) - (zFor(b.a) + zFor(b.b)));
}
function atomVisibleInMode2D(atom, settings) {
    const detailLevel = detailLevelFor2D(settings);
    if (settings.displayMode === "skeleton")
        return false;
    if (settings.displayMode === "simplified" && atom.symbol === "H")
        return false;
    if (detailLevel === "abstract" && atom.symbol === "H")
        return false;
    if (settings.analysisMode === "structure" && detailLevel !== "detail" && atom.symbol === "H")
        return false;
    return true;
}
function bondVisibleInMode2D(bond, state, settings) {
    const detailLevel = detailLevelFor2D(settings);
    const a = state.atoms.find((atom) => atom.id === bond.a);
    const b = state.atoms.find((atom) => atom.id === bond.b);
    if (!a || !b)
        return false;
    if (settings.displayMode === "skeleton")
        return true;
    if (detailLevel === "abstract" || settings.analysisMode === "structure" && detailLevel !== "detail")
        return a.symbol !== "H" && b.symbol !== "H";
    if (settings.displayMode === "full")
        return true;
    return a.symbol !== "H" && b.symbol !== "H";
}
function bondFocused2D(bond, state, focusedIds) {
    const a = state.atoms.find((atom) => atom.id === bond.a);
    const b = state.atoms.find((atom) => atom.id === bond.b);
    return Boolean(a && b && focusedIds.has(a.id) && focusedIds.has(b.id));
}
function shouldShowAtomLabel2D(atom, state, settings) {
    const detailLevel = detailLevelFor2D(settings);
    if (!settings.showLabels || !settings.showElementNames2D || settings.displayMode === "skeleton")
        return false;
    if (settings.atomicModel2D === "spdf")
        return false;
    if (state.selectedAtomId === atom.id)
        return true;
    if (settings.analysisMode === "structure" && detailLevel !== "detail")
        return atom.symbol !== "H" && atom.radius > 22;
    if (detailLevel === "abstract")
        return atom.symbol !== "H" && atom.radius > 22;
    if (detailLevel === "structure")
        return atom.symbol !== "H";
    if (settings.displayMode === "simplified" && atom.symbol === "H")
        return false;
    if (settings.zoom < 0.8)
        return atom.symbol !== "H" && atom.radius > 22;
    if (settings.zoom < 1.15)
        return atom.symbol !== "H";
    return true;
}
function drawMoleculeShadow(ctx, state, settings, width, height) {
    if (!settings.geometry3D || !state.atoms.length || !isDetailed(settings))
        return;
    const atomById = new Map(state.atoms.map((atom) => [atom.id, atom]));
    const floorY = height * 0.9;
    const cast = (x, y, z = 0) => {
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
        if (!a || !b)
            continue;
        const segment = visibleBondSegment(a, b);
        if (!segment)
            continue;
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
function drawAggregateMoleculeShadow(ctx, atoms, cast, settings) {
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
        if (index % stride !== 0)
            return;
        ctx.beginPath();
        ctx.ellipse(point.x, point.y, atom.radius * 0.22, Math.max(1.8, atom.radius * 0.055), 0, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.restore();
}
function drawFunctionalGroupHighlights2D(ctx, state, settings, detailLevel) {
    if (!state.atoms.length || settings.displayMode === "skeleton")
        return;
    const atomById = new Map(state.atoms.map((atom) => [atom.id, atom]));
    const groups = detectFunctionalGroups(state.atoms, state.bonds);
    if (!groups.length)
        return;
    const abstract = detailLevel === "abstract" || settings.analysisMode === "structure";
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (const group of groups) {
        const pts = group.atomIds.map((id) => atomById.get(id)).filter((atom) => Boolean(atom));
        if (!pts.length)
            continue;
        const cx = pts.reduce((sum, atom) => sum + atom.x, 0) / pts.length;
        const cy = pts.reduce((sum, atom) => sum + atom.y, 0) / pts.length;
        const radius = clamp(Math.max(...pts.map((atom) => Math.hypot(atom.x - cx, atom.y - cy) + atom.radius * 0.9)), abstract ? 34 : 28, group.kind === "aromatic" ? 150 : 105);
        ctx.globalAlpha = settings.theme === "light" ? abstract ? 0.18 : 0.12 : abstract ? 0.26 : 0.2;
        ctx.fillStyle = group.color;
        ctx.beginPath();
        ctx.ellipse(cx, cy, radius * (group.kind === "aromatic" ? 1.16 : 1.06), radius * (group.kind === "aromatic" ? 0.82 : 0.72), -0.18, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = settings.theme === "light" ? abstract ? 0.6 : 0.38 : abstract ? 0.72 : 0.5;
        ctx.strokeStyle = group.color;
        ctx.lineWidth = abstract ? 2.4 : 1.4;
        ctx.setLineDash(group.kind === "aromatic" ? [3, 4] : [6, 6]);
        ctx.stroke();
        ctx.setLineDash([]);
        if (settings.zoom >= 0.72 || abstract) {
            ctx.globalAlpha = settings.theme === "light" ? 0.88 : 0.94;
            ctx.font = `${abstract ? 900 : 800} ${abstract ? 12 : 11}px Inter, system-ui`;
            ctx.lineJoin = "round";
            ctx.strokeStyle = settings.theme === "light" ? "rgba(248,251,255,0.9)" : "rgba(2,6,23,0.72)";
            ctx.lineWidth = 4;
            ctx.strokeText(group.label, cx, cy - radius * 0.84);
            ctx.fillStyle = group.color;
            ctx.fillText(group.label, cx, cy - radius * 0.84);
        }
    }
    ctx.restore();
}
function frontBondedAtoms(state) {
    const byId = new Map(state.atoms.map((atom) => [atom.id, atom]));
    const front = new Map();
    for (const bond of state.bonds) {
        const a = byId.get(bond.a);
        const b = byId.get(bond.b);
        if (!a || !b)
            continue;
        const smaller = a.radius <= b.radius ? a : b;
        const larger = smaller.id === a.id ? b : a;
        const distance = Math.hypot(smaller.x - larger.x, smaller.y - larger.y);
        const overlap = smaller.radius + larger.radius - distance;
        if (overlap <= smaller.radius * 0.08)
            continue;
        if ((smaller.z ?? 0) < (larger.z ?? 0) - 160)
            continue;
        front.set(smaller.id, smaller);
    }
    return [...front.values()].sort((a, b) => (a.z ?? 0) - (b.z ?? 0));
}
function applyCamera(ctx, width, height, zoom, camera) {
    ctx.translate(width / 2, height / 2);
    ctx.scale(zoom, zoom);
    ctx.translate(-width / 2 + camera.x, -height / 2 + camera.y);
}
function screenToWorld(screenX, screenY, width, height, zoom, camera = originCamera) {
    return {
        x: width / 2 + (screenX - width / 2) / zoom - camera.x,
        y: height / 2 + (screenY - height / 2) / zoom - camera.y
    };
}
function worldToScreen(worldX, worldY, width, height, zoom, camera = originCamera) {
    return {
        x: width / 2 + (worldX - width / 2 + camera.x) * zoom,
        y: height / 2 + (worldY - height / 2 + camera.y) * zoom
    };
}
function isDetailed(settings) {
    return settings.graphicsQuality !== "low" && settings.visualStyle === "detailed" && (settings.analysisMode === "chemistry" || detailLevelFor2D(settings) === "detail");
}
function palette(settings) {
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
        shell: light ? "rgb(59,130,246)" : "rgb(147,197,253)",
        covalent: light ? "#334155" : "#e5e7eb",
        polar: light ? "#2563eb" : "#38bdf8",
        ionic: light ? "#c2410c" : "#f59e0b",
        metallic: light ? "rgba(161,98,7,0.34)" : "rgba(251,191,36,0.2)",
        electron: settings.electronColor2D,
        freeElectron: light ? "#0284c7" : "#67e8f9",
        negative: light ? "#2563eb" : "#38bdf8",
        positive: light ? "#dc2626" : "#fb7185"
    };
}
function drawCoordinateSystem(ctx, width, height, settings, camera) {
    const colors = palette(settings);
    const topLeft = screenToWorld(0, 0, width, height, settings.zoom, camera);
    const bottomRight = screenToWorld(width, height, width, height, settings.zoom, camera);
    const originX = width / 2;
    const originY = height / 2;
    const minor = 50;
    const major = 200;
    const minRelX = topLeft.x - originX;
    const maxRelX = bottomRight.x - originX;
    const minRelY = topLeft.y - originY;
    const maxRelY = bottomRight.y - originY;
    const startX = Math.floor(minRelX / minor) * minor;
    const endX = Math.ceil(maxRelX / minor) * minor;
    const startY = Math.floor(minRelY / minor) * minor;
    const endY = Math.ceil(maxRelY / minor) * minor;
    ctx.save();
    ctx.lineWidth = 1 / settings.zoom;
    ctx.font = `${11 / settings.zoom}px Inter, system-ui`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    for (let relX = startX; relX <= endX; relX += minor) {
        const worldX = originX + relX;
        const majorLine = relX % major === 0;
        ctx.globalAlpha = relX === 0 ? 0.55 : majorLine ? 0.18 : 0.08;
        ctx.strokeStyle = relX === 0 ? colors.freeElectron : colors.grid;
        ctx.beginPath();
        ctx.moveTo(worldX, topLeft.y);
        ctx.lineTo(worldX, bottomRight.y);
        ctx.stroke();
        if (majorLine && relX !== 0) {
            ctx.globalAlpha = 0.48;
            ctx.fillStyle = colors.label;
            ctx.fillText(String(relX), worldX, originY + 7 / settings.zoom);
        }
    }
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    for (let relY = startY; relY <= endY; relY += minor) {
        const worldY = originY + relY;
        const majorLine = relY % major === 0;
        ctx.globalAlpha = relY === 0 ? 0.55 : majorLine ? 0.18 : 0.08;
        ctx.strokeStyle = relY === 0 ? colors.freeElectron : colors.grid;
        ctx.beginPath();
        ctx.moveTo(topLeft.x, worldY);
        ctx.lineTo(bottomRight.x, worldY);
        ctx.stroke();
        if (majorLine && relY !== 0) {
            ctx.globalAlpha = 0.48;
            ctx.fillStyle = colors.label;
            ctx.fillText(String(-relY), originX + 8 / settings.zoom, worldY);
        }
    }
    ctx.globalAlpha = 0.78;
    ctx.fillStyle = colors.freeElectron;
    ctx.beginPath();
    ctx.arc(originX, originY, 3.5 / settings.zoom, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}
function drawBackground(ctx, settings, width, height) {
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
function drawFadingFloor(ctx, settings, width, height) {
    const horizon = height * 0.38;
    const floor = ctx.createLinearGradient(0, horizon, 0, height);
    if (settings.theme === "light") {
        floor.addColorStop(0, "rgba(226,239,235,0)");
        floor.addColorStop(0.36, "rgba(218,232,228,0.22)");
        floor.addColorStop(1, "rgba(209,226,221,0.42)");
    }
    else {
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
function drawBond(ctx, state, bond, settings, alpha = 1) {
    const a = state.atoms.find((atom) => atom.id === bond.a);
    const b = state.atoms.find((atom) => atom.id === bond.b);
    if (!a || !b)
        return;
    const segment = visibleBondSegment(a, b);
    if (!segment)
        return;
    const colors = palette(settings);
    const color = bond.kind === "ionic" ? colors.ionic : bond.kind === "metallic" ? colors.metallic : bond.kind === "polar-covalent" ? colors.polar : colors.covalent;
    const offsets = bond.kind === "metallic" ? [0] : bond.order === 1 ? [0] : bond.order === 2 ? [-5, 5] : [-8, 0, 8];
    const depth = settings.geometry3D ? clamp(1 + (((a.z ?? 0) + (b.z ?? 0)) / 2) / 520, 0.68, 1.28) : 1;
    const depthAlpha = settings.geometry3D ? clamp(0.58 + (((a.z ?? 0) + (b.z ?? 0)) / 2 + 260) / 720, 0.46, 1) : 1;
    const chemistryDetail = settings.analysisMode === "chemistry" && detailLevelFor2D(settings) === "detail";
    ctx.save();
    ctx.lineCap = "round";
    ctx.shadowColor = color;
    ctx.shadowBlur = settings.geometry3D && isDetailed(settings) && bond.kind !== "metallic" ? 6 : 0;
    for (const offset of offsets) {
        ctx.beginPath();
        ctx.moveTo(segment.startX + segment.px * offset, segment.startY + segment.py * offset);
        ctx.lineTo(segment.endX + segment.px * offset, segment.endY + segment.py * offset);
        ctx.strokeStyle = color;
        ctx.globalAlpha = depthAlpha * alpha;
        ctx.lineWidth = (bond.kind === "metallic" ? 1 : 3.4) * depth;
        if (bond.kind === "ionic")
            ctx.setLineDash([7, 7]);
        ctx.stroke();
        ctx.setLineDash([]);
    }
    ctx.globalAlpha = alpha;
    if (chemistryDetail && bond.kind !== "metallic") {
        drawSharedElectrons(ctx, a, b, bond, settings);
    }
    if (chemistryDetail && settings.showBondDipoles && (bond.kind === "polar-covalent" || bond.kind === "ionic") && bond.electronShift) {
        drawDipoleIndicator(ctx, a, b, bond, segment, settings);
    }
    ctx.restore();
}
function drawBondTypeLabel(ctx, state, bond, settings, alpha = 1) {
    const a = state.atoms.find((atom) => atom.id === bond.a);
    const b = state.atoms.find((atom) => atom.id === bond.b);
    if (!a || !b)
        return;
    const segment = visibleBondSegment(a, b);
    if (!segment)
        return;
    const label = bondKindLabel[bond.kind].toUpperCase();
    const zoom = Math.max(settings.zoom, 0.45);
    const fontSize = 7.5 / zoom;
    const padX = 5 / zoom;
    const padY = 3 / zoom;
    const offset = (bond.order && bond.order > 1 ? 18 : 14) / zoom;
    const mx = (segment.startX + segment.endX) / 2 + segment.px * offset;
    const my = (segment.startY + segment.endY) / 2 + segment.py * offset;
    const colors = palette(settings);
    ctx.save();
    ctx.globalAlpha = clamp(alpha, 0.08, 1);
    ctx.font = `900 ${fontSize}px Inter, system-ui`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const width = ctx.measureText(label).width + padX * 2;
    const height = fontSize + padY * 2;
    ctx.fillStyle = settings.theme === "light" ? "rgba(255,255,255,0.82)" : "rgba(7,12,11,0.72)";
    ctx.strokeStyle = settings.theme === "light" ? "rgba(24,34,30,0.14)" : "rgba(255,255,255,0.12)";
    ctx.lineWidth = 1 / zoom;
    roundRect(ctx, mx - width / 2, my - height / 2, width, height, 5 / zoom);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = bond.kind === "ionic"
        ? colors.ionic
        : bond.kind === "metallic"
            ? colors.metallic
            : bond.kind === "polar-covalent"
                ? colors.polar
                : colors.label;
    ctx.fillText(label, mx, my + 0.2 / zoom);
    ctx.restore();
}
function drawElectronFlow(ctx, state, settings, focusedIds = null) {
    const atomById = new Map(state.atoms.map((atom) => [atom.id, atom]));
    ctx.save();
    for (const bond of state.bonds) {
        if (!bondVisibleInMode2D(bond, state, settings))
            continue;
        if (bond.kind === "metallic" || bond.kind === "hydrogen" || bond.kind === "dispersion")
            continue;
        const a = atomById.get(bond.a);
        const b = atomById.get(bond.b);
        if (!a || !b)
            continue;
        const segment = visibleBondSegment(a, b);
        if (!segment)
            continue;
        const target = bond.electronShift ? atomById.get(bond.electronShift) : null;
        const reverse = target?.id === a.id;
        const count = bond.order + (bond.kind === "ionic" ? 1 : 0);
        const focusAlpha = focusedIds && !bondFocused2D(bond, state, focusedIds) ? 0.18 : 1;
        for (let index = 0; index < count; index += 1) {
            const phase = (state.time * (0.42 + index * 0.08) + index / count) % 1;
            const t = reverse ? 1 - phase : phase;
            const x = segment.startX + (segment.endX - segment.startX) * t + segment.px * (index - (count - 1) / 2) * 5;
            const y = segment.startY + (segment.endY - segment.startY) * t + segment.py * (index - (count - 1) / 2) * 5;
            ctx.globalAlpha = (settings.geometry3D ? clamp(0.42 + (((a.z ?? 0) + (b.z ?? 0)) / 2 + 260) / 840, 0.32, 0.78) : settings.electronOpacity2D) * focusAlpha;
            ctx.fillStyle = bond.kind === "ionic" ? "#f97316" : settings.electronColor2D;
            ctx.beginPath();
            ctx.arc(x, y, bond.kind === "ionic" ? 3.1 : 2.3, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    ctx.restore();
}
function drawNetDipole(ctx, state, settings) {
    const atomById = new Map(state.atoms.map((atom) => [atom.id, atom]));
    const net = state.bonds.reduce((acc, bond) => {
        if ((bond.kind !== "polar-covalent" && bond.kind !== "ionic") || !bond.electronShift)
            return acc;
        const a = atomById.get(bond.a);
        const b = atomById.get(bond.b);
        const target = atomById.get(bond.electronShift);
        if (!a || !b || !target)
            return acc;
        const source = target.id === a.id ? b : a;
        const strength = bond.kind === "ionic" ? 1.4 : clamp(bond.polarity, 0.2, 1.6);
        acc.x += (target.x - source.x) * strength;
        acc.y += (target.y - source.y) * strength;
        return acc;
    }, { x: 0, y: 0 });
    const magnitude = Math.hypot(net.x, net.y);
    if (magnitude < 18 || !state.atoms.length)
        return;
    const cx = state.atoms.reduce((sum, atom) => sum + atom.x, 0) / state.atoms.length;
    const cy = state.atoms.reduce((sum, atom) => sum + atom.y, 0) / state.atoms.length;
    const ux = net.x / magnitude;
    const uy = net.y / magnitude;
    const strength = magnitude / Math.max(1, state.bonds.length);
    const length = clamp(26 + strength * 4.1, 42, 118);
    const width = clamp(4.4 + strength * 0.075, 4.8, 9);
    const startOffset = clamp(8 + length * 0.07, 10, 18);
    const startX = cx + ux * startOffset;
    const startY = cy + uy * startOffset;
    drawArrow(ctx, startX, startY, startX + ux * length, startY + uy * length, settings.theme === "light" ? "#0f766e" : "#5eead4", width, "μ", clamp(strength / 38, 0.35, 1));
}
function visibleBondSegment(a, b) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const length = Math.hypot(dx, dy);
    if (length < 0.01)
        return null;
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
function drawDipoleIndicator(ctx, a, b, bond, segment, settings) {
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
function drawBondAngleBadge(ctx, state, bondId, settings) {
    if (!bondId)
        return;
    const bond = state.bonds.find((item) => item.id === bondId);
    if (!bond || bond.kind === "hydrogen" || bond.kind === "dispersion" || bond.kind === "metallic")
        return;
    const atomById = new Map(state.atoms.map((atom) => [atom.id, atom]));
    const a = atomById.get(bond.a);
    const b = atomById.get(bond.b);
    if (!a || !b)
        return;
    const candidates = bondAnglesFor(state, bond, atomById);
    if (!candidates.length)
        return;
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
function bondAnglesFor(state, bond, atomById) {
    return [bond.a, bond.b].flatMap((centerId) => {
        const center = atomById.get(centerId);
        const endpointId = centerId === bond.a ? bond.b : bond.a;
        const endpoint = atomById.get(endpointId);
        if (!center || !endpoint)
            return [];
        const neighbors = state.bonds
            .filter((item) => item.id !== bond.id && (item.a === centerId || item.b === centerId))
            .map((item) => atomById.get(item.a === centerId ? item.b : item.a))
            .filter((atom) => Boolean(atom));
        return neighbors.map((other) => ({
            angle: angleBetween(center, endpoint, other),
            centralDegree: neighbors.length + 1,
            other
        }));
    });
}
function angleBetween(center, a, b) {
    const ax = a.x - center.x;
    const ay = a.y - center.y;
    const bx = b.x - center.x;
    const by = b.y - center.y;
    const dot = ax * bx + ay * by;
    const mag = Math.max(0.01, Math.hypot(ax, ay) * Math.hypot(bx, by));
    return Math.acos(clamp(dot / mag, -1, 1)) * 180 / Math.PI;
}
function drawHydrogenBond(ctx, state, hBond, settings) {
    const hydrogen = state.atoms.find((atom) => atom.id === hBond.hydrogen);
    const acceptor = state.atoms.find((atom) => atom.id === hBond.acceptor);
    if (!hydrogen || !acceptor)
        return;
    const colors = palette(settings);
    ctx.save();
    ctx.setLineDash([5, 8]);
    ctx.lineCap = "round";
    ctx.lineWidth = 1.3 + hBond.strength * 1.4;
    ctx.strokeStyle = settings.theme === "light" ? "rgba(14, 116, 144, 0.58)" : "rgba(125, 211, 252, 0.62)";
    ctx.shadowColor = colors.freeElectron;
    ctx.shadowBlur = settings.geometry3D && isDetailed(settings) ? 8 : 0;
    ctx.beginPath();
    ctx.moveTo(hydrogen.x, hydrogen.y);
    ctx.lineTo(acceptor.x, acceptor.y);
    ctx.stroke();
    ctx.restore();
}
function drawSharedElectrons(ctx, a, b, bond, settings) {
    const mx = (a.x + b.x) / 2;
    const my = (a.y + b.y) / 2;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const dist = Math.max(0.01, Math.hypot(dx, dy));
    const px = -dy / dist;
    const py = dx / dist;
    const count = bond.kind === "ionic" ? 1 : bond.order * 2;
    const colors = palette(settings);
    ctx.fillStyle = bond.kind === "ionic" ? colors.ionic : electronFill(settings, settings.electronOpacity2D);
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = settings.geometry3D && isDetailed(settings) ? 9 : 0;
    for (let i = 0; i < count; i += 1) {
        const spread = (i - (count - 1) / 2) * 9;
        ctx.beginPath();
        ctx.arc(mx + px * spread, my + py * spread, 3.2, 0, Math.PI * 2);
        ctx.fill();
    }
}
function drawAtom(ctx, atom, state, settings, highlightedAtomIds = [], alpha = 1) {
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
    ctx.globalAlpha = depthAlpha * alpha;
    ctx.filter = "none";
    ctx.shadowColor = data.glow;
    ctx.shadowBlur = settings.geometry3D && detailed ? (selected ? 18 : 8) * depth * clamp(depthAlpha + 0.12, 0.5, 1) : 0;
    if (detailed)
        drawElementSignature(ctx, atom, state.time, settings);
    if (detailed) {
        const edgeColor = settings.theme === "light" ? mixColor(data.color, "#33443d", 0.22) : mixColor(data.color, "#050807", 0.34);
        const gradient = ctx.createRadialGradient(lightX, lightY, Math.max(2, atom.radius * 0.08), atom.x + atom.radius * 0.12, atom.y + atom.radius * 0.16, atom.radius * 1.1);
        gradient.addColorStop(0, mixColor(data.color, "#ffffff", 0.72));
        gradient.addColorStop(0.28, mixColor(data.color, "#ffffff", 0.2));
        gradient.addColorStop(0.76, data.color);
        gradient.addColorStop(1, edgeColor);
        ctx.fillStyle = gradient;
    }
    else {
        ctx.fillStyle = settings.visualStyle === "simple-colored" ? data.color : colors.atomNeutral;
    }
    ctx.beginPath();
    ctx.arc(atom.x, atom.y, atom.radius, 0, Math.PI * 2);
    ctx.fill();
    if (detailed) {
        const shade = ctx.createRadialGradient(atom.x - atom.radius * 0.32, atom.y - atom.radius * 0.4, atom.radius * 0.1, atom.x + atom.radius * 0.32, atom.y + atom.radius * 0.36, atom.radius * 1.16);
        shade.addColorStop(0, "rgba(255,255,255,0)");
        shade.addColorStop(0.64, "rgba(15,23,42,0.02)");
        shade.addColorStop(1, settings.theme === "light" ? "rgba(15,23,42,0.08)" : "rgba(0,0,0,0.22)");
        ctx.fillStyle = shade;
        ctx.beginPath();
        ctx.arc(atom.x, atom.y, atom.radius, 0, Math.PI * 2);
        ctx.fill();
    }
    const lessonHighlighted = highlightedAtomIds.includes(atom.id);
    ctx.lineWidth = (selected || lessonHighlighted ? 3 : 1.5) * depth;
    ctx.strokeStyle = selected ? "#facc15" : lessonHighlighted ? "#5eead4" : detailed ? "rgba(255,255,255,0.34)" : colors.atomNeutralEdge;
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.filter = "none";
    if (settings.showShells) {
        if (!settings.geometry3D) {
            drawElectronShellStructure(ctx, atom, state, settings, depthAlpha * alpha, selected || lessonHighlighted);
        }
        else {
            ctx.globalAlpha = clamp(depthAlpha + 0.08, 0.5, 1) * alpha;
            ctx.strokeStyle = colors.shell;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(atom.x, atom.y, atom.radius + 14, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
    ctx.globalAlpha = clamp(depthAlpha + 0.16, 0.72, 1) * alpha;
    ctx.fillStyle = colors.atomText;
    ctx.font = "800 15px Inter, system-ui";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(atom.symbol, atom.x, atom.y);
    if (settings.showCharges && atom.charge !== 0) {
        const text = atom.charge > 0 ? `${atom.charge}+` : `${Math.abs(atom.charge)}-`;
        const badgeX = atom.x + atom.radius + 20;
        const badgeY = atom.y - atom.radius - 15;
        ctx.save();
        ctx.font = "900 12px Inter, system-ui";
        const badgeW = Math.max(24, ctx.measureText(text).width + 12);
        ctx.fillStyle = settings.theme === "light" ? "rgba(255,255,255,0.92)" : "rgba(10,12,12,0.78)";
        ctx.strokeStyle = atom.charge > 0 ? colors.positive : colors.negative;
        ctx.lineWidth = 1.4;
        roundRect(ctx, badgeX - badgeW / 2, badgeY - 11, badgeW, 22, 11);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = atom.charge > 0 ? colors.positive : colors.negative;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(text, badgeX, badgeY);
        ctx.restore();
    }
    if (shouldShowAtomLabel2D(atom, state, settings)) {
        ctx.fillStyle = colors.label;
        ctx.font = "700 11px Inter, system-ui";
        ctx.fillText(data.name, atom.x, atom.y + atom.radius + 28);
    }
    if (selected)
        drawValenceBadge(ctx, atom, state, settings);
    ctx.restore();
}
function drawElementSignature(ctx, atom, time, settings) {
    const data = atomData[atom.symbol];
    const colors = palette(settings);
    ctx.save();
    ctx.lineCap = "round";
    if (data.nobleGas) {
        const pulse = 0.5 + Math.sin(time * 1.7 + data.atomicNumber) * 0.5;
        ctx.globalAlpha = settings.theme === "light" ? 0.2 + pulse * 0.08 : 0.24 + pulse * 0.1;
        ctx.strokeStyle = data.glow;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(atom.x, atom.y, atom.radius + 20 + pulse * 3, 0, Math.PI * 2);
        ctx.stroke();
    }
    if (isRadioactiveLike(atom.symbol, data.atomicNumber)) {
        drawRadioactiveSignature(ctx, atom, time, settings);
    }
    if (data.group === "alkali-metals" && atom.symbol !== "H") {
        ctx.globalAlpha = settings.theme === "light" ? 0.34 : 0.46;
        ctx.strokeStyle = colors.ionic;
        ctx.lineWidth = 1.7;
        for (let i = 0; i < 2; i += 1) {
            const angle = time * 1.3 + i * Math.PI + data.atomicNumber * 0.11;
            const r1 = atom.radius + 12;
            const r2 = atom.radius + 21;
            ctx.beginPath();
            ctx.moveTo(atom.x + Math.cos(angle) * r1, atom.y + Math.sin(angle) * r1);
            ctx.lineTo(atom.x + Math.cos(angle) * r2, atom.y + Math.sin(angle) * r2);
            ctx.stroke();
        }
    }
    ctx.restore();
}
function drawRadioactiveSignature(ctx, atom, time, settings) {
    const atomicNumber = atomData[atom.symbol].atomicNumber;
    const cycle = (time * 0.58 + atomicNumber * 0.013) % 1;
    const radius = atom.radius + 18 + cycle * 34;
    const spin = time * 0.34 + atomicNumber * 0.13;
    const color = "#facc15";
    ctx.save();
    ctx.translate(atom.x, atom.y);
    ctx.rotate(spin);
    ctx.globalAlpha = (1 - cycle) * (settings.theme === "light" ? 0.34 : 0.42);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.globalAlpha = (1 - cycle) * (settings.theme === "light" ? 0.16 : 0.22);
    for (let i = 0; i < 3; i += 1) {
        const angle = i * Math.PI * 2 / 3 - Math.PI / 8;
        ctx.beginPath();
        ctx.moveTo(Math.cos(angle) * (radius * 0.32), Math.sin(angle) * (radius * 0.32));
        ctx.arc(0, 0, radius * 0.82, angle, angle + Math.PI / 4);
        ctx.lineTo(Math.cos(angle + Math.PI / 4) * (radius * 0.32), Math.sin(angle + Math.PI / 4) * (radius * 0.32));
        ctx.closePath();
        ctx.fill();
    }
    ctx.globalAlpha = (1 - cycle) * (settings.theme === "light" ? 0.22 : 0.28);
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.16, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}
function drawValenceBadge(ctx, atom, state, settings) {
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
function roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + width, y, x + width, y + height, radius);
    ctx.arcTo(x + width, y + height, x, y + height, radius);
    ctx.arcTo(x, y + height, x, y, radius);
    ctx.arcTo(x, y, x + width, y, radius);
    ctx.closePath();
}
function drawElectronShellStructure(ctx, atom, state, settings, depthAlpha, emphasized) {
    const element = periodicElementBySymbol.get(atom.symbol);
    const sourceShells = element?.shells.filter((count) => count > 0) ?? [atomData[atom.symbol].valenceElectrons];
    const shells = settings.valenceShellOnly2D ? [sourceShells[sourceShells.length - 1] ?? atomData[atom.symbol].valenceElectrons] : sourceShells;
    const radii = shellRadii(atom, shells.length, settings);
    const colors = palette(settings);
    const fullDetail = emphasized || state.atoms.length <= 18 || settings.zoom >= 1.15;
    ctx.save();
    if (settings.atomicModel2D === "probability-cloud") {
        drawProbabilityCloudModel(ctx, atom, state, settings, shells, radii, depthAlpha, fullDetail);
        ctx.restore();
        return;
    }
    if (settings.atomicModel2D === "rutherford") {
        drawRutherfordModel(ctx, atom, state, settings, shells, radii, depthAlpha, fullDetail);
        ctx.restore();
        return;
    }
    if (settings.atomicModel2D === "spdf") {
        drawSpdfModel(ctx, atom, state, settings, depthAlpha, fullDetail);
        ctx.restore();
        return;
    }
    if (settings.atomicModel2D === "compact") {
        drawCompactElectronModel(ctx, atom, state, settings, radii, depthAlpha);
        ctx.restore();
        return;
    }
    ctx.globalAlpha = clamp(settings.shellOpacity2D * depthAlpha, 0.04, 1);
    ctx.strokeStyle = colors.shell;
    ctx.lineWidth = 1;
    for (const radius of radii) {
        ctx.beginPath();
        ctx.arc(atom.x, atom.y, radius, 0, Math.PI * 2);
        ctx.stroke();
    }
    ctx.globalAlpha = clamp(depthAlpha + 0.08, 0.5, 1);
    if (!fullDetail) {
        const outerShell = radii[radii.length - 1] ?? atom.radius + 14;
        const freeValenceElectrons = visibleValenceElectronCount(atom, state);
        if (freeValenceElectrons > 0)
            drawValenceElectrons(ctx, atom, freeValenceElectrons, state.time, settings, outerShell);
        ctx.restore();
        return;
    }
    for (let shellIndex = 0; shellIndex < Math.max(0, settings.valenceShellOnly2D ? 0 : shells.length - 1); shellIndex += 1) {
        drawShellElectrons(ctx, atom, shells[shellIndex], radii[shellIndex], state.time, settings, shellIndex);
    }
    const outerShell = radii[radii.length - 1] ?? atom.radius + 14;
    const freeValenceElectrons = visibleValenceElectronCount(atom, state);
    if (hasStructuralBonds(atom, state) && shouldShowLonePairs(atom)) {
        const lonePairs = Math.floor(freeValenceElectrons / 2);
        const singleElectrons = freeValenceElectrons % 2;
        if (lonePairs > 0)
            drawLonePairs(ctx, atom, state, lonePairs, state.time, settings, outerShell);
        if (singleElectrons > 0)
            drawValenceElectrons(ctx, atom, singleElectrons, state.time, settings, outerShell);
    }
    else if (freeValenceElectrons > 0) {
        drawValenceElectrons(ctx, atom, freeValenceElectrons, state.time, settings, outerShell);
    }
    ctx.restore();
}
function drawCompactElectronModel(ctx, atom, state, settings, radii, depthAlpha) {
    const colors = palette(settings);
    const outerShell = radii[radii.length - 1] ?? atom.radius + 18;
    ctx.globalAlpha = clamp(settings.shellOpacity2D * depthAlpha, 0.08, 0.72);
    ctx.strokeStyle = colors.shell;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(atom.x, atom.y, outerShell, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = clamp(depthAlpha + 0.08, 0.5, 1);
    const freeValenceElectrons = visibleValenceElectronCount(atom, state);
    if (freeValenceElectrons > 0)
        drawValenceElectrons(ctx, atom, freeValenceElectrons, state.time, settings, outerShell);
}
function drawProbabilityCloudModel(ctx, atom, state, settings, shells, radii, depthAlpha, fullDetail) {
    const electronColor = settings.electronColor2D;
    const dotAlpha = clamp(settings.electronOpacity2D * depthAlpha, 0.08, 0.85);
    const cloudAlpha = clamp(settings.shellOpacity2D * depthAlpha, 0.06, 0.62);
    const averageRingColor = settings.theme === "light" ? "rgba(23, 63, 85, 0.34)" : "rgba(226, 246, 255, 0.28)";
    for (let shellIndex = 0; shellIndex < shells.length; shellIndex += 1) {
        const radius = radii[shellIndex] ?? atom.radius + 18;
        const gradient = ctx.createRadialGradient(atom.x, atom.y, Math.max(2, radius * 0.56), atom.x, atom.y, radius * 1.24);
        gradient.addColorStop(0, hexToRgba(electronColor, 0));
        gradient.addColorStop(0.46, hexToRgba(electronColor, cloudAlpha * 0.22));
        gradient.addColorStop(0.75, hexToRgba(electronColor, cloudAlpha * 0.18));
        gradient.addColorStop(1, hexToRgba(electronColor, 0));
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(atom.x, atom.y, radius * 1.26, 0, Math.PI * 2);
        ctx.fill();
        ctx.save();
        ctx.globalAlpha = clamp(settings.shellOpacity2D * depthAlpha, 0.08, 0.58);
        ctx.strokeStyle = averageRingColor;
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 6]);
        ctx.beginPath();
        ctx.arc(atom.x, atom.y, radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
        const dotCount = fullDetail ? clamp(shells[shellIndex] * 12, 24, 180) : clamp(shells[shellIndex] * 5, 12, 54);
        ctx.fillStyle = hexToRgba(electronColor, dotAlpha * 0.42);
        for (let i = 0; i < dotCount; i += 1) {
            const seed = (i + 1) * (shellIndex + 2);
            const angle = seed * 2.399963 + state.time * (0.025 + shellIndex * 0.012);
            const radialNoise = ((((seed * 37) % 101) / 100) - 0.5) * 0.58;
            const drift = Math.sin(seed * 1.91 + state.time * 0.38) * 0.09;
            const dist = radius * clamp(1 + radialNoise + drift, 0.28, 1.36);
            const squash = 0.86 + 0.08 * Math.sin(seed);
            const px = atom.x + Math.cos(angle) * dist;
            const py = atom.y + Math.sin(angle) * dist * squash;
            ctx.beginPath();
            ctx.arc(px, py, shellIndex > 2 ? 0.9 : 1.15, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    ctx.lineCap = "round";
    const movingShells = Math.min(shells.length, fullDetail ? 4 : 2);
    for (let shellIndex = 0; shellIndex < movingShells; shellIndex += 1) {
        const radius = radii[shellIndex] ?? atom.radius + 18;
        const count = Math.min(shells[shellIndex], shellIndex === shells.length - 1 ? visibleValenceElectronCount(atom, state) || shells[shellIndex] : 4);
        for (let i = 0; i < Math.min(count, 5); i += 1) {
            drawCloudTrace(ctx, atom.x, atom.y, radius, state.time, shellIndex, i, settings);
        }
    }
    const outerShell = radii[radii.length - 1] ?? atom.radius + 18;
    if (hasStructuralBonds(atom, state) && shouldShowLonePairs(atom)) {
        const freeValenceElectrons = visibleValenceElectronCount(atom, state);
        const lonePairs = Math.floor(freeValenceElectrons / 2);
        if (lonePairs > 0)
            drawLonePairs(ctx, atom, state, lonePairs, state.time, settings, outerShell);
    }
}
function drawCloudTrace(ctx, x, y, radius, time, shellIndex, electronIndex, settings) {
    const speed = 0.92 + shellIndex * 0.16;
    const phase = electronIndex * 2.11 + shellIndex * 0.74;
    const angle = time * speed + phase;
    const tilt = 0.58 + ((electronIndex + shellIndex) % 4) * 0.11;
    const wobble = 1 + Math.sin(time * 1.4 + phase) * 0.06;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(phase * 0.34);
    ctx.strokeStyle = electronFill(settings, settings.electronOpacity2D * 0.34);
    ctx.fillStyle = electronFill(settings, settings.electronOpacity2D * 0.9);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(0, 0, radius * wobble, radius * tilt, 0, angle - 0.44, angle + 0.06);
    ctx.stroke();
    const px = Math.cos(angle) * radius * wobble;
    const py = Math.sin(angle) * radius * tilt;
    ctx.beginPath();
    ctx.arc(px, py, 2.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}
function drawRutherfordModel(ctx, atom, state, settings, shells, radii, depthAlpha, fullDetail) {
    const colors = palette(settings);
    const electronCount = fullDetail ? Math.min(shells.reduce((sum, count) => sum + count, 0), 18) : Math.min(visibleValenceElectronCount(atom, state), 6);
    const outerRadius = radii[radii.length - 1] ?? atom.radius + 22;
    ctx.globalAlpha = clamp(settings.shellOpacity2D * depthAlpha, 0.05, 0.32);
    ctx.strokeStyle = colors.shell;
    ctx.lineWidth = 0.9;
    for (let i = 0; i < 3; i += 1) {
        ctx.save();
        ctx.translate(atom.x, atom.y);
        ctx.rotate(i * Math.PI / 3 + state.time * 0.03);
        ctx.beginPath();
        ctx.ellipse(0, 0, outerRadius, outerRadius * (0.34 + i * 0.08), 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }
    ctx.globalAlpha = clamp(depthAlpha + 0.08, 0.5, 1);
    for (let i = 0; i < electronCount; i += 1) {
        drawPlanetaryElectronTrail(ctx, atom.x, atom.y, outerRadius * (0.7 + (i % 3) * 0.13), state.time, i % 3, i, settings);
    }
}
function drawPlanetaryElectronTrail(ctx, x, y, radius, time, orbitIndex, electronIndex, settings) {
    const phase = electronIndex * 1.93 + orbitIndex * 0.88;
    const angle = time * (1.2 + orbitIndex * 0.18) + phase;
    const tilt = 0.34 + orbitIndex * 0.09;
    const rotation = phase * 0.38;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.lineCap = "round";
    for (let segment = 5; segment >= 1; segment -= 1) {
        const alpha = settings.electronOpacity2D * (0.065 + segment * 0.045);
        const end = angle - (6 - segment) * 0.075;
        ctx.strokeStyle = electronFill(settings, alpha);
        ctx.lineWidth = 1.1 + segment * 0.22;
        ctx.beginPath();
        ctx.ellipse(0, 0, radius, radius * tilt, 0, end - 0.18, end);
        ctx.stroke();
    }
    const px = Math.cos(angle) * radius;
    const py = Math.sin(angle) * radius * tilt;
    ctx.fillStyle = electronFill(settings, settings.electronOpacity2D);
    ctx.beginPath();
    ctx.arc(px, py, 2.7, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}
function drawSpdfModel(ctx, atom, state, settings, depthAlpha, fullDetail) {
    const element = periodicElementBySymbol.get(atom.symbol);
    const subshells = parseSubshellConfiguration(element?.electronConfiguration ?? "");
    if (!subshells.length)
        return;
    const shellExpansion = clamp(settings.shellSpacing2D, 0, 1);
    const mainGap = 19 + shellExpansion * 23;
    const subGap = 6.5 + shellExpansion * 5.5;
    const firstRadius = atom.radius + 17 + shellExpansion * 4;
    const shellGroups = groupSubshellsByShell(subshells);
    const shellRadiiByN = new Map();
    const perShellSeen = new Map();
    for (const sub of subshells) {
        const subIndex = perShellSeen.get(sub.n) ?? 0;
        perShellSeen.set(sub.n, subIndex + 1);
        const radius = firstRadius + (sub.n - 1) * mainGap + subIndex * subGap;
        const currentShell = shellRadiiByN.get(sub.n);
        shellRadiiByN.set(sub.n, {
            inner: currentShell ? Math.min(currentShell.inner, radius) : radius,
            outer: currentShell ? Math.max(currentShell.outer, radius) : radius,
            electrons: (currentShell?.electrons ?? 0) + sub.electrons
        });
        const color = subshellColor(sub.kind);
        ctx.globalAlpha = clamp(settings.shellOpacity2D * depthAlpha, 0.1, 0.9);
        ctx.strokeStyle = hexToRgba(color, subIndex === 0 ? 0.78 : 0.58);
        ctx.lineWidth = sub.kind === "s" ? 1.5 : 1.12;
        ctx.setLineDash(sub.kind === "s" ? [] : sub.kind === "p" ? [8, 4] : sub.kind === "d" ? [3, 4] : [2, 6]);
        ctx.beginPath();
        ctx.arc(atom.x, atom.y, radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        const showElectrons = fullDetail || sub.n >= Math.max(1, Math.max(...subshells.map((item) => item.n)) - 1);
        if (showElectrons)
            drawSubshellElectrons(ctx, atom.x, atom.y, radius, sub.electrons, color, state.time, settings, sub.n, subIndex);
        if (fullDetail || settings.zoom >= 1.05 || sub.n >= Math.max(1, Math.max(...subshells.map((item) => item.n)) - 2)) {
            drawSubshellBadge(ctx, atom.x, atom.y, radius, sub, subIndex, settings, depthAlpha);
        }
    }
    for (const group of shellGroups) {
        const shellRadii = shellRadiiByN.get(group.n);
        if (!shellRadii)
            continue;
        drawMainShellBand(ctx, atom.x, atom.y, shellRadii.inner - subGap * 0.62, shellRadii.outer + subGap * 0.62, group.n, settings, depthAlpha);
        drawSpdfShellLabel(ctx, atom.x, atom.y, shellRadii.outer, group, settings, depthAlpha);
    }
    if (fullDetail || settings.zoom >= 1.25)
        drawSpdfConfigPanel(ctx, atom, element?.electronConfiguration ?? "", subshells, settings, depthAlpha);
}
function drawSubshellElectrons(ctx, x, y, radius, count, color, time, settings, shell, subIndex) {
    const visibleCount = Math.min(count, 14);
    ctx.fillStyle = hexToRgba(color, settings.electronOpacity2D * 0.92);
    ctx.strokeStyle = hexToRgba(color, settings.electronOpacity2D * 0.46);
    for (let i = 0; i < visibleCount; i += 1) {
        const angle = time * (0.2 + shell * 0.025 + subIndex * 0.02) + i * (Math.PI * 2 / visibleCount);
        const wobble = Math.sin(time * 1.2 + i + shell) * 0.8;
        ctx.beginPath();
        ctx.arc(x + Math.cos(angle) * (radius + wobble), y + Math.sin(angle) * (radius + wobble), count > 10 ? 1.55 : 2.05, 0, Math.PI * 2);
        ctx.fill();
    }
}
function drawMainShellBand(ctx, x, y, innerRadius, outerRadius, shell, settings, depthAlpha) {
    if (outerRadius <= 0)
        return;
    ctx.save();
    ctx.globalAlpha = clamp(settings.shellOpacity2D * depthAlpha, 0.035, 0.16);
    ctx.strokeStyle = settings.theme === "light" ? "#0f766e" : "#ccfbf1";
    ctx.lineWidth = Math.max(1, outerRadius - Math.max(0, innerRadius));
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.arc(x, y, Math.max(0, (innerRadius + outerRadius) / 2), 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = clamp(settings.shellOpacity2D * depthAlpha, 0.08, 0.34);
    ctx.lineWidth = 0.8 / Math.max(settings.zoom, 0.6);
    ctx.setLineDash([2 / Math.max(settings.zoom, 0.6), 7 / Math.max(settings.zoom, 0.6)]);
    ctx.beginPath();
    ctx.arc(x, y, outerRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
}
function drawSpdfShellLabel(ctx, x, y, radius, group, settings, depthAlpha) {
    const zoom = Math.max(settings.zoom, 0.6);
    const angle = -Math.PI * 0.76 + group.n * 0.18;
    const lx = x + Math.cos(angle) * (radius + 18 / zoom);
    const ly = y + Math.sin(angle) * (radius + 18 / zoom);
    const text = `n=${group.n} ${shellName(group.n)} SHELL`;
    const subText = `${group.electrons} e-`;
    drawSpdfBadge(ctx, lx, ly, text, subText, settings.theme === "light" ? "#0f766e" : "#5eead4", settings, depthAlpha, "shell");
}
function drawSubshellBadge(ctx, x, y, radius, sub, subIndex, settings, depthAlpha) {
    const zoom = Math.max(settings.zoom, 0.6);
    const angle = -0.52 + subIndex * 0.2 + sub.n * 0.035;
    const lx = x + Math.cos(angle) * (radius + 14 / zoom);
    const ly = y + Math.sin(angle) * (radius + 14 / zoom);
    drawSpdfBadge(ctx, lx, ly, `${sub.n}${sub.kind}${sub.electrons}`, `${sub.kind.toUpperCase()} SUBSHELL`, subshellColor(sub.kind), settings, depthAlpha, "subshell");
}
function drawSpdfConfigPanel(ctx, atom, configuration, subshells, settings, depthAlpha) {
    const zoom = Math.max(settings.zoom, 0.6);
    const panelW = 238 / zoom;
    const lineH = 15 / zoom;
    const pad = 9 / zoom;
    const rows = compactShellSummary(subshells);
    const panelH = pad * 2 + lineH * (2 + rows.length);
    const x = atom.x - panelW / 2;
    const y = atom.y + atom.radius + 50 / zoom;
    ctx.save();
    ctx.globalAlpha = clamp(depthAlpha, 0.32, 0.88);
    ctx.fillStyle = settings.theme === "light" ? "rgba(255,255,255,0.82)" : "rgba(7,12,11,0.68)";
    ctx.strokeStyle = settings.theme === "light" ? "rgba(15,118,110,0.18)" : "rgba(94,234,212,0.2)";
    ctx.lineWidth = 1 / zoom;
    roundRect(ctx, x, y, panelW, panelH, 8 / zoom);
    ctx.fill();
    ctx.stroke();
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillStyle = settings.theme === "light" ? "#20302a" : "#eef5f1";
    ctx.font = `900 ${10 / zoom}px Inter, system-ui`;
    ctx.fillText(`${atom.symbol} SPDF MODEL`, x + pad, y + pad);
    ctx.font = `800 ${8.5 / zoom}px Inter, system-ui`;
    ctx.fillStyle = settings.theme === "light" ? "rgba(32,48,42,0.72)" : "rgba(238,245,241,0.72)";
    ctx.fillText(cleanElectronConfiguration(configuration), x + pad, y + pad + lineH);
    rows.forEach((row, index) => {
        ctx.fillText(row, x + pad, y + pad + lineH * (2 + index));
    });
    ctx.restore();
}
function drawSpdfBadge(ctx, cx, cy, text, subText, color, settings, depthAlpha, tone) {
    const zoom = Math.max(settings.zoom, 0.6);
    const fontMain = tone === "shell" ? 8.8 / zoom : 8 / zoom;
    const fontSub = 6.5 / zoom;
    const padX = 7 / zoom;
    const padY = 4 / zoom;
    ctx.save();
    ctx.globalAlpha = clamp(depthAlpha, 0.32, 0.9);
    ctx.font = `950 ${fontMain}px Inter, system-ui`;
    const width = Math.max(ctx.measureText(text).width, ctx.measureText(subText).width) + padX * 2;
    const height = fontMain + fontSub + padY * 2 + 2 / zoom;
    ctx.fillStyle = tone === "shell"
        ? settings.theme === "light" ? "rgba(240,253,250,0.9)" : "rgba(6,22,20,0.84)"
        : settings.theme === "light" ? "rgba(255,255,255,0.78)" : "rgba(7,12,11,0.7)";
    ctx.strokeStyle = hexToRgba(color, tone === "shell" ? 0.58 : 0.42);
    ctx.lineWidth = 1 / zoom;
    roundRect(ctx, cx - width / 2, cy - height / 2, width, height, 6 / zoom);
    ctx.fill();
    ctx.stroke();
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillStyle = color;
    ctx.fillText(text, cx, cy - height / 2 + padY);
    ctx.font = `900 ${fontSub}px Inter, system-ui`;
    ctx.fillStyle = settings.theme === "light" ? "rgba(32,48,42,0.66)" : "rgba(238,245,241,0.62)";
    ctx.fillText(subText, cx, cy - height / 2 + padY + fontMain + 1 / zoom);
    ctx.restore();
}
const subshellOrder = { s: 0, p: 1, d: 2, f: 3 };
function groupSubshellsByShell(subshells) {
    const groups = new Map();
    for (const sub of subshells) {
        const group = groups.get(sub.n) ?? { n: sub.n, electrons: 0, subshells: [] };
        group.electrons += sub.electrons;
        group.subshells.push(sub);
        groups.set(sub.n, group);
    }
    return [...groups.values()].sort((a, b) => a.n - b.n);
}
function compactShellSummary(subshells) {
    return groupSubshellsByShell(subshells).map((group) => {
        const parts = group.subshells.map((sub) => `${sub.n}${sub.kind}${sub.electrons}`).join(" ");
        return `n=${group.n}: ${parts}  (${group.electrons} e-)`;
    }).slice(-4);
}
function shellName(n) {
    return ["", "K", "L", "M", "N", "O", "P", "Q"][n] ?? "";
}
function cleanElectronConfiguration(configuration) {
    return configuration.replace(/\s+/g, " ").replace(/\((calculated|predicted)\)/gi, "").trim();
}
function parseSubshellConfiguration(configuration, seen = new Set()) {
    if (!configuration)
        return [];
    const expanded = [];
    const coreMatch = configuration.match(/\[([A-Z][a-z]?)\]/);
    if (coreMatch && !seen.has(coreMatch[1])) {
        seen.add(coreMatch[1]);
        const coreElement = periodicElementBySymbol.get(coreMatch[1]);
        expanded.push(...parseSubshellConfiguration(coreElement?.electronConfiguration ?? "", seen));
    }
    const withoutCore = configuration.replace(/\[[^\]]+\]/g, " ").replace(/\([^)]*\)/g, " ");
    const tokenPattern = /(\d)([spdf])\s*(\d{1,2})/g;
    for (const match of withoutCore.matchAll(tokenPattern)) {
        expanded.push({ n: Number(match[1]), kind: match[2], electrons: Number(match[3]) });
    }
    const merged = new Map();
    for (const sub of expanded) {
        const key = `${sub.n}${sub.kind}`;
        const current = merged.get(key);
        merged.set(key, current ? { ...current, electrons: Math.max(current.electrons, sub.electrons) } : sub);
    }
    return [...merged.values()].sort((a, b) => a.n - b.n || subshellOrder[a.kind] - subshellOrder[b.kind]);
}
function subshellColor(kind) {
    if (kind === "s")
        return "#14b8a6";
    if (kind === "p")
        return "#38bdf8";
    if (kind === "d")
        return "#8b5cf6";
    return "#f59e0b";
}
function shellRadii(atom, shellCount, settings) {
    const shellExpansion = clamp(settings.shellSpacing2D, 0, 1);
    const firstRadius = atom.radius + 12 + shellExpansion * 5;
    const baseSpacing = clamp(12 - Math.max(0, shellCount - 4) * 0.8, 8.5, 12);
    const spacing = baseSpacing * (1 + shellExpansion * 2.35);
    return Array.from({ length: shellCount }, (_, index) => firstRadius + index * spacing);
}
function drawShellElectrons(ctx, atom, count, orbit, time, settings, shellIndex) {
    if (count <= 0)
        return;
    const colors = palette(settings);
    const electronRadius = count > 18 ? 1.55 : count > 8 ? 2 : 2.35;
    ctx.fillStyle = electronFill(settings, settings.electronOpacity2D * 0.86);
    ctx.strokeStyle = electronFill(settings, settings.electronOpacity2D * 0.64);
    ctx.shadowColor = colors.electron;
    ctx.shadowBlur = settings.geometry3D && isDetailed(settings) && count <= 18 ? 4 : 0;
    const drift = time * (0.16 + shellIndex * 0.035);
    for (let i = 0; i < count; i += 1) {
        const angle = drift + i * (Math.PI * 2 / count);
        drawOrbitalElectron(ctx, atom.x, atom.y, orbit, angle, electronRadius, settings);
    }
    ctx.shadowBlur = 0;
}
function drawValenceElectrons(ctx, atom, count, time, settings, orbit = atom.radius + 14) {
    const colors = palette(settings);
    ctx.fillStyle = electronFill(settings, settings.electronOpacity2D);
    ctx.strokeStyle = electronFill(settings, settings.electronOpacity2D * 0.72);
    ctx.shadowColor = colors.electron;
    ctx.shadowBlur = settings.geometry3D && isDetailed(settings) ? 8 : 0;
    for (let i = 0; i < count; i += 1) {
        const angle = time * 0.55 + i * (Math.PI * 2 / count);
        drawOrbitalElectron(ctx, atom.x, atom.y, orbit, angle, 3, settings);
    }
    ctx.shadowBlur = 0;
}
function drawOrbitalElectron(ctx, centerX, centerY, orbit, angle, radius, settings) {
    if (settings.electronRenderMode2D === "trails") {
        ctx.save();
        ctx.lineWidth = Math.max(1.4, radius * 0.8);
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.arc(centerX, centerY, orbit, angle - 0.24, angle + 0.08);
        ctx.stroke();
        ctx.restore();
        return;
    }
    ctx.beginPath();
    ctx.arc(centerX + Math.cos(angle) * orbit, centerY + Math.sin(angle) * orbit, radius, 0, Math.PI * 2);
    ctx.fill();
}
function drawLonePairs(ctx, atom, state, pairCount, time, settings, orbit = atom.radius + 16) {
    const color = settings.lonePairColor2D;
    const angles = lonePairAngles(atom, state, Math.min(pairCount, 4));
    ctx.save();
    ctx.fillStyle = hexToRgba(color, 0.92);
    ctx.strokeStyle = hexToRgba(color, 0.34);
    ctx.shadowColor = color;
    ctx.shadowBlur = settings.geometry3D && isDetailed(settings) ? 7 : 0;
    for (let i = 0; i < angles.length; i += 1) {
        const angle = angles[i];
        const wobble = Math.sin(time * 1.8 + i * 1.3) * 1.4;
        const cx = atom.x + Math.cos(angle) * (orbit + wobble);
        const cy = atom.y + Math.sin(angle) * (orbit + wobble);
        const tx = -Math.sin(angle);
        const ty = Math.cos(angle);
        const spread = 4.2;
        ctx.globalAlpha = 0.85;
        ctx.beginPath();
        ctx.moveTo(cx - tx * (spread + 1.5), cy - ty * (spread + 1.5));
        ctx.lineTo(cx + tx * (spread + 1.5), cy + ty * (spread + 1.5));
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.arc(cx - tx * spread, cy - ty * spread, 3, 0, Math.PI * 2);
        ctx.arc(cx + tx * spread, cy + ty * spread, 3, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
}
function lonePairAngles(atom, state, count) {
    const neighborAngles = structuralAtomBonds(atom, state).map((bond) => {
        const otherId = bond.a === atom.id ? bond.b : bond.a;
        const other = state.atoms.find((candidate) => candidate.id === otherId);
        return other ? Math.atan2(other.y - atom.y, other.x - atom.x) : undefined;
    }).filter((angle) => angle !== undefined);
    const chosen = [];
    const candidates = Array.from({ length: 16 }, (_, index) => index * Math.PI * 2 / 16);
    while (chosen.length < count) {
        let best = candidates[0];
        let bestScore = -Infinity;
        for (const candidate of candidates) {
            if (chosen.some((angle) => angularDistance(angle, candidate) < 0.42))
                continue;
            const neighborScore = neighborAngles.length ? Math.min(...neighborAngles.map((angle) => angularDistance(angle, candidate))) : Math.PI;
            const pairScore = chosen.length ? Math.min(...chosen.map((angle) => angularDistance(angle, candidate))) * 0.58 : Math.PI * 0.58;
            const score = neighborScore + pairScore;
            if (score > bestScore) {
                bestScore = score;
                best = candidate;
            }
        }
        chosen.push(best);
    }
    return chosen;
}
function angularDistance(a, b) {
    const diff = Math.abs(a - b) % (Math.PI * 2);
    return diff > Math.PI ? Math.PI * 2 - diff : diff;
}
function structuralAtomBonds(atom, state) {
    return state.bonds.filter((bond) => (bond.a === atom.id || bond.b === atom.id) &&
        bond.kind !== "hydrogen" &&
        bond.kind !== "dispersion");
}
function hasStructuralBonds(atom, state) {
    return structuralAtomBonds(atom, state).length > 0;
}
function shouldShowLonePairs(atom) {
    const data = atomData[atom.symbol];
    return !data.metal && !data.nobleGas && data.valenceElectrons > 1;
}
function visibleValenceElectronCount(atom, state) {
    const data = atomData[atom.symbol];
    const bondedOrder = state.bonds
        .filter((bond) => bond.a === atom.id || bond.b === atom.id)
        .reduce((sum, bond) => {
        if (bond.kind === "metallic" || bond.kind === "hydrogen" || bond.kind === "dispersion")
            return sum;
        if (bond.kind === "ionic")
            return sum + Math.max(0, atom.charge);
        return sum + bond.order;
    }, 0);
    return Math.max(0, data.valenceElectrons - bondedOrder);
}
function isRadioactiveLike(symbol, atomicNumber) {
    return atomicNumber >= 84 || symbol === "Tc" || symbol === "Pm";
}
function drawEffect(ctx, state, effect, settings) {
    const from = state.atoms.find((atom) => atom.id === effect.from);
    const to = state.atoms.find((atom) => atom.id === effect.to);
    if (!from || !to || effect.kind === "delocalized")
        return;
    const t = Math.min(1, effect.progress);
    const x = from.x + (to.x - from.x) * t;
    const y = from.y + (to.y - from.y) * t + Math.sin(t * Math.PI) * -28;
    const colors = palette(settings);
    ctx.save();
    ctx.fillStyle = effect.kind === "transfer" ? colors.ionic : electronFill(settings, settings.electronOpacity2D);
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = settings.geometry3D && isDetailed(settings) ? 18 : 0;
    ctx.beginPath();
    ctx.arc(x, y, effect.kind === "transfer" ? 5 : 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}
function drawMetalElectronCloud(ctx, state, width, height, zoom, camera) {
    if (!state.atoms.length)
        return;
    const xs = state.atoms.map((atom) => atom.x);
    const ys = state.atoms.map((atom) => atom.y);
    const worldCenterX = (Math.min(...xs) + Math.max(...xs)) / 2;
    const worldCenterY = (Math.min(...ys) + Math.max(...ys)) / 2;
    const center = worldToScreen(worldCenterX, worldCenterY, width, height, zoom, camera);
    const centerX = center.x;
    const centerY = center.y;
    const latticeRadius = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) * zoom;
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    const broadCloud = ctx.createRadialGradient(centerX, centerY, 18, centerX, centerY, Math.max(latticeRadius * 0.92, 360));
    broadCloud.addColorStop(0, "rgba(56,189,248,0.14)");
    broadCloud.addColorStop(0.42, "rgba(56,189,248,0.075)");
    broadCloud.addColorStop(0.78, "rgba(56,189,248,0.026)");
    broadCloud.addColorStop(1, "rgba(56,189,248,0)");
    ctx.fillStyle = broadCloud;
    ctx.fillRect(0, 0, width, height);
    const warmCore = ctx.createRadialGradient(centerX - latticeRadius * 0.14, centerY + latticeRadius * 0.04, 12, centerX, centerY, Math.max(latticeRadius * 0.58, 230));
    warmCore.addColorStop(0, "rgba(250,204,21,0.07)");
    warmCore.addColorStop(0.7, "rgba(250,204,21,0.018)");
    warmCore.addColorStop(1, "rgba(250,204,21,0)");
    ctx.fillStyle = warmCore;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
}
function drawFreeElectron(ctx, x, y, settings) {
    const colors = palette(settings);
    ctx.save();
    ctx.fillStyle = electronFill(settings, settings.electronOpacity2D);
    ctx.shadowColor = colors.freeElectron;
    ctx.shadowBlur = settings.geometry3D && isDetailed(settings) ? 12 : 0;
    ctx.beginPath();
    ctx.arc(x, y, 3.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}
function nearestAtom(atoms, x, y) {
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
function nearestBond(bonds, atoms, x, y) {
    let best = null;
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
        if (!a || !b)
            continue;
        const distance = distanceToSegment(x, y, a.x, a.y, b.x, b.y);
        if (distance < bestDistance) {
            bestDistance = distance;
            best = bond;
        }
    }
    return best;
}
function distanceToSegment(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lengthSq = dx * dx + dy * dy || 1;
    const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lengthSq));
    const x = x1 + t * dx;
    const y = y1 + t * dy;
    return Math.hypot(px - x, py - y);
}
function drawArrow(ctx, x1, y1, x2, y2, color, width, label, strength = 0.55) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.max(0.01, Math.hypot(dx, dy));
    const ux = dx / length;
    const uy = dy / length;
    const px = -uy;
    const py = ux;
    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 0.2 + strength * 0.24;
    ctx.strokeStyle = color;
    ctx.lineWidth = width + 6;
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
function mixColor(a, b, amount) {
    const ca = parseColor(a);
    const cb = parseColor(b);
    const mix = (left, right) => Math.round(left * (1 - amount) + right * amount);
    return `rgb(${mix(ca.r, cb.r)},${mix(ca.g, cb.g)},${mix(ca.b, cb.b)})`;
}
function hexToRgba(hex, alpha) {
    const color = parseColor(hex);
    return `rgba(${color.r},${color.g},${color.b},${clamp(alpha, 0, 1)})`;
}
function electronFill(settings, alpha) {
    return hexToRgba(settings.electronColor2D, alpha);
}
function parseColor(hex) {
    const clean = hex.replace("#", "");
    const value = Number.parseInt(clean.length === 3 ? clean.split("").map((item) => item + item).join("") : clean, 16);
    return { r: (value >> 16) & 255, g: (value >> 8) & 255, b: value & 255 };
}
export function bondLabel(bond) {
    return bond ? bondKindLabel[bond.kind] : "No bond selected";
}
