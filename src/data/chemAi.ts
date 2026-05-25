import type { AtomParticle, Bond, ChemAiInsight, MoleculeAnalysis, MoleculePreset, PubChemCompoundInfo } from "../types";

const CACHE_KEY = "atom-bonding-chem-ai-cache-v1";
const DEFAULT_ENDPOINT = "http://127.0.0.1:8787/api/chem-ai";

type ChemAiCache = Record<string, ChemAiInsight>;
type OptionalImportMeta = ImportMeta & { env?: { VITE_CHEM_AI_ENDPOINT?: string } };

export type ChemAiResult = {
  insight: ChemAiInsight;
  cached: boolean;
};

export function buildChemAiCacheKey(activePreset: MoleculePreset | null, analysis: MoleculeAnalysis, pubChem?: PubChemCompoundInfo) {
  const cid = pubChem?.cid ? `cid:${pubChem.cid}` : "";
  const formula = pubChem?.molecularFormula ?? activePreset?.formula ?? analysis.formula;
  const atoms = analysis.atomCounts.map((entry) => `${entry.symbol}${entry.count}`).join(".");
  const bonds = analysis.bondCounts.map((entry) => `${entry.kind}${entry.count}`).join(".");
  return [cid, formula, atoms, bonds, analysis.atomCount, analysis.bondCount].filter(Boolean).join("|");
}

export function buildChemAiSelectionCacheKey(input: {
  activePreset: MoleculePreset | null;
  analysis: MoleculeAnalysis;
  pubChem?: PubChemCompoundInfo;
  atom?: AtomParticle | null;
  bond?: Bond | null;
}) {
  const base = buildChemAiCacheKey(input.activePreset, input.analysis, input.pubChem);
  const target = input.bond
    ? `bond:${input.bond.id}:${input.bond.kind}:${input.bond.order}:${input.bond.polarity.toFixed(2)}`
    : input.atom
      ? `atom:${input.atom.id}:${input.atom.symbol}:${input.atom.charge}:${input.atom.bonds.length}`
      : "molecule";
  return `${base}|selection|${target}`;
}

export function getCachedChemAiInsight(cacheKey: string) {
  return readCache()[cacheKey] ?? null;
}

export async function fetchChemAiInsight(input: {
  cacheKey: string;
  activePreset: MoleculePreset | null;
  analysis: MoleculeAnalysis;
  pubChem?: PubChemCompoundInfo;
}): Promise<ChemAiResult> {
  const cached = getCachedChemAiInsight(input.cacheKey);
  if (cached) return { insight: cached, cached: true };

  const endpoint = (import.meta as OptionalImportMeta).env?.VITE_CHEM_AI_ENDPOINT || DEFAULT_ENDPOINT;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      cacheKey: input.cacheKey,
      molecule: {
        name: input.activePreset?.name ?? input.pubChem?.title ?? input.analysis.formula,
        formula: input.pubChem?.molecularFormula ?? input.activePreset?.formula ?? input.analysis.formula,
        localPresetId: input.activePreset?.id,
        localDescription: input.activePreset?.description,
        localScienceNote: input.activePreset?.science,
        localGeometry: input.activePreset?.geometry,
        pubChemCid: input.pubChem?.cid,
        sourceUrl: input.pubChem?.sourceUrl
      },
      descriptors: compactPubChem(input.pubChem),
      localAnalysis: compactAnalysis(input.analysis)
    })
  });

  if (!response.ok) {
    const message = await response.text().catch(() => "");
    throw new Error(message || `AI helper returned ${response.status}.`);
  }

  const raw = await response.json() as Partial<ChemAiInsight> & { cached?: boolean };
  const insight: ChemAiInsight = {
    summary: raw.summary || "No AI summary was returned.",
    takeaways: Array.isArray(raw.takeaways) ? raw.takeaways.filter(Boolean).slice(0, 6) : [],
    caveats: Array.isArray(raw.caveats) ? raw.caveats.filter(Boolean).slice(0, 4) : [],
    model: raw.model,
    generatedAt: typeof raw.generatedAt === "number" ? raw.generatedAt : Date.now()
  };
  writeCachedChemAiInsight(input.cacheKey, insight);
  return { insight, cached: Boolean(raw.cached) };
}

