import type { TimeDisplayMode } from "../types";

export const timeDisplayOptions: Array<{ value: TimeDisplayMode; label: string }> = [
  { value: "clock", label: "Clock" },
  { value: "labeled", label: "Labeled" },
  { value: "seconds", label: "Seconds" },
  { value: "milliseconds", label: "Milliseconds" },
  { value: "scientific", label: "Scientific" }
];

export function formatSimulationTime(seconds: number, mode: TimeDisplayMode = "clock") {
  const safeSeconds = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
  const totalMs = Math.round(safeSeconds * 1000);
  const ms = totalMs % 1000;
  const totalSeconds = Math.floor(totalMs / 1000);
  const sec = totalSeconds % 60;
  const totalMinutes = Math.floor(totalSeconds / 60);
  const min = totalMinutes % 60;
  const hours = Math.floor(totalMinutes / 60);

  switch (mode) {
    case "labeled":
      return `${hours} h ${pad(min)} m ${pad(sec)} s ${pad(ms, 3)} ms`;
    case "seconds":
      return `${safeSeconds.toFixed(3)} s`;
    case "milliseconds":
      return `${totalMs} ms`;
    case "scientific":
      return `${safeSeconds.toExponential(3)} s`;
    case "clock":
    default:
      return `${pad(hours)}:${pad(min)}:${pad(sec)}.${pad(ms, 3)}`;
  }
}

function pad(value: number, width = 2) {
  return String(value).padStart(width, "0");
}
