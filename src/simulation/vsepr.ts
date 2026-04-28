import { atomData } from "../data/atoms";
import type { AtomParticle, Bond } from "../types";
import { buildMoleculeGraph } from "./graph";

export type VseprAnalysis = {
  atomId: string;
  axe: string;
  bondedAtoms: number;
  lonePairs: number;
  electronDomains: number;
  electronGeometry: string;
  molecularShape: string;
  idealAngle: number;
  relaxAngle: number;
};

const electronGeometries: Record<number, string> = {
  2: "Linear electron geometry",
  3: "Trigonal planar electron geometry",
  4: "Tetrahedral electron geometry",
  5: "Trigonal bipyramidal electron geometry",
  6: "Octahedral electron geometry"
};

const shapeByAxe: Record<string, { shape: string; angle: number; relaxAngle?: number }> = {
  AX1: { shape: "Terminal atom", angle: 0 },
  AX2: { shape: "Linear", angle: 180 },
  AX3: { shape: "Trigonal planar", angle: 120 },
  AX2E: { shape: "Bent", angle: 120 },
  AX4: { shape: "Tetrahedral", angle: 109.5, relaxAngle: 90 },
  AX3E: { shape: "Trigonal pyramidal", angle: 107, relaxAngle: 109.5 },
  AX2E2: { shape: "Bent", angle: 104.5 },
  AX5: { shape: "Trigonal bipyramidal", angle: 120, relaxAngle: 72 },
  AX4E: { shape: "Seesaw", angle: 102, relaxAngle: 90 },
  AX3E2: { shape: "T-shaped", angle: 90 },
  AX2E3: { shape: "Linear", angle: 180 },
  AX6: { shape: "Octahedral", angle: 90 },
  AX5E: { shape: "Square pyramidal", angle: 90 },
  AX4E2: { shape: "Square planar", angle: 90 }
};

export function analyzeAtomGeometry(atom: AtomParticle, atoms: AtomParticle[], bonds: Bond[]): VseprAnalysis | null {
  const graph = buildMoleculeGraph(atoms, bonds);
  const bondedAtoms = graph.neighborsById.get(atom.id)?.length ?? 0;
  if (!bondedAtoms) return null;

  const lonePairs = estimateLonePairs(atom, graph.bondsByAtomId.get(atom.id) ?? []);
  const electronDomains = Math.max(1, Math.min(6, bondedAtoms + lonePairs));
  const axe = `AX${bondedAtoms}${lonePairs ? `E${lonePairs > 1 ? lonePairs : ""}` : ""}`;
  const fallback = shapeByAxe[`AX${bondedAtoms}`] ?? { shape: `${bondedAtoms}-coordinate`, angle: bondedAtoms > 1 ? 360 / bondedAtoms : 0 };
  const shape = shapeByAxe[axe] ?? fallback;

  return {
    atomId: atom.id,
    axe,
    bondedAtoms,
    lonePairs,
    electronDomains,
    electronGeometry: electronGeometries[electronDomains] ?? `${electronDomains} electron domains`,
    molecularShape: shape.shape,
    idealAngle: shape.angle,
    relaxAngle: shape.relaxAngle ?? shape.angle
  };
}

export function estimateLonePairs(atom: AtomParticle, bonds: Bond[]) {
  const data = atomData[atom.symbol];
  if (atom.symbol === "H" || data.metal || data.nobleGas) return 0;
  const electronBudget = data.valenceElectrons - Math.max(0, atom.charge) + Math.max(0, -atom.charge);
  const bondOrder = bonds.reduce((sum, bond) => sum + (bond.kind === "ionic" ? 1 : bond.order), 0);
  return Math.max(0, Math.min(3, Math.round((electronBudget - bondOrder) / 2)));
}
