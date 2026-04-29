import { atomData } from "../data/atoms";
import type { AtomParticle, AtomSymbol, Bond, ElectronEffect, HydrogenBond, MetallicElectron, MoleculePreset, SimulationSettings, SimulationState } from "../types";
import { applyIonCharges, canBond, classifyBond, eventForBond, makeBond } from "./chemistry";
import { applyMolecularRelaxation } from "./relaxation";
import { applyVsepr3DTargets } from "./vsepr3d";

const rand = (min: number, max: number) => min + Math.random() * (max - min);
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const idPart = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;

export function createAtom(symbol: AtomSymbol, x: number, y: number, guided = false): AtomParticle {
  const atom = atomData[symbol];
  if (!atom) throw new Error(`Unsupported atom symbol: ${symbol}`);
  return {
    id: `${symbol}-${idPart()}`,
    symbol,
    x,
    y,
    z: 0,
    vx: rand(-24, 24),
    vy: rand(-24, 24),
    vz: 0,
    radius: clamp(atom.covalentRadius * 0.34, 18, 34),
    charge: 0,
    bonds: [],
    guided
  };
}

export function createFreeState(width: number, height: number, settings: SimulationSettings): SimulationState {
  const atoms: AtomParticle[] = [];
  return {
    atoms,
    bonds: [],
    hydrogenBonds: [],
    effects: [],
    metallicElectrons: [],
    events: [],
    selectedAtomId: atoms[0]?.id ?? null,
    selectedBondId: null,
    time: 0,
    metallicLattice: false
  };
}

export function createSpawnedAtoms(width: number, height: number, settings: SimulationSettings, count = settings.atomCount): AtomParticle[] {
  const selected = settings.selectedElements.filter((symbol) => atomData[symbol]);
  const elements = selected.length ? selected : (["C"] as AtomSymbol[]);
  return Array.from({ length: count }, (_, index) => {
    const symbol = elements[index % elements.length];
    return createAtom(symbol, rand(90, width - 90), rand(88, height - 88));
  });
}

export function createPresetState(width: number, height: number, preset: MoleculePreset): SimulationState {
  const cx = width * 0.48;
  const cy = height * 0.48;
  const atoms = preset.atoms.map((atom, index) => {
    const particle = createAtom(atom.symbol, cx + atom.x * 1.15 + rand(-8, 8), cy + atom.y * 1.15 + rand(-8, 8), true);
    particle.targetX = cx + atom.x;
    particle.targetY = cy + atom.y;
    particle.targetZ = 0;
    particle.vx = (particle.targetX - particle.x) * 0.12 + rand(-8, 8);
    particle.vy = (particle.targetY - particle.y) * 0.12 + rand(-8, 8);
    particle.id = `${atom.symbol}-${preset.id}-${index}`;
    particle.charge = preset.metallic ? 1 : 0;
    return particle;
  });

  const metallicElectrons: MetallicElectron[] = preset.metallic
    ? Array.from({ length: 22 }, (_, index) => ({
        id: `metal-electron-${index}`,
        x: cx + rand(-230, 230),
        y: cy + rand(-175, 215),
        vx: rand(-52, 52),
        vy: rand(-52, 52)
      }))
    : [];

  const bonds: Bond[] = [];
  if (preset.bonds?.length) {
    for (const presetBond of preset.bonds) {
      const a = atoms[presetBond.a];
      const b = atoms[presetBond.b];
      if (!a || !b) continue;
      const kind = presetBond.kind ?? classifyBond(a.symbol, b.symbol, 1);
      const atomA = atomData[a.symbol];
      const atomB = atomData[b.symbol];
      const targetDistance = Math.hypot((a.targetX ?? a.x) - (b.targetX ?? b.x), (a.targetY ?? a.y) - (b.targetY ?? b.y));
      const polarity = Math.abs(atomA.electronegativity - atomB.electronegativity);
      const electronShift = atomA.electronegativity === atomB.electronegativity
        ? undefined
        : atomA.electronegativity > atomB.electronegativity ? a.id : b.id;

      bonds.push({
        id: `preset-bond-${preset.id}-${presetBond.a}-${presetBond.b}`,
        a: a.id,
        b: b.id,
        kind,
        order: kind === "ionic" ? 1 : presetBond.order ?? 1,
        strength: kind === "ionic" ? 0.08 : 0.14 + (presetBond.order ?? 1) * 0.04,
        length: targetDistance || Math.max(78, (atomA.covalentRadius + atomB.covalentRadius) * 0.86),
        formedAt: 0,
        polarity,
        electronShift
      });
    }
  }

  if (preset.metallic) {
    for (let i = 0; i < atoms.length; i += 1) {
      for (let j = i + 1; j < atoms.length; j += 1) {
        const dx = atoms[i].x - atoms[j].x;
        const dy = atoms[i].y - atoms[j].y;
        if (Math.hypot(dx, dy) < 190) {
          bonds.push({
            id: `metal-${i}-${j}`,
            a: atoms[i].id,
            b: atoms[j].id,
            kind: "metallic",
            order: 1,
            strength: 0.045,
            length: 145,
            formedAt: 0,
            polarity: 0
          });
        }
      }
    }
  }

  return {
    atoms,
    bonds,
    hydrogenBonds: [],
    effects: preset.metallic ? [{ id: "delocalized", from: atoms[0]?.id ?? "", to: atoms[1]?.id ?? "", progress: 0, kind: "delocalized" }] : [],
    metallicElectrons,
    events: [{
      id: `preset-${preset.id}`,
      time: 0,
      title: preset.formula,
      plain: preset.description,
      science: preset.science
    }],
    selectedAtomId: atoms[0]?.id ?? null,
    selectedBondId: null,
    time: 0,
    metallicLattice: Boolean(preset.metallic)
  };
}

