import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { ControlDock } from "./components/ControlDock.js";
import { ErrorBoundary } from "./components/ErrorBoundary.js";
import { GraphicsPanel } from "./components/GraphicsPanel.js";
import { InfoPanel } from "./components/InfoPanel.js";
import { LearningPanel } from "./components/LearningPanel.js";
import { Molecule3DView } from "./components/Molecule3DView.js";
import { PeriodicTable } from "./components/PeriodicTable.js";
import { guidedLessons } from "./data/lessons.js";
import { SimulationCanvas } from "./components/SimulationCanvas.js";
import { TopBar } from "./components/TopBar.js";
import { useSimulation } from "./hooks/useSimulation.js";
export function App() {
    const sim = useSimulation();
    const [showGraphics, setShowGraphics] = useState(false);
    const [activeGuidedLessonId, setActiveGuidedLessonId] = useState(null);
    const activeLesson = sim.mode === "guided" ? guidedLessons.find((l) => l.id === activeGuidedLessonId) : undefined;
    const forcedViewport = activeLesson?.forceView ?? null;
    useEffect(() => {
        if (sim.mode === "guided" && !sim.activePreset)
            sim.loadPreset("h2", "guided");
        if (sim.mode === "presets" && !sim.activePreset)
            sim.loadPreset("h2o", "presets");
        if (sim.mode === "free" && sim.activePreset)
            sim.resetFree();
    }, [sim.mode]);
    return (_jsxs("main", { className: `app-shell ${sim.settings.theme}`, children: [_jsx(TopBar, { mode: sim.mode, theme: sim.settings.theme, running: sim.isRunning, showGraphics: showGraphics, onMode: sim.setMode, onTheme: () => sim.updateSetting("theme", sim.settings.theme === "dark" ? "light" : "dark"), onToggleRun: () => sim.setIsRunning(!sim.isRunning), onReset: sim.reset, onToggleGraphics: () => setShowGraphics((prev) => !prev) }), _jsxs("section", { className: "workspace", children: [_jsxs("div", { className: "left-column", children: [sim.settings.geometry3D && forcedViewport !== "2d" ? (_jsx(ErrorBoundary, { children: _jsx(Molecule3DView, { state: sim.state, settings: sim.settings, running: sim.isRunning, width: sim.size.width, height: sim.size.height, onResize: sim.setCanvasSize, onSelectAtom: sim.selectAtom, onZoom: (zoom) => sim.updateSetting("zoom", zoom), onToggle3D: () => sim.updateSetting("geometry3D", false) }) }, "3d-view")) : (_jsx(SimulationCanvas, { state: sim.state, settings: sim.settings, width: sim.size.width, height: sim.size.height, onResize: sim.setCanvasSize, onSelectAtom: sim.selectAtom, onSelectBond: sim.selectBond, onMoveAtom: sim.moveAtom, onZoom: (zoom) => sim.updateSetting("zoom", zoom), onCameraPreset: (preset) => sim.updateSetting("cameraPreset", preset), onToggle3D: forcedViewport === "2d" ? () => { } : () => sim.updateSetting("geometry3D", true), onFlingAtom: sim.settings.geometryMode === "flexible" ? sim.flingAtom : undefined, lessonAnnotations: sim.lessonAnnotations, highlightedAtomIds: sim.highlightedAtomIds, highlightedBondIds: sim.highlightedBondIds, lessonStepText: sim.lessonStepText, lessonStepIndex: sim.lessonStepIndex, lessonTotalSteps: sim.lessonTotalSteps, animParts: sim.animParts, revealedCount: sim.revealedCount })), _jsx(PeriodicTable, { selectedElements: sim.settings.selectedElements, onElementClick: (symbol) => sim.spawnAtom(symbol) }), _jsx(ControlDock, { settings: sim.settings, atoms: sim.state.atoms, bonds: sim.state.bonds, hydrogenBonds: sim.state.hydrogenBonds, events: sim.state.events, activePreset: sim.activePreset, onSetting: sim.updateSetting, onShareScene: sim.shareScene, onSpawnAtom: sim.spawnAtom })] }), _jsxs("div", { className: "right-column", children: [showGraphics && (_jsx(GraphicsPanel, { settings: sim.settings, onSetting: sim.updateSetting, onClose: () => setShowGraphics(false) })), _jsx(LearningPanel, { mode: sim.mode, activePresetId: sim.activePreset?.id, canFormGlucoseRing: sim.activePreset?.id === "glucose-linear", canSelectGlucoseAnomer: ["glucose-linear", "glucose-ring", "glucose-alpha", "glucose-beta"].includes(sim.activePreset?.id ?? ""), glucoseAnomer: sim.glucoseAnomer, glucoseStage: sim.glucoseStage, onFormGlucoseRing: sim.formGlucoseRing, onGlucoseAnomer: sim.setGlucoseAnomerTarget, onPreset: (id) => sim.loadPreset(id, sim.mode === "guided" ? "guided" : "presets"), onMoleculePreset: (preset) => sim.loadMoleculePreset(preset, sim.mode === "guided" ? "guided" : "presets"), onSetLessonAnnotations: sim.setLessonState, onClearLesson: sim.clearLessonState, addLessonAtom: sim.addLessonAtom, moveLessonAtom: sim.moveLessonAtom, bondLessonAtoms: sim.bondLessonAtoms, addLessonParticles: sim.addLessonParticles, clearLessonAtoms: sim.clearLessonAtoms, onActiveLessonChange: setActiveGuidedLessonId }), _jsx(InfoPanel, { atom: sim.selectedAtom, bond: sim.selectedBond, atoms: sim.state.atoms, bonds: sim.state.bonds, hydrogenBonds: sim.state.hydrogenBonds, molecule: sim.selectedMolecule, events: sim.state.events, settings: sim.settings, activePreset: sim.activePreset })] })] })] }));
}
