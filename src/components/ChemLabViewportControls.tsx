import { Atom, Move3D } from "lucide-react";
import { ChemLabElementPicker } from "./ChemLabElementPicker";
import type { AtomSymbol, GeometryMode, SimulationSettings } from "../types";

type Props = {
  settings: SimulationSettings;
  selectedElements: AtomSymbol[];
  onElementClick: (symbol: AtomSymbol) => void;
  onSetting: <K extends keyof SimulationSettings>(key: K, value: SimulationSettings[K]) => void;
};

export function ChemLabViewportControls({ settings, selectedElements, onElementClick, onSetting }: Props) {
  const setGeometryMode = (mode: GeometryMode) => {
    onSetting("geometryMode", mode);
    onSetting("geometryAssist", true);
    onSetting("relaxationStrength", mode === "rigid" ? 1.2 : 0.72);
  };

  return (
    <section className="chem-viewport-controls">
      <div className="chem-viewport-control-title">
        <Move3D size={17} />
        <div>
          <h3>Molecule Motion</h3>
          <p>{settings.geometryMode === "rigid" ? "Rigid keeps imported structures steady for analysis." : "Flexible lets bonds and angles breathe while preserving the structure."}</p>
        </div>
      </div>
      <div className="chem-segmented-control" aria-label="Chemistry Lab geometry mode">
        <button type="button" className={settings.geometryMode === "rigid" ? "active" : ""} onClick={() => setGeometryMode("rigid")}>
          <Atom size={15} />
          <span>Rigid</span>
        </button>
        <button type="button" className={settings.geometryMode === "flexible" ? "active" : ""} onClick={() => setGeometryMode("flexible")}>
          <Atom size={15} />
          <span>Flexible</span>
        </button>
      </div>
      <ChemLabElementPicker selectedElements={selectedElements} onElementClick={onElementClick} />
      <div className="source-line">
        <span>Local VSEPR geometry</span>
        <span>Local relaxation model</span>
        <span>Compact periodic table</span>
      </div>
    </section>
  );
}
