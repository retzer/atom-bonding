import type { AtomParticle, Bond } from "../types";
import { structuralBonds } from "./graph";

export type FunctionalGroupKind = "alcohol" | "amine" | "carbonyl" | "aromatic";

export type FunctionalGroup = {
  id: string;
  kind: FunctionalGroupKind;
  label: string;
  atomIds: string[];
  bondIds: string[];
  color: string;
};

const groupColor: Record<FunctionalGroupKind, string> = {
  alcohol: "#06b6d4",
  amine: "#8b5cf6",
  carbonyl: "#f43f5e",
  aromatic: "#f59e0b"
};

export function detectFunctionalGroups(atoms: AtomParticle[], bonds: Bond[]): FunctionalGroup[] {
  const byId = new Map(atoms.map((atom) => [atom.id, atom]));
  const structural = structuralBonds(bonds);
  const neighbors = new Map<string, Array<{ atom: AtomParticle; bond: Bond }>>();
  for (const bond of structural) {
    const a = byId.get(bond.a);
    const b = byId.get(bond.b);
    if (!a || !b) continue;
    neighbors.set(a.id, [...(neighbors.get(a.id) ?? []), { atom: b, bond }]);
    neighbors.set(b.id, [...(neighbors.get(b.id) ?? []), { atom: a, bond }]);
  }

  const groups: FunctionalGroup[] = [];
  for (const atom of atoms) {
    const bonded = neighbors.get(atom.id) ?? [];
    if (atom.symbol === "O") {
      const hydrogens = bonded.filter((item) => item.atom.symbol === "H");
      const carbons = bonded.filter((item) => item.atom.symbol === "C");
      if (hydrogens.length && carbons.length) {
        groups.push(makeGroup("alcohol", "alcohol -OH", [atom.id, hydrogens[0].atom.id, carbons[0].atom.id], [hydrogens[0].bond.id, carbons[0].bond.id]));
      }
    }

    if (atom.symbol === "N") {
      const hydrogens = bonded.filter((item) => item.atom.symbol === "H");
      const carbons = bonded.filter((item) => item.atom.symbol === "C");
      if (hydrogens.length && carbons.length) {
        const label = hydrogens.length >= 2 ? "amine -NH2" : "amine";
        groups.push(makeGroup("amine", label, [atom.id, ...hydrogens.slice(0, 2).map((item) => item.atom.id), carbons[0].atom.id], [...hydrogens.slice(0, 2).map((item) => item.bond.id), carbons[0].bond.id]));
      }
    }

    if (atom.symbol === "C") {
      const oxygenDouble = bonded.find((item) => item.atom.symbol === "O" && item.bond.order >= 2);
      if (oxygenDouble) {
        groups.push(makeGroup("carbonyl", "carbonyl C=O", [atom.id, oxygenDouble.atom.id], [oxygenDouble.bond.id]));
      }
    }
  }

  for (const ring of findAromaticRings(atoms, structural, neighbors).slice(0, 8)) {
    groups.push(makeGroup("aromatic", "aromatic ring", ring.atomIds, ring.bondIds));
  }

  const seen = new Set<string>();
  return groups.filter((group) => {
    const key = `${group.kind}:${[...group.atomIds].sort().join("|")}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function makeGroup(kind: FunctionalGroupKind, label: string, atomIds: string[], bondIds: string[]): FunctionalGroup {
  return {
    id: `${kind}-${[...atomIds].sort().join("-")}`,
    kind,
    label,
    atomIds: [...new Set(atomIds)],
    bondIds: [...new Set(bondIds)],
    color: groupColor[kind]
  };
}

function findAromaticRings(atoms: AtomParticle[], bonds: Bond[], neighbors: Map<string, Array<{ atom: AtomParticle; bond: Bond }>>) {
  const carbonIds = new Set(atoms.filter((atom) => atom.symbol === "C").map((atom) => atom.id));
  const carbonNeighbors = new Map<string, Array<{ id: string; bond: Bond }>>();
  for (const id of carbonIds) {
    carbonNeighbors.set(id, (neighbors.get(id) ?? [])
      .filter((item) => carbonIds.has(item.atom.id))
      .map((item) => ({ id: item.atom.id, bond: item.bond })));
  }

  const cycles = new Map<string, { atomIds: string[]; bondIds: string[] }>();
  for (const start of carbonIds) {
    walkCarbonCycle(start, start, [], [], carbonNeighbors, cycles);
  }

  return [...cycles.values()].filter((cycle) => {
    const ringBonds = cycle.bondIds
      .map((id) => bonds.find((bond) => bond.id === id))
      .filter((bond): bond is Bond => Boolean(bond));
    const doubleBonds = ringBonds.filter((bond) => bond.order >= 2).length;
    return cycle.atomIds.length === 6 && (doubleBonds >= 2 || ringBonds.length >= 6);
  });
}

function walkCarbonCycle(start: string, current: string, path: string[], bondPath: string[], neighbors: Map<string, Array<{ id: string; bond: Bond }>>, cycles: Map<string, { atomIds: string[]; bondIds: string[] }>) {
  const nextPath = [...path, current];
  if (nextPath.length > 6) return;

  for (const next of neighbors.get(current) ?? []) {
    if (next.id === start && nextPath.length === 6) {
      const atomIds = [...nextPath];
      const key = [...atomIds].sort().join("|");
      if (!cycles.has(key)) cycles.set(key, { atomIds, bondIds: [...bondPath, next.bond.id] });
      continue;
    }
    if (nextPath.includes(next.id)) continue;
    if (next.id < start) continue;
    walkCarbonCycle(start, next.id, nextPath, [...bondPath, next.bond.id], neighbors, cycles);
  }
}
