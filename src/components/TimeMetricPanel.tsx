import { Clock3, Gauge } from "lucide-react";
import type { TimeDisplayMode } from "../types";
import { formatSimulationTime, timeDisplayOptions } from "../utils/timeFormat";

type Props = {
  timeSeconds: number;
  timeMultiplier: number;
  displayMode: TimeDisplayMode;
  onDisplayMode: (mode: TimeDisplayMode) => void;
  compact?: boolean;
};

export function TimeMetricPanel({ timeSeconds, timeMultiplier, displayMode, onDisplayMode, compact = false }: Props) {
  return (
    <section className={`time-metric-panel ${compact ? "compact" : ""}`} aria-label="Simulation time">
      <div className="time-metric-header">
        <h3><Clock3 size={16} /> Simulation Time</h3>
        <span><Gauge size={14} /> {Math.round(timeMultiplier)}x</span>
      </div>
      <output className="time-metric-value" aria-live="polite">
        {formatSimulationTime(timeSeconds, displayMode)}
      </output>
      <label className="time-metric-select">
        <span>View</span>
        <select value={displayMode} onChange={(event) => onDisplayMode(event.target.value as TimeDisplayMode)}>
          {timeDisplayOptions.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </label>
      {!compact && <p>Scaled by the global time multiplier.</p>}
    </section>
  );
}
