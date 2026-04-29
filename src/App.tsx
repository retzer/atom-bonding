import { useEffect } from "react";
import { ControlDock } from "./components/ControlDock";
import { InfoPanel } from "./components/InfoPanel";
import { LearningPanel } from "./components/LearningPanel";
import { Molecule3DView } from "./components/Molecule3DView";
import { SimulationCanvas } from "./components/SimulationCanvas";
import { TopBar } from "./components/TopBar";
import { useSimulation } from "./hooks/useSimulation";
import "./styles.css";

export function App() {
  const sim = useSimulation();

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
        onMode={sim.setMode}
        onTheme={() => sim.updateSetting("theme", sim.settings.theme === "dark" ? "light" : "dark")}
        onToggleRun={() => sim.setIsRunning(!sim.isRunning)}
        onReset={sim.reset}
      />
      <section className="workspace">
        <div className="left-column">
          {sim.settings.geometry3D ? (
            <Molecule3DView
              state={sim.state}
              settings={sim.settings}
              running={sim.isRunning}
              width={sim.size.width}
              height={sim.size.height}
              onResize={sim.setCanvasSize}
              onSelectAtom={sim.selectAtom}
              onZoom={(zoom) => sim.updateSetting("zoom", zoom)}
            />
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
            />
          )}
          <ControlDock settings={sim.settings} onSetting={sim.updateSetting} onShareScene={sim.shareScene} onSpawnAtoms={() => {
            sim.setMode("free");
            sim.spawnFreeAtoms();
          }} />
        </div>
        <div className="right-column">
          <LearningPanel
            mode={sim.mode}
            activePresetId={sim.activePreset?.id}
            onPreset={(id) => sim.loadPreset(id, sim.mode === "guided" ? "guided" : "presets")}
            onMoleculePreset={(preset) => sim.loadMoleculePreset(preset, sim.mode === "guided" ? "guided" : "presets")}
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