export function stepSimulation(state: SimulationState, settings: SimulationSettings, width: number, height: number, rawDt: number): SimulationState {
  const rigid = settings.geometryMode === "rigid";
  const dt = Math.min(0.04, rawDt * settings.speed * (rigid ? settings.geometry3D ? 0.42 : 0.58 : settings.geometry3D ? 0.5 : 1));
  const thermalMotion = rigid ? settings.temperature * 0.018 : settings.geometry3D ? settings.temperature * 0.12 : settings.temperature;
  const collisionStrength = rigid ? settings.collisionStrength * (settings.geometry3D ? 0.045 : 0.08) : settings.geometry3D ? settings.collisionStrength * 0.18 : settings.collisionStrength;
  const motionScale = rigid ? settings.geometry3D ? 7 : 11 : settings.geometry3D ? 9 + settings.temperature * 2 : 24 + settings.temperature * 8;
  const atoms = state.atoms.map((atom) => ({ ...atom, bonds: [] as string[] }));
  const bonds = state.bonds.map((bond) => ({ ...bond }));
  const effects = state.effects
    .map((effect) => ({ ...effect, progress: effect.progress + dt * (effect.kind === "transfer" ? 0.78 : 0.46) }))
    .filter((effect) => effect.kind === "delocalized" || effect.progress < 1.1);
  const events = [...state.events];
  const indexById = new Map(atoms.map((atom, index) => [atom.id, index]));

  for (const bond of bonds) {
    atoms[indexById.get(bond.a)!]?.bonds.push(bond.id);
    atoms[indexById.get(bond.b)!]?.bonds.push(bond.id);
  }

  if (settings.geometry3D) {
    applyVsepr3DTargets(atoms, bonds);
  }

  for (const atom of atoms) {
    if (atom.guided && atom.targetX !== undefined && atom.targetY !== undefined) {
      const targetPull = rigid ? settings.geometry3D ? 0.72 : 0.9 : 0.34;
      atom.vx += (atom.targetX - atom.x) * targetPull * dt;
      atom.vy += (atom.targetY - atom.y) * targetPull * dt;
      if (settings.geometry3D && atom.targetZ !== undefined) {
        atom.vz = (atom.vz ?? 0) + (atom.targetZ - (atom.z ?? 0)) * targetPull * dt;
      }
    } else {
      atom.vx += rand(-1, 1) * thermalMotion * 8 * dt;
      atom.vy += rand(-1, 1) * thermalMotion * 8 * dt;
      atom.vz = (atom.vz ?? 0) + rand(-1, 1) * thermalMotion * 1.8 * dt;
    }
    atom.vx *= rigid ? settings.geometry3D ? 0.88 : 0.78 : settings.geometry3D ? 0.94 : 0.996;
    atom.vy *= rigid ? settings.geometry3D ? 0.88 : 0.78 : settings.geometry3D ? 0.94 : 0.996;
    atom.vz = (atom.vz ?? 0) * (settings.geometry3D ? rigid ? 0.84 : 0.9 : rigid ? 0.78 : 0.992);
    atom.x += atom.vx * dt * motionScale;
    atom.y += atom.vy * dt * motionScale;
    atom.z = settings.geometry3D ? (atom.z ?? 0) + (atom.vz ?? 0) * dt * motionScale : 0;
    if (atom.x < atom.radius + 8 || atom.x > width - atom.radius - 8) {
      atom.vx *= -0.88;
      atom.x = clamp(atom.x, atom.radius + 8, width - atom.radius - 8);
    }
    if (atom.y < atom.radius + 8 || atom.y > height - atom.radius - 8) {
      atom.vy *= -0.88;
      atom.y = clamp(atom.y, atom.radius + 8, height - atom.radius - 8);
    }
    atom.z = clamp(atom.z ?? 0, -160, 160);
  }

  for (const bond of bonds) {
    const a = atoms[indexById.get(bond.a)!];
    const b = atoms[indexById.get(bond.b)!];
    if (!a || !b) continue;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const dist = Math.max(0.01, Math.hypot(dx, dy));
    const target = bond.kind === "metallic" ? bond.length : bond.length * (1 - (bond.order - 1) * 0.1);
    const correction = (dist - target) * bond.strength * (rigid ? settings.geometry3D ? 1.2 : 1.75 : 1);
    const nx = dx / dist;
    const ny = dy / dist;
    a.x += nx * correction;
    a.y += ny * correction;
    b.x -= nx * correction;
    b.y -= ny * correction;
    const sharedVx = (a.vx + b.vx) * 0.5;
    const sharedVy = (a.vy + b.vy) * 0.5;
    const selfVelocity = rigid ? 0.72 : 0.88;
    const sharedVelocity = 1 - selfVelocity;
    a.vx = a.vx * selfVelocity + sharedVx * sharedVelocity;
    a.vy = a.vy * selfVelocity + sharedVy * sharedVelocity;
    b.vx = b.vx * selfVelocity + sharedVx * sharedVelocity;
    b.vy = b.vy * selfVelocity + sharedVy * sharedVelocity;
  }

  for (let i = 0; i < atoms.length; i += 1) {
    for (let j = i + 1; j < atoms.length; j += 1) {
      const a = atoms[i];
      const b = atoms[j];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dz = (b.z ?? 0) - (a.z ?? 0);
      const dist = Math.max(0.01, settings.geometry3D ? Math.hypot(dx, dy, dz) : Math.hypot(dx, dy));
      const formationDistance = settings.geometry3D ? Math.hypot(dx, dy, dz * 0.55) : dist;
      const minDist = a.radius + b.radius + 10;
      if (dist < minDist && !bonds.some((bond) => (bond.a === a.id && bond.b === b.id) || (bond.a === b.id && bond.b === a.id))) {
        const nx = dx / dist;
        const ny = dy / dist;
        const nz = settings.geometry3D ? dz / dist : 0;
        const overlap = (minDist - dist) * 0.48;
        a.x -= nx * overlap;
        a.y -= ny * overlap;
        a.z = (a.z ?? 0) - nz * overlap;
        b.x += nx * overlap;
        b.y += ny * overlap;
        b.z = (b.z ?? 0) + nz * overlap;
        a.vx -= nx * collisionStrength * 18;
        a.vy -= ny * collisionStrength * 18;
        a.vz = (a.vz ?? 0) - nz * collisionStrength * 9;
        b.vx += nx * collisionStrength * 18;
        b.vy += ny * collisionStrength * 18;
        b.vz = (b.vz ?? 0) + nz * collisionStrength * 9;
      }

      const bondingRange = (a.radius + b.radius) * settings.bondingDistance * (settings.geometry3D ? 1.18 : 1);
      if (!state.metallicLattice && formationDistance < bondingRange && canBond(a, b, bonds, settings)) {
        const bond = makeBond(a, b, state.time, settings);
        bonds.push(bond);
        a.bonds.push(bond.id);
        b.bonds.push(bond.id);
        if (bond.kind === "ionic") applyIonCharges(a, b);
        effects.push({
          id: `effect-${bond.id}`,
          from: bond.kind === "ionic" && bond.electronShift === a.id ? b.id : a.id,
          to: bond.kind === "ionic" && bond.electronShift === a.id ? a.id : b.id,
          progress: 0,
          kind: bond.kind === "ionic" ? "transfer" : "share"
        });
        events.unshift(eventForBond(bond, a, b));
      }
    }
  }

  applyMolecularRelaxation(atoms, bonds, settings, dt);

  const metallicElectrons = state.metallicElectrons.map((electron) => {
    const next = { ...electron };
    next.x += next.vx * dt;
    next.y += next.vy * dt;
    const pad = 58;
    if (next.x < pad || next.x > width - pad) next.vx *= -1;
    if (next.y < pad || next.y > height - pad) next.vy *= -1;
    return next;
  });
  const hydrogenBonds = state.metallicLattice ? [] : findHydrogenBonds(atoms, bonds);

  return {
    ...state,
    atoms,
    bonds,
    hydrogenBonds,
    effects,
    metallicElectrons,
    events: events.slice(0, 8),
    time: state.time + dt
  };
}