export async function fetchChemAiSelectionInsight(input: {
  cacheKey: string;
  activePreset: MoleculePreset | null;
  analysis: MoleculeAnalysis;
  pubChem?: PubChemCompoundInfo;
  atom?: AtomParticle | null;
  bond?: Bond | null;
}): Promise<ChemAiResult> {
  const cached = getCachedChemAiInsight(input.cacheKey);
  if (cached) return { insight: cached, cached: true };

  const endpoint = (import.meta as OptionalImportMeta).env?.VITE_CHEM_AI_ENDPOINT || DEFAULT_ENDPOINT;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      cacheKey: input.cacheKey,
      task: "Inspect the selected atom, bond, or molecule region. Explain what this selected part contributes to geometry, polarity, stability, and likely reaction behavior. Keep it concise and tied to the supplied local structure.",
      molecule: {
        name: input.activePreset?.name ?? input.pubChem?.title ?? input.analysis.formula,
        formula: input.pubChem?.molecularFormula ?? input.activePreset?.formula ?? input.analysis.formula,
        localPresetId: input.activePreset?.id,
        localDescription: input.activePreset?.description,
        localScienceNote: input.activePreset?.science,
        pubChemCid: input.pubChem?.cid,
        sourceUrl: input.pubChem?.sourceUrl
      },
      selection: compactSelection(input.atom, input.bond),
      descriptors: compactPubChem(input.pubChem),
      localAnalysis: compactAnalysis(input.analysis)
    })
  });

  if (!response.ok) {
    const message = await response.text().catch(() => "");
    throw new Error(message || `AI helper returned ${response.status}.`);
  }

  const raw = await response.json() as Partial<ChemAiInsight> & { cached?: boolean };
  const insight: ChemAiInsight = {
    summary: raw.summary || "No AI inspection note was returned.",
    takeaways: Array.isArray(raw.takeaways) ? raw.takeaways.filter(Boolean).slice(0, 5) : [],
    caveats: Array.isArray(raw.caveats) ? raw.caveats.filter(Boolean).slice(0, 3) : [],
    model: raw.model,
    generatedAt: typeof raw.generatedAt === "number" ? raw.generatedAt : Date.now()
  };
  writeCachedChemAiInsight(input.cacheKey, insight);
  return { insight, cached: Boolean(raw.cached) };
}

function compactAnalysis(analysis: MoleculeAnalysis) {
  return {
    formula: analysis.formula,
    atomCount: analysis.atomCount,
    molarMass: Number(analysis.molarMass.toFixed(4)),
    atomCounts: analysis.atomCounts.map(({ symbol, count }) => ({ symbol, count })),
    percentComposition: analysis.percentComposition.slice(0, 8).map((entry) => ({ symbol: entry.symbol, percent: Number(entry.percent.toFixed(2)) })),
    bondCount: analysis.bondCount,
    bondCounts: analysis.bondCounts.map(({ label, count }) => ({ label, count })),
    bondOrderCounts: analysis.bondOrderCounts,
    functionalGroups: analysis.functionalGroups,
    heteroAtoms: analysis.heteroAtoms,
    polarity: analysis.polarity,
    geometryHighlights: analysis.geometryHighlights,
    lonePairSummary: analysis.lonePairSummary,
    warnings: analysis.warnings
  };
}

function compactPubChem(pubChem?: PubChemCompoundInfo) {
  if (!pubChem) return null;
  return {
    cid: pubChem.cid,
    title: pubChem.title,
    iupacName: pubChem.iupacName,
    synonyms: pubChem.synonyms,
    molecularFormula: pubChem.molecularFormula,
    molecularWeight: pubChem.molecularWeight,
    exactMass: pubChem.exactMass,
    canonicalSmiles: pubChem.canonicalSmiles,
    isomericSmiles: pubChem.isomericSmiles,
    inchi: pubChem.inchi,
    inchiKey: pubChem.inchiKey,
    xlogp: pubChem.xlogp,
    tpsa: pubChem.tpsa,
    hBondDonorCount: pubChem.hBondDonorCount,
    hBondAcceptorCount: pubChem.hBondAcceptorCount,
    rotatableBondCount: pubChem.rotatableBondCount,
    formalCharge: pubChem.formalCharge,
    complexity: pubChem.complexity,
    sourceUrl: pubChem.sourceUrl
  };
}

function compactSelection(atom?: AtomParticle | null, bond?: Bond | null) {
  if (bond) {
    return {
      kind: "bond",
      id: bond.id,
      atoms: [bond.a, bond.b],
      bondKind: bond.kind,
      order: bond.order,
      polarity: Number(bond.polarity.toFixed(2)),
      electronShift: bond.electronShift
    };
  }
  if (atom) {
    return {
      kind: "atom",
      id: atom.id,
      symbol: atom.symbol,
      isotopeId: atom.isotopeId,
      massNumber: atom.massNumber,
      protonCount: atom.protonCount,
      neutronCount: atom.neutronCount,
      charge: atom.charge,
      bondIds: atom.bonds,
      position: { x: Math.round(atom.x), y: Math.round(atom.y), z: Math.round(atom.z ?? 0) }
    };
  }
  return { kind: "molecule" };
}

function writeCachedChemAiInsight(cacheKey: string, insight: ChemAiInsight) {
  const cache = readCache();
  cache[cacheKey] = insight;
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // Local storage can be full or unavailable. The server-side cache still prevents repeat API calls.
  }
}

function readCache(): ChemAiCache {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) ?? "{}") as ChemAiCache;
  } catch {
    return {};
  }
}
