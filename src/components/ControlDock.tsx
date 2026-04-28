import { Box, Eye, EyeOff, Gauge, Orbit, Palette, Plus, Share2, SlidersHorizontal, Sparkles, ZoomIn } from "lucide-react";
import type { CSSProperties } from "react";
import { atomData, elementGroups } from "../data/atoms";
import type { AtomSymbol, SimulationSettings } from "../types";

type Props = {
  settings: SimulationSettings;
  onSetting: <K extends keyof SimulationSettings>(key: K, value: SimulationSettings[K]) => void;
  onSpawnAtoms: () => void;
  onShareScene: () => void;
};

export function ControlDock({ settings, onSetting, onSpawnAtoms, onShareScene }: Props) {
  const toggleElement = (symbol: AtomSymbol) => {
    const exists = settings.selectedElements.includes(symbol);
    const next = exists
      ? settings.selectedElements.filter((item) => item !== symbol)
      : [...settings.selectedElements, symbol];
    onSetting("selectedElements", next.length ? next : [symbol]);
  };

  return (
    <section className="control-dock" aria-label="Simulation controls">
      <div className="dock-title">
        <SlidersHorizontal size={18} />
        <h2>Controls</h2>
      </div>
      <div className="control-grid">
        <Slider label="Temperature" title="Higher temperature makes atoms move faster." value={settings.temperature} min={0.1} max={1.8} step={0.05} onChange={(value) => onSetting("temperature", value)} />
        <Slider label="Speed" title="Overall simulation playback speed." value={settings.speed} min={0.2} max={2.4} step={0.05} onChange={(value) => onSetting("speed", value)} />
        <Slider label="Collision" title="How strongly atoms bounce when they do not bond." value={settings.collisionStrength} min={0.2} max={1.4} step={0.05} onChange={(value) => onSetting("collisionStrength", value)} />
        <Slider label="EN difference" title="Emphasizes electronegativity difference when classifying bonds." value={settings.electronegativityEmphasis} min={0.7} max={1.5} step={0.05} onChange={(value) => onSetting("electronegativityEmphasis", value)} />
        <Slider label="Bond distance" title="How close atoms must be before bond rules are tested." value={settings.bondingDistance} min={1.45} max={2.8} step={0.05} onChange={(value) => onSetting("bondingDistance", value)} />
        <Slider label="Relaxation" title="How strongly VSEPR angles, bond lengths, and atom spacing settle the molecule." value={settings.relaxationStrength} min={0} max={1.2} step={0.05} onChange={(value) => onSetting("relaxationStrength", value)} />
        <Slider label="Zoom" title="Scale the simulation viewport without changing the chemistry." value={settings.zoom} min={0.55} max={2.2} step={0.05} onChange={(value) => onSetting("zoom", value)} />
      </div>
      <div className="element-board" aria-label="Choose atom types by group">
        {elementGroups.map((group) => (
          <div className="element-group" key={group.id}>
            <div className="element-group-title">{group.label}</div>
            <div className="element-picker">
              {group.symbols.map((symbol) => {
                const atom = atomData[symbol];
                return (
                  <button
                    key={atom.symbol}
                    className={settings.selectedElements.includes(atom.symbol) ? "selected" : ""}
                    style={{ "--atom-color": atom.color } as CSSProperties}
                    title={`${atom.name}: ${atom.behavior}`}
                    onClick={() => toggleElement(atom.symbol)}
                  >
                    {atom.symbol}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <div className="spawn-row">
        <button className="spawn-button primary" title="Add one selected atom to the free simulation" onClick={onSpawnAtoms}>
          <Plus size={16} />
          Spawn one atom
        </button>
        <button className="spawn-button" title="Copy a shareable link for the current scene" onClick={onShareScene}>
          <Share2 size={16} />
          Share scene
        </button>
      </div>
      <div className="visual-row" aria-label="Visual model">
        <button className={settings.visualStyle === "detailed" ? "visual-choice active" : "visual-choice"} title="Detailed model with shaded atoms and glow effects" onClick={() => onSetting("visualStyle", "detailed")}>
          <Sparkles size={16} />
          Glow
        </button>
        <button className={settings.visualStyle === "simple-neutral" ? "visual-choice active" : "visual-choice"} title="Simplified model with flat neutral atoms and no glow" onClick={() => onSetting("visualStyle", "simple-neutral")}>
          Simple
        </button>
        <button className={settings.visualStyle === "simple-colored" ? "visual-choice active" : "visual-choice"} title="Simplified model with flat element colors and no glow" onClick={() => onSetting("visualStyle", "simple-colored")}>
          <Palette size={16} />
          Color
        </button>
      </div>
      {settings.geometry3D && (
        <div className="projection-row" aria-label="3D projection">
          <button className={settings.projectionMode === "orthographic" ? "visual-choice active" : "visual-choice"} title="Flatten depth for a clean structural comparison" onClick={() => onSetting("projectionMode", "orthographic")}>
            Ortho
          </button>
          <button className={settings.projectionMode === "soft-perspective" ? "visual-choice active" : "visual-choice"} title="Use gentle perspective depth for stable 3D viewing" onClick={() => onSetting("projectionMode", "soft-perspective")}>
            Soft
          </button>
          <button className={settings.projectionMode === "deep-perspective" ? "visual-choice active" : "visual-choice"} title="Use stronger perspective for clearer front-to-back depth" onClick={() => onSetting("projectionMode", "deep-perspective")}>
            Deep
          </button>
        </div>
      )}
      <div className="toggle-row">
        <button className={settings.showShells ? "toggle active" : "toggle"} title="Show or hide electron shells" onClick={() => onSetting("showShells", !settings.showShells)}>
          {settings.showShells ? <Eye size={16} /> : <EyeOff size={16} />}
          Shells
        </button>
        <button className={settings.showLabels ? "toggle active" : "toggle"} title="Show or hide atom names" onClick={() => onSetting("showLabels", !settings.showLabels)}>
          {settings.showLabels ? <Eye size={16} /> : <EyeOff size={16} />}
          Labels
        </button>
        <button className={settings.advanced ? "toggle active" : "toggle"} title="Switch between plain and deeper explanation text" onClick={() => onSetting("advanced", !settings.advanced)}>
          <Gauge size={16} />
          Advanced
        </button>
        <button className={settings.geometryAssist ? "toggle active" : "toggle"} title="Use VSEPR angle targets and relaxation forces to settle molecule shapes" onClick={() => onSetting("geometryAssist", !settings.geometryAssist)}>
          <Orbit size={16} />
          Geometry
        </button>
        <button className={settings.geometry3D ? "toggle active" : "toggle"} title="Project VSEPR geometry with depth for tetrahedral and other 3D shapes" onClick={() => onSetting("geometry3D", !settings.geometry3D)}>
          <Box size={16} />
          3D
        </button>
        <button className="toggle" title="Reset zoom to the default view" onClick={() => onSetting("zoom", 1)}>
          <ZoomIn size={16} />
          100%
        </button>
      </div>
    </section>
  );
}

function Slider({ label, title, value, min, max, step, onChange }: {
  label: string;
  title: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="slider" title={title}>
      <span>
        {label}
        <strong>{Number.isInteger(value) ? value : value.toFixed(2)}</strong>
      </span>
      <input type="range" value={value} min={min} max={max} step={step} onChange={(event) => onChange(Number(event.target.value))} />
    </label>
  );
}
