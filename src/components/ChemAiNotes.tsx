import { useEffect, useMemo, useState } from "react";
import { BrainCircuit, WandSparkles } from "lucide-react";
import { buildChemAiCacheKey, fetchChemAiInsight, getCachedChemAiInsight } from "../data/chemAi";
import { analyzeMolecule } from "../simulation/moleculeAnalysis";
import type { ChemAiInsight, MoleculePreset, PubChemCompoundInfo, SimulationState } from "../types";

type Props = {
  state: SimulationState;
  activePreset: MoleculePreset | null;
};

export function ChemAiNotes({ state, activePreset }: Props) {
  const [aiStatus, setAiStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [aiMessage, setAiMessage] = useState("");
  const [aiInsight, setAiInsight] = useState<ChemAiInsight | null>(null);
  const [aiFromCache, setAiFromCache] = useState(false);

  const analysis = useMemo(
    () => analyzeMolecule(state.atoms, state.bonds, state.hydrogenBonds),
    [state.atoms, state.bonds, state.hydrogenBonds]
  );
  const pubChem = activePreset?.pubChem;
  const aiCacheKey = useMemo(() => buildChemAiCacheKey(activePreset, analysis, pubChem), [activePreset, analysis, pubChem]);

  useEffect(() => {
    const cached = getCachedChemAiInsight(aiCacheKey);
    setAiInsight(cached);
    setAiFromCache(Boolean(cached));
    setAiStatus(cached ? "ready" : "idle");
    setAiMessage(cached ? "Loaded from local molecule cache." : "");
  }, [aiCacheKey]);

  const generateAiInsight = async () => {
    if (!analysis.atomCount) {
      setAiStatus("error");
      setAiMessage("Load a molecule before asking for AI notes.");
      return;
    }
    setAiStatus("loading");
    setAiMessage("Checking cache, then asking DeepSeek only if needed...");
    try {
      const result = await fetchChemAiInsight({ cacheKey: aiCacheKey, activePreset, analysis, pubChem });
      setAiInsight(result.insight);
      setAiFromCache(result.cached);
      setAiStatus("ready");
      setAiMessage(result.cached ? "Loaded from cache. No new DeepSeek request was spent." : "Generated with DeepSeek V4 Flash and cached for this molecule.");
    } catch (error) {
      setAiStatus("error");
      setAiMessage(error instanceof Error ? error.message : "AI notes are not available yet.");
    }
  };

  return (
    <section className="chem-lab-card chem-ai-notes-panel">
      <div className="chem-card-header">
        <h3><BrainCircuit size={16} /> AI Chemistry Notes</h3>
        <span>{aiInsight ? aiFromCache ? "cached" : "DeepSeek" : "optional"}</span>
      </div>
      {aiInsight ? (
        <div className="ai-insight">
          <p>{aiInsight.summary}</p>
          <MiniList title="Takeaways" empty="No takeaways returned." rows={aiInsight.takeaways} />
          <MiniList title="Caveats" empty="No caveats returned." rows={aiInsight.caveats} />
        </div>
      ) : (
        <p className="chemistry-empty">Generate a concise explanation using local analysis plus PubChem fields including CID, SMILES, InChI, exact mass, XLogP, TPSA, hydrogen bonding counts, formal charge, and complexity.</p>
      )}
      <div className="chem-ai-actions">
        <button className="builder-button ai-generate-button" type="button" disabled={aiStatus === "loading"} onClick={() => void generateAiInsight()}>
          <WandSparkles size={16} />
          <span>{aiInsight ? "Refresh cached notes" : "Generate AI notes"}</span>
        </button>
        <div className="source-line">
          <span>Powered by DeepSeek V4 Flash</span>
          <span>Enriched by PubChem</span>
          <span>Cache-first</span>
        </div>
      </div>
      {aiMessage && (
        <p className={`builder-message ${aiStatus === "ready" ? "success" : aiStatus === "error" ? "error" : ""}`}>
          {aiMessage}
        </p>
      )}
    </section>
  );
}

function MiniList({ title, rows, empty }: { title: string; rows: string[]; empty: string }) {
  return (
    <div className="ai-mini-list">
      <h4>{title}</h4>
      {rows.length ? (
        <ul>
          {rows.map((row) => <li key={row}>{row}</li>)}
        </ul>
      ) : (
        <p>{empty}</p>
      )}
    </div>
  );
}
