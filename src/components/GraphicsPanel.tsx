import type { ReactNode } from "react";
import { Box, Eye, EyeOff, Focus, Gauge, Lightbulb, MousePointer2, Orbit, Palette, Sparkles, Tags, Waves, X, Zap, ZoomIn } from "lucide-react";
import type { SimulationSettings } from "../types";

type Props = {
  settings: SimulationSettings;
  onSetting: <K extends keyof SimulationSettings>(key: K, value: SimulationSettings[K]) => void;
  onClose: () => void;
};

export function GraphicsPanel({ settings, onSetting, onClose }: Props) {
  return (
    <aside className="graphics-panel">
      <div className="graphics-panel-header">
        <div className="graphics-panel-title">
          <Sparkles size={18} />
          <h2>Visual Settings</h2>
        </div>
        <button className="graphics-panel-close" title="Close visual settings panel" onClick={onClose}>
          <X size={18} />
        </button>
      </div>

      <div className="graphics-section">
        <div className="graphics-section-title">Render Quality</div>
        <div className="graphics-row" aria-label="Graphics quality">
          {(["low", "medium", "high", "very-high"] as const).map((quality) => (
            <button
              key={quality}
              className={settings.graphicsQuality === quality ? "graphics-choice active" : "graphics-choice"}
              title={`Use ${quality.replace("-", " ")} graphics quality`}
              onClick={() => onSetting("graphicsQuality", quality)}
            >
              <Gauge size={15} />
              {quality === "very-high" ? "Very high" : quality[0].toUpperCase() + quality.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="graphics-section">
        <div className="graphics-section-title">Visual Style</div>
        <div className="graphics-row" aria-label="Visual model">
          <button className={settings.visualStyle === "detailed" ? "graphics-choice active" : "graphics-choice"} title="Detailed model with shaded atoms and glow effects" onClick={() => onSetting("visualStyle", "detailed")}>
            <Sparkles size={16} />
            Glow
          </button>
          <button className={settings.visualStyle === "simple-neutral" ? "graphics-choice active" : "graphics-choice"} title="Simplified model with flat neutral atoms and no glow" onClick={() => onSetting("visualStyle", "simple-neutral")}>
            Simple
          </button>
          <button className={settings.visualStyle === "simple-colored" ? "graphics-choice active" : "graphics-choice"} title="Simplified model with flat element colors and no glow" onClick={() => onSetting("visualStyle", "simple-colored")}>
            <Palette size={16} />
            Color
          </button>
        </div>
      </div>

      <div className="graphics-section">
        <div className="graphics-section-title">Display Mode</div>
        <div className="graphics-row" aria-label="Structure detail">
          {(["full", "simplified", "skeleton"] as const).map((mode) => (
            <button key={mode} className={settings.displayMode === mode ? "graphics-choice active" : "graphics-choice"} title={`Use ${mode} structure display`} onClick={() => onSetting("displayMode", mode)}>
              {mode[0].toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>
        <div className="graphics-row" aria-label="View mode">
          <button className={settings.geometry3D ? "graphics-choice active" : "graphics-choice"} title="Toggle between the 2D simulator and 3D VSEPR view" onClick={() => onSetting("geometry3D", !settings.geometry3D)}>
            <Box size={15} />
            3D view
          </button>
        </div>
      </div>

      <div className="graphics-section">
        <div className="graphics-section-title">Analysis Mode</div>
        <div className="graphics-row" aria-label="Analysis mode">
          <button className={settings.analysisMode === "structure" ? "graphics-choice active" : "graphics-choice"} title="Clean structural view with zoom-based abstraction" onClick={() => onSetting("analysisMode", "structure")}>
            <Box size={15} />
            Structure
          </button>
          <button className={settings.analysisMode === "chemistry" ? "graphics-choice active" : "graphics-choice"} title="Full chemistry view with charges, dipoles, regions, and electron detail" onClick={() => onSetting("analysisMode", "chemistry")}>
            <Lightbulb size={15} />
            Chemistry
          </button>
        </div>
      </div>

      {settings.geometry3D && (
        <div className="graphics-section">
          <div className="graphics-section-title">3D View</div>
          <div className="graphics-row" aria-label="3D camera presets">
            {(["free", "isometric", "top", "side"] as const).map((preset) => (
              <button key={preset} className={settings.cameraPreset === preset ? "graphics-choice active" : "graphics-choice"} title={`Use ${preset} camera view`} onClick={() => onSetting("cameraPreset", preset)}>
                <MousePointer2 size={15} />
                {preset[0].toUpperCase() + preset.slice(1)}
              </button>
            ))}
          </div>
          <div className="graphics-slider-grid" aria-label="Lighting controls">
            <GraphicsSlider label="Light yaw" title="Move the light around the molecule horizontally." value={settings.lightYaw} min={-80} max={80} step={1} onChange={(value) => onSetting("lightYaw", value)} />
            <GraphicsSlider label="Light pitch" title="Raise or lower the light above the molecule." value={settings.lightPitch} min={20} max={78} step={1} onChange={(value) => onSetting("lightPitch", value)} />
            <GraphicsSlider label="Light power" title="Change the strength of directional lighting." value={settings.lightIntensity} min={0.25} max={1.8} step={0.05} onChange={(value) => onSetting("lightIntensity", value)} />
            <label className="graphics-slider color-slider" title="Change the color of the directional light.">
              <span>
                Light color
                <strong>{settings.lightColor}</strong>
              </span>
              <input type="color" value={settings.lightColor} onChange={(event) => onSetting("lightColor", event.target.value)} />
            </label>
          </div>
        </div>
      )}

      <div className="graphics-section">
        <div className="graphics-section-title">Overlays</div>
        <div className="graphics-toggle-grid">
          <ToggleButton label="Shells" active={settings.showShells} icon={<Eye size={16} />} offIcon={<EyeOff size={16} />} onClick={() => onSetting("showShells", !settings.showShells)} />
          {!settings.geometry3D && <ToggleButton label="Valence shell" active={settings.valenceShellOnly2D} icon={<Orbit size={16} />} onClick={() => onSetting("valenceShellOnly2D", !settings.valenceShellOnly2D)} />}
          <ToggleButton label="Labels" active={settings.showLabels} icon={<Eye size={16} />} offIcon={<EyeOff size={16} />} onClick={() => onSetting("showLabels", !settings.showLabels)} />
          {!settings.geometry3D && <ToggleButton label="Element names" active={settings.showElementNames2D} icon={<Eye size={16} />} offIcon={<EyeOff size={16} />} onClick={() => onSetting("showElementNames2D", !settings.showElementNames2D)} />}
          <ToggleButton label="Advanced" active={settings.advanced} icon={<Gauge size={16} />} onClick={() => onSetting("advanced", !settings.advanced)} />
          <ToggleButton label="Regions" active={settings.showElectronRegions} icon={<Waves size={16} />} onClick={() => onSetting("showElectronRegions", !settings.showElectronRegions)} />
          <ToggleButton label="Bond types" active={settings.showBondTypes} icon={<Tags size={16} />} onClick={() => onSetting("showBondTypes", !settings.showBondTypes)} />
          <ToggleButton label="Lone pairs" active={settings.highlightLonePairs} icon={<Lightbulb size={16} />} onClick={() => onSetting("highlightLonePairs", !settings.highlightLonePairs)} />
          <ToggleButton label="Bond dipoles" active={settings.showBondDipoles} icon={<Zap size={16} />} onClick={() => onSetting("showBondDipoles", !settings.showBondDipoles)} />
          <ToggleButton label="Net dipole" active={settings.showNetDipole} icon={<Zap size={16} />} onClick={() => onSetting("showNetDipole", !settings.showNetDipole)} />
          <ToggleButton label="Charges" active={settings.showCharges} icon={<Tags size={16} />} onClick={() => onSetting("showCharges", !settings.showCharges)} />
          <ToggleButton label="Groups" active={settings.showFunctionalGroups} icon={<Tags size={16} />} onClick={() => onSetting("showFunctionalGroups", !settings.showFunctionalGroups)} />
          <ToggleButton label="Focus" active={settings.focusMode} icon={<Focus size={16} />} onClick={() => onSetting("focusMode", !settings.focusMode)} />
          <ToggleButton label="Flow" active={settings.showElectronFlow} icon={<Sparkles size={16} />} onClick={() => onSetting("showElectronFlow", !settings.showElectronFlow)} />
          <ToggleButton label="Geometry" active={settings.geometryAssist} icon={<Orbit size={16} />} onClick={() => onSetting("geometryAssist", !settings.geometryAssist)} />
          <button className="graphics-toggle" title="Reset zoom to the default view" onClick={() => onSetting("zoom", 1)}>
            <ZoomIn size={16} />
            100%
          </button>
        </div>
      </div>

      {!settings.geometry3D && (
        <div className="graphics-section">
          <div className="graphics-section-title">2D Electrons</div>
          <div className="graphics-row" aria-label="2D atomic model">
            {([
              ["bohr", "Bohr", "Show electrons on fixed shell rings."],
              ["probability-cloud", "Cloud", "Show a dotted probability cloud with average-distance rings."],
              ["rutherford", "Rutherford", "Show planetary electrons that leave their own trails."],
              ["spdf", "SPDF", "Show color-coded occupied s, p, d, and f subshells."],
              ["compact", "Compact", "Show only a clean outer electron hint."]
            ] as const).map(([model, label, title]) => (
              <button key={model} className={settings.atomicModel2D === model ? "graphics-choice active" : "graphics-choice"} title={title} onClick={() => onSetting("atomicModel2D", model)}>
                {model === "probability-cloud" ? <Waves size={15} /> : <Orbit size={15} />}
                {label}
              </button>
            ))}
          </div>
          <div className="graphics-slider-grid" aria-label="2D electron controls">
            <GraphicsSlider label="2D expansion" title="Increase visible spacing between bonded atoms in 2D without changing the chemistry." value={settings.expansionScale2D} min={1} max={3.2} step={0.05} onChange={(value) => onSetting("expansionScale2D", value)} />
            <GraphicsSlider label="Shell spacing" title="Expand or compress the distance between electron shells in 2D." value={settings.shellSpacing2D} min={0} max={1} step={0.02} format="percent" onChange={(value) => onSetting("shellSpacing2D", value)} />
            <GraphicsSlider label="Shell opacity" title="Change only the opacity of electron shell rings in 2D." value={settings.shellOpacity2D} min={0.08} max={1} step={0.02} onChange={(value) => onSetting("shellOpacity2D", value)} />
            <GraphicsSlider label="Electron opacity" title="Change the opacity of 2D electron particles and trails." value={settings.electronOpacity2D} min={0.12} max={1} step={0.02} onChange={(value) => onSetting("electronOpacity2D", value)} />
            <label className="graphics-slider color-slider" title="Change the color of 2D electrons.">
              <span>
                Electrons
                <strong>{settings.electronColor2D}</strong>
              </span>
              <input type="color" value={settings.electronColor2D} onChange={(event) => onSetting("electronColor2D", event.target.value)} />
            </label>
            <label className="graphics-slider color-slider" title="Change the color of 2D lone pairs.">
              <span>
                Lone pairs
                <strong>{settings.lonePairColor2D}</strong>
              </span>
              <input type="color" value={settings.lonePairColor2D} onChange={(event) => onSetting("lonePairColor2D", event.target.value)} />
            </label>
          </div>
          <div className="graphics-row" aria-label="2D electron appearance">
            <button className={settings.electronRenderMode2D === "particles" ? "graphics-choice active" : "graphics-choice"} title="Draw electrons as particles on their shells." onClick={() => onSetting("electronRenderMode2D", "particles")}>
              <Sparkles size={15} />
              Particles
            </button>
            <button className={settings.electronRenderMode2D === "trails" ? "graphics-choice active" : "graphics-choice"} title="Draw orbiting electrons as trails only." onClick={() => onSetting("electronRenderMode2D", "trails")}>
              <Waves size={15} />
              Trails only
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}

function ToggleButton({ label, active, icon, offIcon, onClick }: {
  label: string;
  active: boolean;
  icon: ReactNode;
  offIcon?: ReactNode;
  onClick: () => void;
}) {
  return (
    <button className={active ? "graphics-toggle active" : "graphics-toggle"} title={`Toggle ${label.toLowerCase()}`} onClick={onClick}>
      {active ? icon : offIcon ?? icon}
      {label}
    </button>
  );
}

function GraphicsSlider({ label, title, value, min, max, step, format = "number", onChange }: {
  label: string;
  title: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format?: "number" | "percent";
  onChange: (value: number) => void;
}) {
  return (
    <label className="graphics-slider" title={title}>
      <span>
        {label}
        <strong>{format === "percent" ? `${Math.round(value * 100)}%` : Number.isInteger(value) ? value : value.toFixed(2)}</strong>
      </span>
      <input type="range" value={value} min={min} max={max} step={step} onChange={(event) => onChange(Number(event.target.value))} />
    </label>
  );
}
