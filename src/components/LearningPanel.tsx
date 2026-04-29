import { useEffect, useMemo, useState } from "react";
import { BookOpen, ChevronRight, FlaskConical, Search, WandSparkles } from "lucide-react";
import { guidedLessons } from "../data/lessons";
import { moleculePresets } from "../data/presets";
import { fetchPubChemMolecule, fetchPubChemSuggestions } from "../data/pubchem";
import type { AppMode, MoleculePreset } from "../types";

type GlucoseAnomer = "alpha" | "beta";
type GlucoseStage = "idle" | "aldehyde" | "hemiacetal" | "ring";

type Props = {
  mode: AppMode;
  activePresetId?: string;
  canFormGlucoseRing: boolean;
  canSelectGlucoseAnomer: boolean;
  glucoseAnomer: GlucoseAnomer;
  glucoseStage: GlucoseStage;
  onFormGlucoseRing: (anomer?: GlucoseAnomer) => void;
  onGlucoseAnomer: (anomer: GlucoseAnomer) => void;
  onPreset: (id: string) => void;
  onMoleculePreset: (preset: MoleculePreset) => void;
};

type PresetCategory = MoleculePreset["category"];

const presetFolders: Array<{ category: PresetCategory; title: string; description: string }> = [
  { category: "covalent", title: "Covalent molecules", description: "Shared electron pairs, polarity, geometry" },
  { category: "ionic", title: "Ionic compounds", description: "Electron transfer and ion attraction" },
  { category: "metallic", title: "Metallic lattices", description: "Positive ions with mobile electrons" },
  { category: "advanced", title: "Organic and resonance", description: "Functional groups, rings, mixed bonds" }
];

