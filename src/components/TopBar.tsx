import { Atom, Gauge, HelpCircle, Moon, Pause, Play, RotateCcw, Sparkles, Sun } from "lucide-react";
import type { AppMode, ThemeMode } from "../types";

type Props = {
  mode: AppMode;
  theme: ThemeMode;
  running: boolean;
  showGraphics: boolean;
  timeMultiplier: number;
  onMode: (mode: AppMode) => void;
  onTheme: () => void;
  onToggleRun: () => void;
  onReset: () => void;
  onToggleGraphics: () => void;
  onTimeMultiplier: (value: number) => void;
};

export function TopBar({ mode, theme, running, showGraphics, timeMultiplier, onMode, onTheme, onToggleRun, onReset, onToggleGraphics, onTimeMultiplier }: Props) {
  const labels: Record<AppMode, string> = {
    free: "Free Simulation",
    guided: "Guided Learning",
    presets: "Preset Molecules",
    composition: "Chemistry Lab"
  };

  return (
    <header className="top-bar">
      <div className="brand">
        <Atom size={24} />
        <div>
          <h1>Atom Bonding Studio</h1>
          <p>Watch atoms move, exchange electrons, and form bonds.</p>
        </div>
      </div>
      <nav className="mode-tabs" aria-label="Simulation mode">
        {(["free", "guided", "presets", "composition"] as AppMode[]).map((item) => (
          <button key={item} className={mode === item ? "active" : ""} onClick={() => onMode(item)}>
            {labels[item]}
          </button>
        ))}
      </nav>
      <div className="top-actions">
        <div className="time-control" title="Global simulation time multiplier">
          <div className="time-control-label">
            <Gauge size={15} />
            <span>Time</span>
            <strong>{Math.round(timeMultiplier)}x</strong>
          </div>
          <div className="time-preset-row" aria-label="Time multiplier presets">
            {[1, 10, 100, 1000].map((value) => (
              <button key={value} className={Math.round(timeMultiplier) === value ? "active" : ""} onClick={() => onTimeMultiplier(value)}>
                {value}x
              </button>
            ))}
          </div>
          <input
            aria-label="Time multiplier"
            type="range"
            min={1}
            max={1000}
            step={1}
            value={timeMultiplier}
            onChange={(event) => onTimeMultiplier(Number(event.target.value))}
          />
        </div>
        <button
          className={`label-button visuals-toggle-button ${showGraphics ? "active" : ""}`}
          title="Toggle visual settings: quality, overlays, analysis modes, lighting"
          aria-haspopup="dialog"
          aria-expanded={showGraphics}
          onClick={onToggleGraphics}
        >
          <Sparkles size={16} />
          <span>Visuals</span>
        </button>
        <button className="icon-button" title={running ? "Pause simulation" : "Play simulation"} onClick={onToggleRun}>
          {running ? <Pause size={19} /> : <Play size={19} />}
        </button>
        <button className="icon-button" title="Reset current scene" onClick={onReset}>
          <RotateCcw size={19} />
        </button>
        <button className="icon-button" title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"} onClick={onTheme}>
          {theme === "dark" ? <Sun size={19} /> : <Moon size={19} />}
        </button>
        <button className="icon-button" title="Tip: click or drag atoms, then inspect the panel">
          <HelpCircle size={19} />
        </button>
      </div>
    </header>
  );
}
