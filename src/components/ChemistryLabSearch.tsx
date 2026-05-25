import { useEffect, useMemo, useState } from "react";
import { Search, WandSparkles } from "lucide-react";
import { moleculePresets } from "../data/presets";
import { fetchPubChemMolecule, fetchPubChemSuggestions } from "../data/pubchem";
import type { MoleculePreset } from "../types";

type Props = {
  activePreset: MoleculePreset | null;
  onPreset: (id: string) => void;
  onMoleculePreset: (preset: MoleculePreset) => void;
  compact?: boolean;
};

const quickPresetIds = ["h2o", "benzene", "glucose-linear"];

export function ChemistryLabSearch({ activePreset, onPreset, onMoleculePreset, compact = false }: Props) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [suggestionStatus, setSuggestionStatus] = useState<"idle" | "loading">("idle");
  const localMatches = useMemo(() => findMoleculeMatches(query), [query]);
  const quickPresets = useMemo(
    () => quickPresetIds.map((id) => moleculePresets.find((preset) => preset.id === id)).filter((preset): preset is MoleculePreset => Boolean(preset)),
    []
  );

  useEffect(() => {
    const term = query.trim();
    if (term.length < 3) {
      setSuggestions([]);
      setSuggestionStatus("idle");
      return;
    }
    const controller = new AbortController();
    setSuggestionStatus("loading");
    const timer = window.setTimeout(() => {
      fetchPubChemSuggestions(term, controller.signal)
        .then((items) => setSuggestions(items.filter((item) => !localMatches.some((preset) => normalize(preset.name) === normalize(item)))))
        .catch(() => setSuggestions([]))
        .finally(() => {
          if (!controller.signal.aborted) setSuggestionStatus("idle");
        });
    }, 420);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [localMatches, query]);

  const importPubChem = async (searchTerm = query) => {
    const term = searchTerm.trim();
    if (!term) {
      setStatus("error");
      setMessage("Type a molecule name first.");
      return;
    }
    setQuery(term);
    setStatus("loading");
    setMessage("Searching PubChem and reading structure data...");
    try {
      const preset = await fetchPubChemMolecule(term);
      onMoleculePreset(preset);
      setStatus("success");
      setMessage(`Imported ${preset.name} from PubChem.`);
    } catch (error) {
      const fallback = findMoleculeMatches(term)[0];
      if (fallback) {
        onPreset(fallback.id);
        setStatus("success");
        setMessage(`Loaded local preset ${fallback.name}. PubChem details were not added.`);
        return;
      }
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Could not import that molecule.");
    }
  };

  return (
    <section className={`chem-lab-search-panel${compact ? " compact" : ""}`} aria-label="Molecule search">
      <form
        className="molecule-builder chemistry-search"
        onSubmit={(event) => {
          event.preventDefault();
          void importPubChem();
        }}
      >
        <label className="builder-search">
          <Search size={16} />
          <input
            value={query}
            placeholder="water, benzene, aspirin, caffeine..."
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <button className="builder-button" type="submit" disabled={status === "loading"}>
          <WandSparkles size={16} />
          <span>Import</span>
        </button>
        {message && (
          <p className={`builder-message ${status === "success" ? "success" : status === "error" ? "error" : ""}`}>
            {message}
          </p>
        )}
        {!compact && (
          <div className="source-line">
            <span>Powered by PubChem search</span>
            <span>Local structure analysis</span>
          </div>
        )}
      </form>

      {(!compact || localMatches.length > 0 || suggestions.length > 0 || suggestionStatus === "loading") && (
      <div className="chemistry-lab-suggestions compact-search-suggestions">
        {!compact && (
          <>
            <div className="chemistry-lab-subhead">
              <span>Quick molecules</span>
              <small>local presets</small>
            </div>
            <div className="chemistry-chip-row">
              {quickPresets.map((preset) => (
                <button key={preset.id} type="button" className={activePreset?.id === preset.id ? "active" : ""} onClick={() => onPreset(preset.id)}>
                  {preset.name}
                </button>
              ))}
            </div>
          </>
        )}
        {(localMatches.length > 0 || suggestions.length > 0 || suggestionStatus === "loading") && (
          <div className="builder-results chemistry-results">
            {localMatches.slice(0, 2).map((preset) => (
              <button key={preset.id} type="button" className="builder-result" onClick={() => onPreset(preset.id)}>
                <strong>{preset.name}</strong>
                <span>{preset.formula} - local</span>
              </button>
            ))}
            {suggestions.slice(0, 4).map((item) => (
              <button key={item} type="button" className="builder-result pubchem" onClick={() => void importPubChem(item)}>
                <strong>{item}</strong>
                <span>PubChem</span>
              </button>
            ))}
          </div>
        )}
      </div>
      )}
    </section>
  );
}

function findMoleculeMatches(query: string) {
  const term = normalize(query);
  if (!term) return [];
  return moleculePresets
    .filter((preset) => [preset.name, preset.formula, ...(preset.aliases ?? [])].some((value) => normalize(value).includes(term)))
    .slice(0, 6);
}

function normalize(value: string) {
  return value.toLocaleLowerCase().replace(/[^a-z0-9]+/g, "");
}