export function LearningPanel({
  mode,
  activePresetId,
  canFormGlucoseRing,
  canSelectGlucoseAnomer,
  glucoseAnomer,
  glucoseStage,
  onFormGlucoseRing,
  onGlucoseAnomer,
  onPreset,
  onMoleculePreset
}: Props) {
  const [query, setQuery] = useState("");
  const [builderStatus, setBuilderStatus] = useState<"idle" | "loading" | "imported" | "missing">("idle");
  const [builderMessage, setBuilderMessage] = useState("");
  const [pubChemSuggestions, setPubChemSuggestions] = useState<string[]>([]);
  const [suggestionStatus, setSuggestionStatus] = useState<"idle" | "loading">("idle");
  const moleculeMatches = useMemo(() => findMoleculeMatches(query), [query]);
  const groupedPresets = useMemo(
    () => presetFolders.map((folder) => ({ ...folder, presets: moleculePresets.filter((preset) => preset.category === folder.category) })),
    []
  );
  const showSuggestions = query.trim().length > 0 && (moleculeMatches.length > 0 || pubChemSuggestions.length > 0 || query.trim().length < 3 || suggestionStatus === "loading");
  const showGlucoseTools = canFormGlucoseRing || canSelectGlucoseAnomer;
  const displayGlucoseStage = glucoseStage === "idle"
    ? activePresetId === "glucose-linear" ? "aldehyde" : canSelectGlucoseAnomer ? "ring" : "idle"
    : glucoseStage;
  const glucoseStageIndex = (["aldehyde", "hemiacetal", "ring"] as const).indexOf(displayGlucoseStage as Exclude<GlucoseStage, "idle">);

  useEffect(() => {
    const term = query.trim();
    if (term.length < 3) {
      setPubChemSuggestions([]);
      setSuggestionStatus("idle");
      return;
    }

    const controller = new AbortController();
    setSuggestionStatus("loading");
    const timer = window.setTimeout(() => {
      fetchPubChemSuggestions(term, controller.signal)
        .then((suggestions) => setPubChemSuggestions(suggestions.filter((suggestion) => !moleculeMatches.some((preset) => normalize(preset.name) === normalize(suggestion)))))
        .catch(() => setPubChemSuggestions([]))
        .finally(() => {
          if (!controller.signal.aborted) setSuggestionStatus("idle");
        });
    }, 320);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [moleculeMatches, query]);

  const buildPubChemMolecule = async (searchTerm = query) => {
    const cleanTerm = searchTerm.trim();
    if (!cleanTerm) {
      setBuilderStatus("missing");
      setBuilderMessage("Type a molecule name first.");
      return;
    }

    setBuilderStatus("loading");
    setBuilderMessage("Searching PubChem...");
    try {
      setQuery(cleanTerm);
      const pubChemPreset = await fetchPubChemMolecule(cleanTerm);
      onMoleculePreset(pubChemPreset);
      setBuilderStatus("imported");
      setBuilderMessage(`Imported ${pubChemPreset.name} from PubChem.`);
    } catch (error) {
      setBuilderStatus("missing");
      setBuilderMessage(error instanceof Error ? error.message : "PubChem could not build that molecule.");
      return;
    }
  };

  const buildMolecule = async () => {
    const target = moleculeMatches[0]?.id;
    if (target) {
      setBuilderStatus("idle");
      setBuilderMessage("");
      onPreset(target);
      return;
    }
    await buildPubChemMolecule();
  };

  const chooseCuratedMolecule = (presetId: string) => {
    setBuilderStatus("idle");
    setBuilderMessage("");
    onPreset(presetId);
  };

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
      <form className="molecule-builder" onSubmit={(event) => {
        event.preventDefault();
        buildMolecule();
      }}>
        <label className="builder-search">
          <Search size={16} />
          <input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setBuilderStatus("idle");
              setBuilderMessage("");
            }}
            placeholder="benzene, aspirin, glucose..."
          />
        </label>
        <button type="submit" className="builder-button" title="Build molecule" disabled={builderStatus === "loading"}>
          <WandSparkles size={16} />
          {builderStatus === "loading" ? "Searching" : "Build"}
        </button>
        {builderMessage && <p className={builderStatus === "imported" ? "builder-message success" : "builder-message"}>{builderMessage}</p>}
      </form>
      {showGlucoseTools && (
        <div className="preset-action glucose-action">
          <div className="anomer-selector" aria-label="Glucose anomer selector">
            {(["alpha", "beta"] as const).map((anomer) => (
              <button key={anomer} type="button" className={glucoseAnomer === anomer ? "active" : ""} onClick={() => onGlucoseAnomer(anomer)}>
                {anomer === "alpha" ? "\u03b1-glucose" : "\u03b2-glucose"}
              </button>
            ))}
          </div>
          {canFormGlucoseRing && (
            <button type="button" className="form-ring-button" onClick={() => onFormGlucoseRing(glucoseAnomer)}>
              <WandSparkles size={16} />
              Form ring
            </button>
          )}
          <div className="reaction-steps" aria-label="Glucose ring formation stages">
            {[
              { id: "aldehyde", label: "aldehyde + OH" },
              { id: "hemiacetal", label: "hemiacetal" },
              { id: "ring", label: "ring closure" }
            ].map((step, index) => (
              <span key={step.id} className={index < glucoseStageIndex ? "done" : index === glucoseStageIndex ? "active" : ""}>{step.label}</span>
            ))}
          </div>
          <span>{canFormGlucoseRing ? "Choose an anomer, then fold linear glucose into its cyclic form." : "Flip the anomeric OH at C1 to compare alpha and beta glucose."}</span>
        </div>
      )}
      {showSuggestions && (
        <div className="builder-results">
          {moleculeMatches.map((preset) => (
            <button key={preset.id} type="button" className={activePresetId === preset.id ? "builder-result active" : "builder-result"} onClick={() => chooseCuratedMolecule(preset.id)}>
              <strong>{preset.formula}</strong>
              <span>{preset.name} - curated</span>
            </button>
          ))}
          {pubChemSuggestions.map((suggestion) => (
            <button key={suggestion} type="button" className="builder-result pubchem" onClick={() => buildPubChemMolecule(suggestion)}>
              <strong>{suggestion}</strong>
              <span>PubChem suggestion</span>
            </button>
          ))}
          {!moleculeMatches.length && !pubChemSuggestions.length && query.trim().length < 3 && (
            <p className="builder-hint">Keep typing for PubChem suggestions.</p>
          )}
          {suggestionStatus === "loading" && <p className="builder-hint">Checking PubChem...</p>}
        </div>
      )}
      <div className="preset-folders">
        {groupedPresets.map((folder) => (
          <details key={folder.category} className={`preset-folder preset-folder-${folder.category}`} open={folder.category === "covalent" || folder.category === "ionic" || folder.presets.some((preset) => preset.id === activePresetId)}>
            <summary>
              <span>
                <strong>{folder.title}</strong>
                <small>{folder.description}</small>
              </span>
              <em>{folder.presets.length}</em>
            </summary>
            <div className="preset-grid">
              {folder.presets.map((preset) => (
                <button key={preset.id} className={activePresetId === preset.id ? "preset active" : "preset"} onClick={() => onPreset(preset.id)} title={preset.description}>
                  <strong>{preset.formula}</strong>
                  <span>{preset.name}</span>
                </button>
              ))}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function findMoleculeMatches(query: string) {
  const needle = normalize(query);
  if (!needle) return moleculePresets.slice(0, 4);
  return moleculePresets
    .filter((preset) => {
      const terms = [preset.name, preset.formula, preset.id, ...(preset.aliases ?? [])];
      return terms.some((term) => normalize(term).includes(needle));
    })
    .slice(0, 5);
}
