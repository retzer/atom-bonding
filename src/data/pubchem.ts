import { atomData } from "./atoms";
import type { AtomSymbol, BondKind, MoleculePreset } from "../types";
import { classifyBond } from "../simulation/chemistry";

const PUBCHEM_BASE = "https://pubchem.ncbi.nlm.nih.gov/rest/pug";
const PUBCHEM_AUTOCOMPLETE_BASE = "https://pubchem.ncbi.nlm.nih.gov/rest/autocomplete";
const MAX_ATOMS = 90;
const atomSymbols = new Set(Object.keys(atomData));

type PubChemCids = {
  IdentifierList?: {
    CID?: number[];
  };
};

type PubChemProperties = {
  PropertyTable?: {
    Properties?: Array<{
      CID: number;
      MolecularFormula?: string;
      IUPACName?: string;
      Title?: string;
      CanonicalSMILES?: string;
      IsomericSMILES?: string;
    }>;
  };
};

type PubChemAutocomplete = {
  dictionary_terms?: {
    compound?: string[];
  };
};

type ParsedSdf = {
  atoms: Array<{ symbol: AtomSymbol; x: number; y: number }>;
  bonds: NonNullable<MoleculePreset["bonds"]>;
  unsupported: string[];
};

export async function fetchPubChemMolecule(query: string): Promise<MoleculePreset> {
  const cleanQuery = query.trim();
  if (!cleanQuery) throw new Error("Type a molecule name first.");

  const cid = await fetchFirstCid(cleanQuery);
  const [properties, sdf] = await Promise.all([
    fetchProperties(cid),
    fetchSdf(cid)
  ]);
  const parsed = parseSdf(sdf);

  if (parsed.unsupported.length) {
    throw new Error(`PubChem found it, but this simulator does not support ${parsed.unsupported.join(", ")} yet.`);
  }
  if (!parsed.atoms.length || parsed.atoms.length > MAX_ATOMS) {
    throw new Error(`PubChem returned ${parsed.atoms.length || "no"} atoms. Try a smaller molecule.`);
  }

  const title = properties.Title || cleanQuery;
  const formula = properties.MolecularFormula || formulaFor(parsed.atoms);
  return {
    id: `pubchem-${cid}`,
    name: title,
    aliases: [cleanQuery, properties.IUPACName, properties.CanonicalSMILES, properties.IsomericSMILES].filter(Boolean) as string[],
    formula,
    category: "advanced",
    geometry: "PubChem 2D structure",
    atoms: parsed.atoms,
    bonds: parsed.bonds,
    description: `${title} was imported from PubChem CID ${cid}.`,
    science: `${formula} came from PubChem's compound record. The simulator uses PubChem's 2D atom coordinates and bond connectivity, then classifies each bond with the local electronegativity model.`
  };
}

export async function fetchPubChemSuggestions(query: string, signal?: AbortSignal): Promise<string[]> {
  const cleanQuery = query.trim();
  if (cleanQuery.length < 3) return [];
  const url = `${PUBCHEM_AUTOCOMPLETE_BASE}/compound/${encodeURIComponent(cleanQuery)}/json?limit=8`;
  const response = await fetch(url, { signal });
  if (!response.ok) return [];
  const data = await response.json() as PubChemAutocomplete;
  return data.dictionary_terms?.compound ?? [];
}

async function fetchFirstCid(query: string) {
  const url = `${PUBCHEM_BASE}/compound/name/${encodeURIComponent(query)}/cids/JSON`;
  const data = await fetchJson<PubChemCids>(url);
  const cid = data.IdentifierList?.CID?.[0];
  if (!cid) throw new Error("PubChem did not find that molecule name.");
  return cid;
}

async function fetchProperties(cid: number) {
  const fields = "MolecularFormula,IUPACName,Title,CanonicalSMILES,IsomericSMILES";
  const url = `${PUBCHEM_BASE}/compound/cid/${cid}/property/${fields}/JSON`;
  const data = await fetchJson<PubChemProperties>(url);
  return data.PropertyTable?.Properties?.[0] ?? { CID: cid };
}

async function fetchSdf(cid: number) {
  const url = `${PUBCHEM_BASE}/compound/cid/${cid}/SDF?record_type=2d`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`PubChem SDF request failed with ${response.status}.`);
  return response.text();
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`PubChem request failed with ${response.status}.`);
  return response.json() as Promise<T>;
}

