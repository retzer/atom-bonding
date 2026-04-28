import { atomData } from "../data/atoms";
import type { AtomParticle, AtomSymbol, Bond, ElectronEffect, MetallicElectron, MoleculePreset, SimulationSettings, SimulationState } from "../types";
import { applyIonCharges, canBond, classifyBond, eventForBond, makeBond } from "./chemistry";

const rand = (min: number, max: number) => min + Math.random() * (max - min);
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const idPart = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;

export function createAtom(symbol: AtomSymbol, x: number, y: number, guided = false): AtomParticle {
  const atom = atomData[symbol];
  return {
    id: `${symbol}-${idPart()}`,
    symbol,
    x,
    y,
    vx: rand(-24, 24),
    vy: rand(-24, 24),
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
  return Array.from({ length: count }, (_, index) => {
    const symbol = settings.selectedElements[index % settings.selectedElements.length];
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
  const dt = Math.min(0.04, rawDt * settings.speed);
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

  for (const atom of atoms) {
    if (atom.guided && atom.targetX !== undefined && atom.targetY !== undefined) {
      atom.vx += (atom.targetX - atom.x) * 0.34 * dt;
      atom.vy += (atom.targetY - atom.y) * 0.34 * dt;
    } else {
      atom.vx += rand(-1, 1) * settings.temperature * 8 * dt;
      atom.vy += rand(-1, 1) * settings.temperature * 8 * dt;
    }
    atom.vx *= 0.996;
    atom.vy *= 0.996;
    atom.x += atom.vx * dt * (24 + settings.temperature * 8);
    atom.y += atom.vy * dt * (24 + settings.temperature * 8);
    if (atom.x < atom.radius + 8 || atom.x > width - atom.radius - 8) {
      atom.vx *= -0.88;
      atom.x = clamp(atom.x, atom.radius + 8, width - atom.radius - 8);
    }
    if (atom.y < atom.radius + 8 || atom.y > height - atom.radius - 8) {
      atom.vy *= -0.88;
      atom.y = clamp(atom.y, atom.radius + 8, height - atom.radius - 8);
    }
  }

  for (const bond of bonds) {
    const a = atoms[indexById.get(bond.a)!];
    const b = atoms[indexById.get(bond.b)!];
    if (!a || !b) continue;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const dist = Math.max(0.01, Math.hypot(dx, dy));
    const target = bond.kind === "metallic" ? bond.length : bond.length * (1 - (bond.order - 1) * 0.1);
    const correction = (dist - target) * bond.strength;
    const nx = dx / dist;
    const ny = dy / dist;
    a.x += nx * correction;
    a.y += ny * correction;
    b.x -= nx * correction;
    b.y -= ny * correction;
    const sharedVx = (a.vx + b.vx) * 0.5;
    const sharedVy = (a.vy + b.vy) * 0.5;
    a.vx = a.vx * 0.88 + sharedVx * 0.12;
    a.vy = a.vy * 0.88 + sharedVy * 0.12;
    b.vx = b.vx * 0.88 + sharedVx * 0.12;
    b.vy = b.vy * 0.88 + sharedVy * 0.12;
  }

  for (let i = 0; i < atoms.length; i += 1) {
    for (let j = i + 1; j < atoms.length; j += 1) {
      const a = atoms[i];
      const b = atoms[j];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.max(0.01, Math.hypot(dx, dy));
      const minDist = a.radius + b.radius + 10;
      if (dist < minDist && !bonds.some((bond) => (bond.a === a.id && bond.b === b.id) || (bond.a === b.id && bond.b === a.id))) {
        const nx = dx / dist;
        const ny = dy / dist;
        const overlap = (minDist - dist) * 0.48;
        a.x -= nx * overlap;
        a.y -= ny * overlap;
        b.x += nx * overlap;
        b.y += ny * overlap;
        a.vx -= nx * settings.collisionStrength * 18;
        a.vy -= ny * settings.collisionStrength * 18;
        b.vx += nx * settings.collisionStrength * 18;
        b.vy += ny * settings.collisionStrength * 18;
      }

      const bondingRange = (a.radius + b.radius) * settings.bondingDistance;
      if (!state.metallicLattice && dist < bondingRange && canBond(a, b, bonds, settings)) {
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

  const metallicElectrons = state.metallicElectrons.map((electron) => {
    const next = { ...electron };
    next.x += next.vx * dt;
    next.y += next.vy * dt;
    const pad = 58;
    if (next.x < pad || next.x > width - pad) next.vx *= -1;
    if (next.y < pad || next.y > height - pad) next.vy *= -1;
    return next;
  });

  return {
    ...state,
    atoms,
    bonds,
    effects,
    metallicElectrons,
    events: events.slice(0, 8),
    time: state.time + dt
  };
}