function findHydrogenBonds(atoms: AtomParticle[], bonds: Bond[]): HydrogenBond[] {
  const atomById = new Map(atoms.map((atom) => [atom.id, atom]));
  const structuralBonds = bonds.filter((bond) => bond.kind !== "hydrogen" && bond.kind !== "dispersion");
  const hBonds: HydrogenBond[] = [];
  const acceptors = atoms.filter((atom) => ["O", "N", "F"].includes(atom.symbol) && atom.charge <= 0);

  for (const hydrogen of atoms.filter((atom) => atom.symbol === "H")) {
    const donorBond = structuralBonds.find((bond) => bond.a === hydrogen.id || bond.b === hydrogen.id);
    if (!donorBond) continue;
    const donorId = donorBond.a === hydrogen.id ? donorBond.b : donorBond.a;
    const donor = atomById.get(donorId);
    if (!donor || !["O", "N", "F"].includes(donor.symbol)) continue;

    for (const acceptor of acceptors) {
      if (acceptor.id === donor.id) continue;
      if (structuralBonds.some((bond) => (bond.a === hydrogen.id && bond.b === acceptor.id) || (bond.b === hydrogen.id && bond.a === acceptor.id))) continue;
      const distance = Math.hypot(acceptor.x - hydrogen.x, acceptor.y - hydrogen.y);
      if (distance > 68 && distance < 190) {
        hBonds.push({
          id: `hbond-${hydrogen.id}-${acceptor.id}`,
          hydrogen: hydrogen.id,
          donor: donor.id,
          acceptor: acceptor.id,
          distance,
          strength: Math.max(0, 1 - (distance - 68) / 122)
        });
      }
    }
  }

  return hBonds.sort((a, b) => b.strength - a.strength).slice(0, 12);
}