function parseSdf(sdf: string): ParsedSdf {
  const lines = sdf.split(/\r?\n/);
  const counts = lines[3];
  if (!counts) throw new Error("PubChem returned an unreadable structure.");

  const atomCount = Number(counts.slice(0, 3));
  const bondCount = Number(counts.slice(3, 6));
  if (!Number.isFinite(atomCount) || !Number.isFinite(bondCount)) {
    throw new Error("PubChem returned a structure format this app cannot read yet.");
  }

  const rawAtoms: Array<{ symbol: string; x: number; y: number }> = [];
  const unsupported = new Set<string>();
  const atomIndexMap = new Map<number, number>();

  for (let i = 0; i < atomCount; i += 1) {
    const line = lines[4 + i] ?? "";
    const parts = line.trim().split(/\s+/);
    const symbol = parts[3];
    if (!symbol || symbol === "R") continue;
    if (!atomSymbols.has(symbol)) {
      unsupported.add(symbol);
      continue;
    }
    atomIndexMap.set(i + 1, rawAtoms.length);
    rawAtoms.push({
      symbol,
      x: Number(parts[0]),
      y: Number(parts[1])
    });
  }

  const rawBonds: Array<{ a: number; b: number; order: 1 | 2 | 3 }> = [];
  const bonds: NonNullable<MoleculePreset["bonds"]> = [];
  for (let i = 0; i < bondCount; i += 1) {
    const line = lines[4 + atomCount + i] ?? "";
    const aRaw = Number(line.slice(0, 3));
    const bRaw = Number(line.slice(3, 6));
    const orderRaw = Number(line.slice(6, 9));
    const a = atomIndexMap.get(aRaw);
    const b = atomIndexMap.get(bRaw);
    if (a === undefined || b === undefined) continue;
    const order = bondOrder(orderRaw);
    rawBonds.push({ a, b, order });
  }

  const atoms = normalizeCoordinates(
    rawAtoms.map((atom) => ({
      ...atom,
      symbol: atom.symbol as AtomSymbol
    })),
    rawBonds
  );

  for (const bond of rawBonds) {
    const kind: BondKind = classifyBond(atoms[bond.a].symbol, atoms[bond.b].symbol, 1);
    bonds.push({ ...bond, kind });
  }

  return { atoms, bonds, unsupported: [...unsupported].sort() };
}

function normalizeCoordinates(
  atoms: Array<{ symbol: AtomSymbol; x: number; y: number }>,
  bonds: Array<{ a: number; b: number }>
) {
  if (!atoms.length) return atoms;
  const xs = atoms.map((atom) => atom.x);
  const ys = atoms.map((atom) => atom.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const width = Math.max(0.01, maxX - minX);
  const height = Math.max(0.01, maxY - minY);
  const bondLengths = bonds
    .map((bond) => {
      const a = atoms[bond.a];
      const b = atoms[bond.b];
      return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0;
    })
    .filter((length) => length > 0.01)
    .sort((a, b) => a - b);
  const medianBondLength = bondLengths[Math.floor(bondLengths.length / 2)] ?? Math.max(width, height) / Math.max(1, Math.sqrt(atoms.length));
  const targetBondLength = atoms.length > 55 ? 72 : atoms.length > 32 ? 86 : 112;
  const bondScale = targetBondLength / Math.max(0.01, medianBondLength);
  const fitScale = Math.min(760 / width, 560 / height);
  const scale = Math.max(38, Math.min(bondScale, fitScale, 130));
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;

  return atoms.map((atom) => ({
    symbol: atom.symbol,
    x: (atom.x - cx) * scale,
    y: (cy - atom.y) * scale
  }));
}

function bondOrder(value: number): 1 | 2 | 3 {
  if (value === 2) return 2;
  if (value === 3) return 3;
  return 1;
}

function formulaFor(atoms: Array<{ symbol: AtomSymbol }>) {
  const counts = atoms.reduce<Record<string, number>>((acc, atom) => {
    acc[atom.symbol] = (acc[atom.symbol] ?? 0) + 1;
    return acc;
  }, {});
  const symbols = Object.keys(counts).sort((a, b) => {
    if (a === "C") return -1;
    if (b === "C") return 1;
    if (a === "H" && counts.C) return -1;
    if (b === "H" && counts.C) return 1;
    return a.localeCompare(b);
  });
  return symbols.map((symbol) => `${symbol}${counts[symbol] > 1 ? counts[symbol] : ""}`).join("");
}
