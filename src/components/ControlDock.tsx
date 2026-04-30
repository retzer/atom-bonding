import { Box, Eye, EyeOff, Focus, Gauge, Lightbulb, MousePointer2, Orbit, Palette, Plus, Share2, SlidersHorizontal, Sparkles, Tags, Waves, Zap, ZoomIn } from "lucide-react";
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
  const selectElement = (symbol: AtomSymbol) => {
    onSetting("selectedElements", [symbol]);
  };

  return (
    <section className="control-dock" aria-label="Simulation controls">
      <div className="dock-title">
        <SlidersHorizontal size={18} />
        <h2>Controls</h2>
      </div>
      <div className="control-section">
        <div className="control-section-title">Physics</div>
        <div className="control-grid compact-grid">
          <Slider label="Temperature" title="Higher temperature makes atoms move faster." value={settings.temperature} min={0.1} max={1.8} step={0.05} onChange={(value) => onSetting("temperature", value)} />
          <Slider label="Speed" title="Overall simulation playback speed." value={settings.speed} min={0.2} max={2.4} step={0.05} onChange={(value) => onSetting("speed", value)} />
          <Slider label="Collision" title="How strongly atoms bounce when they do not bond." value={settings.collisionStrength} min={0.2} max={1.4} step={0.05} onChange={(value) => onSetting("collisionStrength", value)} />
          <Slider label="EN difference" title="Emphasizes electronegativity difference when classifying bonds." value={settings.electronegativityEmphasis} min={0.7} max={1.5} step={0.05} onChange={(value) => onSetting("electronegativityEmphasis", value)} />
          <Slider label="Bond distance" title="How close atoms must be before bond rules are tested." value={settings.bondingDistance} min={1.45} max={2.8} step={0.05} onChange={(value) => onSetting("bondingDistance", value)} />
          <Slider label="Zoom" title="Scale the simulation viewport without changing the chemistry." value={settings.zoom} min={0.55} max={2.2} step={0.05} onChange={(value) => onSetting("zoom", value)} />
        </div>
        <div className="projection-row" aria-label="Geometry behavior">
          <button className={settings.geometryMode === "rigid" ? "visual-choice active" : "visual-choice"} title="Strict textbook VSEPR geometry with minimal exploratory motion" onClick={() => onSetting("geometryMode", "rigid")}>
            <Orbit size={15} />
            Rigid
          </button>
          <button className={settings.geometryMode === "flexible" ? "visual-choice active" : "visual-choice"} title="Flexible exploration mode with gentle motion and spacing response" onClick={() => onSetting("geometryMode", "flexible")}>
            <Waves size={15} />
            Flexible
          </button>
        </div>
      </div>
      <div className="control-section">
        <div className="control-section-title">Elements</div>
        <div className="element-board" aria-label="Choose an atom type by group">
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
                      onClick={() => selectElement(atom.symbol)}
                    >
                      {atom.symbol}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="control-section control-section-inline">
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
        <div className="projection-row" aria-label="Graphics quality">
          {(["low", "medium", "high", "very-high"] as const).map((quality) => (
            <button
              key={quality}
              className={settings.graphicsQuality === quality ? "visual-choice active" : "visual-choice"}
              title={`Use ${quality.replace("-", " ")} graphics quality`}
              onClick={() => onSetting("graphicsQuality", quality)}
            >
              <Gauge size={15} />
              {quality === "very-high" ? "Very high" : quality[0].toUpperCase() + quality.slice(1)}
            </button>
          ))}
        </div>
        <div className="projection-row" aria-label="Analysis mode">
          <button className={settings.analysisMode === "structure" ? "visual-choice active" : "visual-choice"} title="Clean structural view with zoom-based abstraction" onClick={() => onSetting("analysisMode", "structure")}>
            <Box size={15} />
            Structure
          </button>
          <button className={settings.analysisMode === "chemistry" ? "visual-choice active" : "visual-choice"} title="Full chemistry view with charges, dipoles, regions, and electron detail" onClick={() => onSetting("analysisMode", "chemistry")}>
            <Lightbulb size={15} />
            Chemistry
          </button>
        </div>
        <div className="projection-row" aria-label="Structure detail">
          {(["full", "simplified", "skeleton"] as const).map((mode) => (
            <button key={mode} className={settings.displayMode === mode ? "visual-choice active" : "visual-choice"} title={`Use ${mode} structure display`} onClick={() => onSetting("displayMode", mode)}>
              {mode[0].toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>
      </div>
      {settings.geometry3D && (
        <div className="control-section">
          <div className="control-section-title">3D View</div>
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
          <div className="projection-row" aria-label="3D camera presets">
            {(["free", "isometric", "top", "side"] as const).map((preset) => (
              <button key={preset} className={settings.cameraPreset === preset ? "visual-choice active" : "visual-choice"} title={`Use ${preset} camera view`} onClick={() => onSetting("cameraPreset", preset)}>
                <MousePointer2 size={15} />
                {preset[0].toUpperCase() + preset.slice(1)}
              </button>
            ))}
          </div>
          <div className="control-grid lighting-grid" aria-label="Lighting controls">
            <Slider label="Light yaw" title="Move the light around the molecule horizontally." value={settings.lightYaw} min={-80} max={80} step={1} onChange={(value) => onSetting("lightYaw", value)} />
            <Slider label="Light pitch" title="Raise or lower the light above the molecule." value={settings.lightPitch} min={20} max={78} step={1} onChange={(value) => onSetting("lightPitch", value)} />
            <Slider label="Light power" title="Change the strength of directional lighting." value={settings.lightIntensity} min={0.25} max={1.8} step={0.05} onChange={(value) => onSetting("lightIntensity", value)} />
            <label className="slider color-slider" title="Change the color of the directional light.">
              <span>
                Light color
                <strong>{settings.lightColor}</strong>
              </span>
              <input type="color" value={settings.lightColor} onChange={(event) => onSetting("lightColor", event.target.value)} />
            </label>
          </div>
        </div>
      )}
      <div className="control-section">
        <div className="control-section-title">Overlays</div>
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
        <button className={settings.showElectronRegions ? "toggle active" : "toggle"} title="Show VSEPR electron regions around bonded atoms" onClick={() => onSetting("showElectronRegions", !settings.showElectronRegions)}>
          <Waves size={16} />
          Regions
        </button>
        <button className={settings.highlightLonePairs ? "toggle active" : "toggle"} title="Highlight lone electron pairs and their repulsion regions" onClick={() => onSetting("highlightLonePairs", !settings.highlightLonePairs)}>
          <Lightbulb size={16} />
          Lone pairs
        </button>
        <button className={settings.showBondDipoles ? "toggle active" : "toggle"} title="Show bond dipole arrows" onClick={() => onSetting("showBondDipoles", !settings.showBondDipoles)}>
          <Zap size={16} />
          Bond dipoles
        </button>
        <button className={settings.showNetDipole ? "toggle active" : "toggle"} title="Show the overall molecular dipole" onClick={() => onSetting("showNetDipole", !settings.showNetDipole)}>
          <Zap size={16} />
          Net dipole
        </button>
        <button className={settings.showCharges ? "toggle active" : "toggle"} title="Show partial and formal charge labels" onClick={() => onSetting("showCharges", !settings.showCharges)}>
          <Tags size={16} />
          Charges
        </button>
        <button className={settings.showFunctionalGroups ? "toggle active" : "toggle"} title="Highlight OH, amine, carbonyl, and aromatic-like regions" onClick={() => onSetting("showFunctionalGroups", !settings.showFunctionalGroups)}>
          <Tags size={16} />
          Groups
        </button>
        <button className={settings.focusMode ? "toggle active" : "toggle"} title="Fade distant atoms and emphasize the selected atom neighborhood" onClick={() => onSetting("focusMode", !settings.focusMode)}>
          <Focus size={16} />
          Focus
        </button>
        <button className={settings.showElectronFlow ? "toggle active" : "toggle"} title="Animate electron density moving along bonds" onClick={() => onSetting("showElectronFlow", !settings.showElectronFlow)}>
          <Sparkles size={16} />
          Flow
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
