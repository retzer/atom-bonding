import { Atom, HelpCircle, Moon, Pause, Play, RotateCcw, Sun } from "lucide-react";
import type { AppMode, ThemeMode } from "../types";

type Props = {
  mode: AppMode;
  theme: ThemeMode;
  running: boolean;
  onMode: (mode: AppMode) => void;
  onTheme: () => void;
  onToggleRun: () => void;
  onReset: () => void;
};

export function TopBar({ mode, theme, running, onMode, onTheme, onToggleRun, onReset }: Props) {
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
        {(["free", "guided", "presets"] as AppMode[]).map((item) => (
          <button key={item} className={mode === item ? "active" : ""} onClick={() => onMode(item)}>
            {item === "free" ? "Free Simulation" : item === "guided" ? "Guided Learning" : "Preset Molecules"}
          </button>
        ))}
      </nav>
      <div className="top-actions">
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
