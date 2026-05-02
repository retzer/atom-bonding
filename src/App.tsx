import { useEffect, useState } from "react";
import { ControlDock } from "./components/ControlDock";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { GraphicsPanel } from "./components/GraphicsPanel";
import { InfoPanel } from "./components/InfoPanel";
import { LearningPanel } from "./components/LearningPanel";
import { Molecule3DView } from "./components/Molecule3DView";
import { PeriodicTable } from "./components/PeriodicTable";
import { guidedLessons } from "./data/lessons";
import { SimulationCanvas } from "./components/SimulationCanvas";
import { TopBar } from "./components/TopBar";
import { useSimulation } from "./hooks/useSimulation";
import "./styles.css";

export function App() {
  const sim = useSimulation();
  const [showGraphics, setShowGraphics] = useState(false);
  const [activeGuidedLessonId, setActiveGuidedLessonId] = useState<string | null>(null);

  const activeLesson = sim.mode === "guided" ? guidedLessons.find((l) => l.id === activeGuidedLessonId) : undefined;
  const forcedViewport = activeLesson?.forceView ?? null;

  useEffect(() => {
    if (sim.mode === "guided" && !sim.activePreset) sim.loadPreset("h2", "guided");
    if (sim.mode === "presets" && !sim.activePreset) sim.loadPreset("h2o", "presets");
    if (sim.mode === "free" && sim.activePreset) sim.resetFree();
  }, [sim.mode]);

  return (
    <main className={`app-shell ${sim.settings.theme}`}>
      <TopBar
        mode={sim.mode}
        theme={sim.settings.theme}
        running={sim.isRunning}
        showGraphics={showGraphics}
        onMode={sim.setMode}
        onTheme={() => sim.updateSetting("theme", sim.settings.theme === "dark" ? "light" : "dark")}
        onToggleRun={() => sim.setIsRunning(!sim.isRunning)}
        onReset={sim.reset}
        onToggleGraphics={() => setShowGraphics((prev) => !prev)}
      />
      <section className="workspace">
        <div className="left-column">
          {sim.settings.geometry3D && forcedViewport !== "2d" ? (
            <ErrorBoundary key="3d-view">
              <Molecule3DView
                  state={sim.state}
                  settings={sim.settings}
                  running={sim.isRunning}
                  width={sim.size.width}
                  height={sim.size.height}
                  onResize={sim.setCanvasSize}
                  onSelectAtom={sim.selectAtom}
                  onZoom={(zoom) => sim.updateSetting("zoom", zoom)}
                  onToggle3D={() => sim.updateSetting("geometry3D", false)}
                />
            </ErrorBoundary>
          ) : (
            <SimulationCanvas
              state={sim.state}
              settings={sim.settings}
              width={sim.size.width}
              height={sim.size.height}
              onResize={sim.setCanvasSize}
              onSelectAtom={sim.selectAtom}
              onSelectBond={sim.selectBond}
              onMoveAtom={sim.moveAtom}
              onZoom={(zoom) => sim.updateSetting("zoom", zoom)}
              onToggle3D={forcedViewport === "2d" ? () => {} : () => sim.updateSetting("geometry3D", true)}
              onFlingAtom={sim.settings.geometryMode === "flexible" ? sim.flingAtom : undefined}
              lessonAnnotations={sim.lessonAnnotations}
              highlightedAtomIds={sim.highlightedAtomIds}
              highlightedBondIds={sim.highlightedBondIds}
              lessonStepText={sim.lessonStepText}
              lessonStepIndex={sim.lessonStepIndex}
              lessonTotalSteps={sim.lessonTotalSteps}
              animParts={sim.animParts}
              revealedCount={sim.revealedCount}
            />
          )}
          <PeriodicTable
            selectedElements={sim.settings.selectedElements}
            onElementClick={(symbol) => sim.spawnAtom(symbol)}
          />
          <ControlDock settings={sim.settings} atoms={sim.state.atoms} bonds={sim.state.bonds} hydrogenBonds={sim.state.hydrogenBonds} events={sim.state.events} activePreset={sim.activePreset} onSetting={sim.updateSetting} onShareScene={sim.shareScene} onSpawnAtom={sim.spawnAtom} />
        </div>
        <div className="right-column">
          {showGraphics && (
            <GraphicsPanel
              settings={sim.settings}
              onSetting={sim.updateSetting}
              onClose={() => setShowGraphics(false)}
            />
          )}
          <LearningPanel
            mode={sim.mode}
            activePresetId={sim.activePreset?.id}
            canFormGlucoseRing={sim.activePreset?.id === "glucose-linear"}
            canSelectGlucoseAnomer={["glucose-linear", "glucose-ring", "glucose-alpha", "glucose-beta"].includes(sim.activePreset?.id ?? "")}
            glucoseAnomer={sim.glucoseAnomer}
            glucoseStage={sim.glucoseStage}
            onFormGlucoseRing={sim.formGlucoseRing}
            onGlucoseAnomer={sim.setGlucoseAnomerTarget}
            onPreset={(id) => sim.loadPreset(id, sim.mode === "guided" ? "guided" : "presets")}
            onMoleculePreset={(preset) => sim.loadMoleculePreset(preset, sim.mode === "guided" ? "guided" : "presets")}
            onSetLessonAnnotations={sim.setLessonState}
            onClearLesson={sim.clearLessonState}
            addLessonAtom={sim.addLessonAtom}
            moveLessonAtom={sim.moveLessonAtom}
            bondLessonAtoms={sim.bondLessonAtoms}
            addLessonParticles={sim.addLessonParticles}
            clearLessonAtoms={sim.clearLessonAtoms}
            onActiveLessonChange={setActiveGuidedLessonId}
          />
          <InfoPanel
            atom={sim.selectedAtom}
            bond={sim.selectedBond}
            atoms={sim.state.atoms}
            bonds={sim.state.bonds}
            hydrogenBonds={sim.state.hydrogenBonds}
            molecule={sim.selectedMolecule}
            events={sim.state.events}
            settings={sim.settings}
            activePreset={sim.activePreset}
          />
        </div>
      </section>
    </main>
  );
}
