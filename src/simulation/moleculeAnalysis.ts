import { periodicElements } from "../data/periodicTable";
import type { AtomParticle, AtomSymbol, Bond, BondKind, HydrogenBond, MoleculeAnalysis } from "../types";
import { bondKindLabel } from "./chemistry";
import { detectFunctionalGroups } from "./functionalGroups";
import { buildMoleculeGraph, structuralBonds } from "./graph";
import { analyzeAtomGeometry, estimateLonePairs } from "./vsepr";

const elementBySymbol = new Map(periodicElements.map((element) => [element.symbol, element]));

export function analyzeMolecule(atoms: AtomParticle[], bonds: Bond[], hydrogenBonds: HydrogenBond[]): MoleculeAnalysis {
  const atomCounts = countAtoms(atoms);
  const molarMass = atomCounts.reduce((sum, entry) => sum + (entry.atomicMass ?? 0) * entry.count, 0);
  const percentComposition = atomCounts
    .map((entry) => {
      const mass = (entry.atomicMass ?? 0) * entry.count;
      return {
        symbol: entry.symbol,
        mass,
        percent: molarMass > 0 ? mass / molarMass * 100 : 0
      };
    })
    .sort((a, b) => b.percent - a.percent);

  const structural = structuralBonds(bonds);
  const bondCounts = countBondsByKind(structural);
  const bondOrderCounts = ([1, 2, 3] as const)
    .map((order) => ({ order, count: structural.filter((bond) => bond.order === order).length }))
    .filter((entry) => entry.count > 0);
  const functionalGroups = summarizeFunctionalGroups(detectFunctionalGroups(atoms, bonds));
  const graph = buildMoleculeGraph(atoms, bonds);
  const lonePairSummary = summarizeLonePairs(atoms, graph.bondsByAtomId);
  const geometryHighlights = atoms
    .filter((atom) => atom.symbol !== "H")
    .map((atom) => analyzeAtomGeometry(atom, atoms, bonds))
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
    .sort((a, b) => b.electronDomains - a.electronDomains || b.bondedAtoms - a.bondedAtoms)
    .slice(0, 6)
    .map((entry) => {
      const atom = graph.atomById.get(entry.atomId);
      return {
        atomId: entry.atomId,
        symbol: atom?.symbol ?? "C",
        axe: entry.axe,
        shape: entry.molecularShape,
        lonePairs: entry.lonePairs,
        bondedAtoms: entry.bondedAtoms
      };
    });

  return {
    formula: formulaFromCounts(atomCounts),
    atomCount: atoms.length,
    molarMass,
    atomCounts,
    percentComposition,
    bondCount: structural.length,
    bondCounts,
    bondOrderCounts,
    functionalGroups,
    heteroAtoms: atomCounts.filter((entry) => entry.symbol !== "C" && entry.symbol !== "H").map(({ symbol, count }) => ({ symbol, count })),
    ringCount: functionalGroups.filter((entry) => /ring/i.test(entry.label)).reduce((sum, entry) => sum + entry.count, 0),
    hydrogenBondCount: hydrogenBonds.length,
    lonePairSummary,
    geometryHighlights,
    polarity: summarizePolarity(atoms, structural),
    warnings: buildWarnings(atoms, atomCounts, molarMass)
  };
}

function countAtoms(atoms: AtomParticle[]) {
  const counts = new Map<AtomSymbol, { count: number; totalMass: number; knownMasses: number }>();
  for (const atom of atoms) {
    const current = counts.get(atom.symbol) ?? { count: 0, totalMass: 0, knownMasses: 0 };
    const mass = atom.massNumber ?? atomicMassFor(atom.symbol);
    counts.set(atom.symbol, {
      count: current.count + 1,
      totalMass: current.totalMass + (mass ?? 0),
      knownMasses: current.knownMasses + (mass === null ? 0 : 1)
    });
  }
  return [...counts.entries()]
    .map(([symbol, entry]) => {
      const element = elementBySymbol.get(symbol);
      return {
        symbol,
        name: element?.name ?? symbol,
        count: entry.count,
        atomicMass: entry.knownMasses ? entry.totalMass / entry.knownMasses : atomicMassFor(symbol)
      };
    })
    .sort((a, b) => sortFormulaSymbols(a.symbol, b.symbol, counts.has("C")));
}

function formulaFromCounts(counts: Array<{ symbol: AtomSymbol; count: number }>) {
  return counts.map((entry) => `${entry.symbol}${entry.count > 1 ? entry.count : ""}`).join("");
}

