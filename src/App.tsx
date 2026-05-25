import { useCallback, useEffect, useMemo, useState } from "react";
import { ChemAiNotes } from "./components/ChemAiNotes";
import { ChemLabViewportControls } from "./components/ChemLabViewportControls";
import { ControlDock } from "./components/ControlDock";
import { ChemistryLabPanel } from "./components/ChemistryLabPanel";
import { ChemistryLabSearch } from "./components/ChemistryLabSearch";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { GraphicsPanel } from "./components/GraphicsPanel";
import { InfoPanel } from "./components/InfoPanel";
import { LearningPanel } from "./components/LearningPanel";
import { Molecule3DView } from "./components/Molecule3DView";
import { PeriodicTable } from "./components/PeriodicTable";
import { ReactionBuilder, ReactionTimeline } from "./components/ReactionBuilder";
import { guidedLessons } from "./data/lessons";
import { SimulationCanvas } from "./components/SimulationCanvas";
import { TimeMetricPanel } from "./components/TimeMetricPanel";
import { TopBar } from "./components/TopBar";
import { useSimulation } from "./hooks/useSimulation";
import type { ChemistryInspectTarget } from "./types";
import "./styles.css";

export function App() {
  const sim = useSimulation();
  const [showGraphics, setShowGraphics] = useState(false);
  const [activeGuidedLessonId, setActiveGuidedLessonId] = useState<string | null>(null);
  const [chemHighlights, setChemHighlights] = useState<{ atomIds: string[]; bondIds: string[] }>({ atomIds: [], bondIds: [] });

  const activeLesson = sim.mode === "guided" ? guidedLessons.find((l) => l.id === activeGuidedLessonId) : undefined;
  const forcedViewport = activeLesson?.forceView ?? null;
  const isCompositionMode = sim.mode === "composition";
  const highlightedAtomIds = useMemo(
    () => isCompositionMode ? uniqueIds([...sim.highlightedAtomIds, ...(sim.selectedAtom?.id ? [sim.selectedAtom.id] : []), ...chemHighlights.atomIds, ...(sim.reactionPreview?.affectedAtomIds ?? [])]) : sim.highlightedAtomIds,
    [chemHighlights.atomIds, isCompositionMode, sim.highlightedAtomIds, sim.selectedAtom?.id, sim.reactionPreview]
  );
  const highlightedBondIds = useMemo(
    () => isCompositionMode ? uniqueIds([...sim.highlightedBondIds, ...chemHighlights.bondIds, ...(sim.reactionPreview?.affectedBondIds ?? []), ...(sim.reactionPreview?.breakingBondIds ?? [])]) : sim.highlightedBondIds,
    [chemHighlights.bondIds, isCompositionMode, sim.highlightedBondIds, sim.reactionPreview]
  );

  const inspectChemTarget = useCallback((target: ChemistryInspectTarget) => {
    const atomIds = uniqueIds(target.atomIds ?? []);
    const bondIds = uniqueIds(target.bondIds ?? []);
    setChemHighlights({ atomIds, bondIds });

    if (target.selectBondId) {
      sim.selectBond(target.selectBondId);
      return;
    }
    if (target.selectAtomId) {
      sim.selectAtom(target.selectAtomId);
      return;
    }
    if (bondIds[0]) {
      sim.selectBond(bondIds[0]);
      return;
    }
    sim.selectAtom(atomIds[0] ?? null);
  }, [sim.selectAtom, sim.selectBond]);

  useEffect(() => {
    if (sim.mode === "guided" && !sim.activePreset) sim.loadPreset("h2", "guided");
    if (sim.mode === "presets" && !sim.activePreset) sim.loadPreset("h2o", "presets");
    if (sim.mode === "composition") {
      if (!sim.activePreset) sim.loadPreset("h2o", "composition");
      sim.setIsRunning(false);
      sim.updateSetting("analysisMode", "chemistry");
      sim.updateSetting("displayMode", "full");
      sim.updateSetting("showLabels", false);
      sim.updateSetting("showBondTypes", false);
      sim.updateSetting("showBondDipoles", false);
      sim.updateSetting("showFunctionalGroups", false);
      sim.updateSetting("showMechanismHandles", false);
    }
    if (sim.mode === "free" && sim.activePreset) sim.resetFree();
  }, [sim.mode]);

  useEffect(() => {
    if (!isCompositionMode) setChemHighlights({ atomIds: [], bondIds: [] });
  }, [isCompositionMode]);

  useEffect(() => {
    setChemHighlights({ atomIds: [], bondIds: [] });
  }, [sim.activePreset?.id]);

  useEffect(() => {
    if (!showGraphics) return;
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      if (target?.closest(".visuals-popover, .visuals-toggle-button")) return;
      setShowGraphics(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setShowGraphics(false);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [showGraphics]);

  const renderInfoPanel = (section: "all" | "inspection" | "bond" = "all") => (
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
      reactionPreview={sim.reactionPreview}
      selectedElectronSource={sim.selectedElectronSource}
      selectedElectronTarget={sim.selectedElectronTarget}
      onSetAtomIsotope={sim.editAtomIsotope}
      onSetAtomNeutrons={sim.editAtomNeutrons}
      onSetAtomProtons={sim.editAtomProtons}
      section={section}
    />
  );

  const chemistryLabPanel = (
    <ChemistryLabPanel
      state={sim.state}
      activePreset={sim.activePreset}
      onInspectTarget={inspectChemTarget}
    />
  );

  const chemistryLabSearch = (
    <ChemistryLabSearch
      activePreset={sim.activePreset}
      compact
      onPreset={(id) => {
        sim.loadPreset(id, "composition");
        sim.setIsRunning(false);
      }}
      onMoleculePreset={(preset) => {
        sim.loadMoleculePreset(preset, "composition");
        sim.setIsRunning(false);
      }}
    />
  );
  const chemistryLabViewportSearch = isCompositionMode ? (
    <div className="viewport-chem-search">
      {chemistryLabSearch}
    </div>
  ) : undefined;
  const timeMetricPanel = (
    <TimeMetricPanel
      timeSeconds={sim.state.time}
      timeMultiplier={sim.settings.timeMultiplier}
      displayMode={sim.settings.timeDisplayMode}
      onDisplayMode={(mode) => sim.updateSetting("timeDisplayMode", mode)}
      compact={isCompositionMode}
    />
  );

  const viewport = sim.settings.geometry3D && forcedViewport !== "2d" ? (
    <ErrorBoundary key="3d-view">
      <Molecule3DView
          state={sim.state}
          settings={sim.settings}
          running={sim.isRunning}
          width={sim.size.width}
          height={sim.size.height}
          onResize={sim.setCanvasSize}
        onSelectAtom={sim.selectAtom}
          onSelectBond={sim.selectBond}
          onZoom={(zoom) => sim.updateSetting("zoom", zoom)}
          onToggle3D={() => sim.updateSetting("geometry3D", false)}
          highlightedAtomIds={highlightedAtomIds}
          highlightedBondIds={highlightedBondIds}
          reactionPreview={isCompositionMode ? sim.reactionPreview : null}
          electronSources={isCompositionMode ? sim.electronSources : []}
          electronTargets={isCompositionMode ? sim.electronTargets : []}
          selectedElectronSourceId={sim.selectedElectronSourceId}
          selectedElectronTargetId={sim.selectedElectronTargetId}
          onElectronSourceSelect={sim.setSelectedElectronSourceId}
          onElectronTargetSelect={sim.setSelectedElectronTargetId}
          onPreviewMechanism={sim.previewMechanismGesture}
          onCommitMechanism={sim.commitMechanismGesture}
          onPreviewReaction={sim.previewReactionAction}
          onCommitReaction={sim.commitReactionAction}
          onClearReactionPreview={sim.clearReactionPreview}
          onBondOrderShortcut={sim.previewBondOrderShortcut}
          viewportOverlay={chemistryLabViewportSearch}
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
      onDeleteAtom={sim.deleteAtom}
      onZoom={(zoom) => sim.updateSetting("zoom", zoom)}
      onCameraPreset={(preset) => sim.updateSetting("cameraPreset", preset)}
      onToggle3D={forcedViewport === "2d" ? () => {} : () => sim.updateSetting("geometry3D", true)}
      onFlingAtom={sim.settings.geometryMode === "flexible" ? sim.flingAtom : undefined}
      lessonAnnotations={sim.lessonAnnotations}
      highlightedAtomIds={highlightedAtomIds}
      highlightedBondIds={highlightedBondIds}
      reactionPreview={isCompositionMode ? sim.reactionPreview : null}
      electronSources={isCompositionMode ? sim.electronSources : []}
      electronTargets={isCompositionMode ? sim.electronTargets : []}
      selectedElectronSourceId={sim.selectedElectronSourceId}
      selectedElectronTargetId={sim.selectedElectronTargetId}
      onElectronSourceSelect={sim.setSelectedElectronSourceId}
      onElectronTargetSelect={sim.setSelectedElectronTargetId}
      onPreviewMechanism={sim.previewMechanismGesture}
      onCommitMechanism={sim.commitMechanismGesture}
      onPreviewReaction={sim.previewReactionAction}
      onCommitReaction={sim.commitReactionAction}
      onClearReactionPreview={sim.clearReactionPreview}
      onBondOrderShortcut={sim.previewBondOrderShortcut}
      lessonStepText={sim.lessonStepText}
      lessonStepIndex={sim.lessonStepIndex}
      lessonTotalSteps={sim.lessonTotalSteps}
      animParts={sim.animParts}
      revealedCount={sim.revealedCount}
      viewportOverlay={chemistryLabViewportSearch}
    />
  );

  const viewportWithTimeline = isCompositionMode ? (
    <div className="chem-lab-viewport-row">
      <div className="chem-lab-viewport-main">
        {viewport}
      </div>
      <aside className="chem-lab-timeline-rail" aria-label="Reaction timeline">
        {timeMetricPanel}
        <ReactionTimeline
          pastEntries={sim.reactionPast}
          futureEntries={sim.reactionFuture}
          timeDisplayMode={sim.settings.timeDisplayMode}
          onInspectTarget={inspectChemTarget}
          onJumpToTime={sim.jumpToReactionTime}
        />
      </aside>
    </div>
  ) : viewport;

  return (
    <main className={`app-shell ${sim.settings.theme}`}>
      <TopBar
        mode={sim.mode}
        theme={sim.settings.theme}
        running={sim.isRunning}
        showGraphics={showGraphics}
        timeMultiplier={sim.settings.timeMultiplier}
        onMode={sim.setMode}
        onTheme={() => sim.updateSetting("theme", sim.settings.theme === "dark" ? "light" : "dark")}
        onToggleRun={() => sim.setIsRunning(!sim.isRunning)}
        onReset={sim.reset}
        onToggleGraphics={() => setShowGraphics((prev) => !prev)}
        onTimeMultiplier={(value) => sim.updateSetting("timeMultiplier", value)}
      />
      {showGraphics && (
        <div className="visuals-popover" role="dialog" aria-label="Visual settings">
          <GraphicsPanel
            settings={sim.settings}
            onSetting={sim.updateSetting}
            onClose={() => setShowGraphics(false)}
          />
        </div>
      )}
      <section className={`workspace ${isCompositionMode ? "composition-workspace" : ""}`}>
        <div className="left-column">
          {viewportWithTimeline}
          {isCompositionMode && (
            <>
              <ChemLabViewportControls
                settings={sim.settings}
                selectedElements={sim.settings.selectedElements}
                onElementClick={(symbol) => sim.spawnAtom(symbol, "composition")}
                onSetting={sim.updateSetting}
              />
              <ReactionBuilder
                state={sim.state}
                preview={sim.reactionPreview}
                steps={sim.reactionSteps}
                settings={sim.settings}
                electronSources={sim.electronSources}
                electronTargets={sim.electronTargets}
                selectedElectronSourceId={sim.selectedElectronSourceId}
                selectedElectronTargetId={sim.selectedElectronTargetId}
                onPreview={sim.previewReactionAction}
                onCommit={sim.commitReactionAction}
                onPreviewMechanism={sim.previewMechanismGesture}
                onCommitMechanism={sim.commitMechanismGesture}
                onClear={sim.clearReactionPreview}
                onUndo={sim.undoReactionStep}
                onRedo={sim.redoReactionStep}
                onSetting={sim.updateSetting}
                onSourceSelect={sim.setSelectedElectronSourceId}
                onTargetSelect={sim.setSelectedElectronTargetId}
                onInspectTarget={inspectChemTarget}
                canUndo={sim.reactionPast.length > 0}
                canRedo={sim.reactionFuture.length > 0}
              />
              <div className="chem-lab-under-viewport">
                <div className="chem-lab-explanation-stack">
                  <ChemAiNotes state={sim.state} activePreset={sim.activePreset} />
                  {renderInfoPanel("bond")}
                </div>
                {renderInfoPanel("inspection")}
                <div className="chem-lab-analysis-slot">
                  {chemistryLabPanel}
                </div>
              </div>
            </>
          )}
          {!isCompositionMode && (
            <PeriodicTable
              selectedElements={sim.settings.selectedElements}
              onElementClick={(symbol) => sim.spawnAtom(symbol)}
            />
          )}
          {!isCompositionMode && (
            <ControlDock settings={sim.settings} atoms={sim.state.atoms} bonds={sim.state.bonds} hydrogenBonds={sim.state.hydrogenBonds} events={sim.state.events} activePreset={sim.activePreset} onSetting={sim.updateSetting} onShareScene={sim.shareScene} onSpawnAtom={sim.spawnAtom} />
          )}
        </div>
        {!isCompositionMode && (
        <div className="right-column">
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
          {sim.mode !== "guided" && timeMetricPanel}
          {!isCompositionMode && renderInfoPanel()}
        </div>
        )}
      </section>
    </main>
  );
}

function uniqueIds(ids: string[]) {
  return [...new Set(ids.filter(Boolean))];
}
