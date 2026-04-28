import { BookOpen, ChevronRight, FlaskConical } from "lucide-react";
import { guidedLessons } from "../data/lessons";
import { moleculePresets } from "../data/presets";
import type { AppMode } from "../types";

type Props = {
  mode: AppMode;
  activePresetId?: string;
  onPreset: (id: string) => void;
};

export function LearningPanel({ mode, activePresetId, onPreset }: Props) {
  if (mode === "guided") {
    return (
      <section className="learning-panel">
        <div className="section-heading">
          <BookOpen size={18} />
          <h2>Guided Learning</h2>
        </div>
        <div className="lesson-list">
          {guidedLessons.map((lesson) => (
            <button key={lesson.id} className={activePresetId === lesson.presetId ? "lesson active" : "lesson"} onClick={() => onPreset(lesson.presetId)}>
              <span>{lesson.title}</span>
              <strong>{lesson.focus}</strong>
              <ChevronRight size={17} />
            </button>
          ))}
        </div>
        <ol className="lesson-steps">
          {(guidedLessons.find((lesson) => lesson.presetId === activePresetId) ?? guidedLessons[0]).steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </section>
    );
  }

  return (
    <section className="learning-panel">
      <div className="section-heading">
        <FlaskConical size={18} />
        <h2>{mode === "presets" ? "Preset Molecules" : "Quick Presets"}</h2>
      </div>
      <div className="preset-grid">
        {moleculePresets.map((preset) => (
          <button key={preset.id} className={activePresetId === preset.id ? "preset active" : "preset"} onClick={() => onPreset(preset.id)} title={preset.description}>
            <strong>{preset.formula}</strong>
            <span>{preset.name}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