function atomicMassFor(symbol: AtomSymbol) {
  const raw = elementBySymbol.get(symbol)?.atomicMass;
  if (raw === undefined) return null;
  const parsed = Number.parseFloat(String(raw).replace(/[^\d.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function sortFormulaSymbols(a: AtomSymbol, b: AtomSymbol, hasCarbon: boolean) {
  if (hasCarbon) {
    if (a === "C") return -1;
    if (b === "C") return 1;
    if (a === "H") return -1;
    if (b === "H") return 1;
  }
  return a.localeCompare(b);
}

function countBondsByKind(bonds: Bond[]) {
  const counts = new Map<BondKind, number>();
  for (const bond of bonds) counts.set(bond.kind, (counts.get(bond.kind) ?? 0) + 1);
  return [...counts.entries()]
    .map(([kind, count]) => ({ kind, label: bondKindLabel[kind], count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

function summarizeFunctionalGroups(groups: ReturnType<typeof detectFunctionalGroups>) {
  const counts = new Map<string, number>();
  for (const group of groups) counts.set(group.label, (counts.get(group.label) ?? 0) + 1);
  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

function summarizeLonePairs(atoms: AtomParticle[], bondsByAtomId: Map<string, Bond[]>) {
  const totals = new Map<AtomSymbol, { atomCount: number; totalLonePairs: number }>();
  for (const atom of atoms) {
    const lonePairs = estimateLonePairs(atom, bondsByAtomId.get(atom.id) ?? []);
    if (lonePairs <= 0) continue;
    const current = totals.get(atom.symbol) ?? { atomCount: 0, totalLonePairs: 0 };
    totals.set(atom.symbol, {
      atomCount: current.atomCount + 1,
      totalLonePairs: current.totalLonePairs + lonePairs
    });
  }
  return [...totals.entries()]
    .map(([symbol, entry]) => ({ symbol, ...entry }))
    .sort((a, b) => b.totalLonePairs - a.totalLonePairs || a.symbol.localeCompare(b.symbol));
}

function summarizePolarity(atoms: AtomParticle[], bonds: Bond[]) {
  const atomById = new Map(atoms.map((atom) => [atom.id, atom]));
  let x = 0;
  let y = 0;
  let polarityTotal = 0;
  let maxBondPolarity = 0;
  let polarBondCount = 0;
  let ionicBondCount = 0;

  for (const bond of bonds) {
    polarityTotal += bond.polarity;
    maxBondPolarity = Math.max(maxBondPolarity, bond.polarity);
    if (bond.kind === "polar-covalent") polarBondCount += 1;
    if (bond.kind === "ionic") ionicBondCount += 1;
    const target = bond.electronShift ? atomById.get(bond.electronShift) : null;
    const otherId = target?.id === bond.a ? bond.b : bond.a;
    const other = atomById.get(otherId);
    if (!target || !other) continue;
    const dx = target.x - other.x;
    const dy = target.y - other.y;
    const length = Math.hypot(dx, dy) || 1;
    x += dx / length * bond.polarity * bond.order;
    y += dy / length * bond.polarity * bond.order;
  }

  const averageBondPolarity = bonds.length ? polarityTotal / bonds.length : 0;
  const estimatedDipole = Math.hypot(x, y);
  let summary = "No bonds are present yet.";
  if (bonds.length && ionicBondCount) {
    summary = "Contains ionic interactions; charge attraction dominates the local model.";
  } else if (bonds.length && estimatedDipole > 0.85) {
    summary = "Likely polar overall because bond dipoles do not cancel cleanly.";
  } else if (bonds.length && polarBondCount) {
    summary = "Has polar bonds; the overall molecule may be weaker or balanced if the shape is symmetric.";
  } else if (bonds.length) {
    summary = "Mostly nonpolar by the local electronegativity model.";
  }

  return {
    summary,
    averageBondPolarity,
    maxBondPolarity,
    estimatedDipole,
    polarBondCount,
    ionicBondCount
  };
}

function buildWarnings(atoms: AtomParticle[], atomCounts: Array<{ atomicMass: number | null }>, molarMass: number) {
  const warnings: string[] = [];
  if (!atoms.length) warnings.push("No molecule is active yet.");
  if (atoms.length > 120) warnings.push("Large molecule: the local analysis is a simplified structural summary.");
  if (atomCounts.some((entry) => entry.atomicMass === null) || molarMass <= 0) {
    warnings.push("Some atomic masses are unavailable, so molar mass and percent composition may be incomplete.");
  }
  return warnings;
}
