import type { AtomParticle, Bond, SimulationSettings } from "../types";
import { buildMoleculeGraph, structuralBonds } from "./graph";
import { analyzeAtomGeometry } from "./vsepr";

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function applyMolecularRelaxation(atoms: AtomParticle[], bonds: Bond[], settings: SimulationSettings, dt: number) {
  if (!settings.geometryAssist || atoms.length < 2) return;
  const rigid = settings.geometryMode === "rigid";
  const strength = rigid ? settings.geometry3D ? 1.5 : 2.0 : settings.relaxationStrength;
  if (strength <= 0) return;

  applyBondSprings(atoms, bonds, strength, dt);
  if (settings.geometry3D) applyTargetDepthSprings(atoms, strength, dt);
  applyVseprAngleForces(atoms, bonds, strength, dt);
  applyNonbondedRepulsion(atoms, bonds, settings, rigid ? strength * 0.28 : strength, dt);
}

function applyBondSprings(atoms: AtomParticle[], bonds: Bond[], strength: number, dt: number) {
  const atomById = new Map(atoms.map((atom) => [atom.id, atom]));
  for (const bond of structuralBonds(bonds)) {
    if (bond.kind === "metallic") continue;
    const a = atomById.get(bond.a);
    const b = atomById.get(bond.b);
    if (!a || !b) continue;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const dz = (b.z ?? 0) - (a.z ?? 0);
    const dist = Math.max(0.01, Math.hypot(dx, dy, dz));
    const target = bond.length * (1 - (bond.order - 1) * 0.04);
    const force = clamp((dist - target) * 0.34 * strength * dt, -3.2, 3.2);
    const nx = dx / dist;
    const ny = dy / dist;
    const nz = dz / dist;
    a.x += nx * force;
    a.y += ny * force;
    a.z = (a.z ?? 0) + nz * force;
    b.x -= nx * force;
    b.y -= ny * force;
    b.z = (b.z ?? 0) - nz * force;
  }
}

function applyTargetDepthSprings(atoms: AtomParticle[], strength: number, dt: number) {
  for (const atom of atoms) {
    if (atom.targetZ === undefined) continue;
    const force = clamp((atom.targetZ - (atom.z ?? 0)) * strength * dt * 0.46, -4, 4);
    atom.z = (atom.z ?? 0) + force;
    atom.vz = (atom.vz ?? 0) + force * 0.16;
  }
}

function applyVseprAngleForces(atoms: AtomParticle[], bonds: Bond[], strength: number, dt: number) {
  const graph = buildMoleculeGraph(atoms, bonds);
  for (const center of atoms) {
    const analysis = analyzeAtomGeometry(center, atoms, bonds);
    const neighbors = graph.neighborsById.get(center.id) ?? [];
    if (!analysis || neighbors.length < 2 || analysis.relaxAngle <= 0) continue;
    const target = analysis.relaxAngle * Math.PI / 180;
    const perPair = neighbors.length > 3 ? 0.55 : 1;
    const lonePairForceBoost = 1 + analysis.lonePairs * 0.22;

    for (let i = 0; i < neighbors.length; i += 1) {
      for (let j = i + 1; j < neighbors.length; j += 1) {
        const a = neighbors[i];
        const b = neighbors[j];
        const ax = a.x - center.x;
        const ay = a.y - center.y;
        const bx = b.x - center.x;
        const by = b.y - center.y;
        const al = Math.max(0.01, Math.hypot(ax, ay));
        const bl = Math.max(0.01, Math.hypot(bx, by));
        const ux = ax / al;
        const uy = ay / al;
        const vx = bx / bl;
        const vy = by / bl;
        const dot = clamp(ux * vx + uy * vy, -1, 1);
        const angle = Math.acos(dot);
        const cross = ux * vy - uy * vx || 1;
        const delta = clamp(target - angle, -0.9, 0.9);
        const force = delta * strength * dt * 74 * perPair * lonePairForceBoost;
        const aTangent = cross > 0 ? { x: uy, y: -ux } : { x: -uy, y: ux };
        const bTangent = cross > 0 ? { x: -vy, y: vx } : { x: vy, y: -vx };

        if (!a.guided) {
          a.x += aTangent.x * force;
          a.y += aTangent.y * force;
        } else {
          a.vx += aTangent.x * force * 0.38;
          a.vy += aTangent.y * force * 0.38;
        }
        if (!b.guided) {
          b.x += bTangent.x * force;
          b.y += bTangent.y * force;
        } else {
          b.vx += bTangent.x * force * 0.38;
          b.vy += bTangent.y * force * 0.38;
        }
      }
    }
  }
}

function applyNonbondedRepulsion(atoms: AtomParticle[], bonds: Bond[], settings: SimulationSettings, strength: number, dt: number) {
  const bonded = new Set(structuralBonds(bonds).map((bond) => [bond.a, bond.b].sort().join("|")));
  for (let i = 0; i < atoms.length; i += 1) {
    for (let j = i + 1; j < atoms.length; j += 1) {
      const a = atoms[i];
      const b = atoms[j];
      if (bonded.has([a.id, b.id].sort().join("|"))) continue;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dz = settings.geometry3D ? (b.z ?? 0) - (a.z ?? 0) : 0;
      const dist = Math.max(0.01, Math.hypot(dx, dy, dz));
      const minDist = Math.min(120, a.radius + b.radius + 28);
      if (dist >= minDist) continue;
      const push = (minDist - dist) * strength * dt * 0.9;
      const nx = dx / dist;
      const ny = dy / dist;
      const nz = dz / dist;
      a.x -= nx * push;
      a.y -= ny * push;
      a.z = (a.z ?? 0) - nz * push;
      b.x += nx * push;
      b.y += ny * push;
      b.z = (b.z ?? 0) + nz * push;
    }
  }
}
