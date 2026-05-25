import { atomData } from "../data/atoms";
import { defaultIsotopeBySymbol, elementForAtomicNumber, isotopeId, isotopeRecordsById, isotopeRecordsBySymbol } from "../data/isotopes";
import type { AtomParticle, AtomSymbol, Bond, DecayBranch, DecayMode, IsotopeActivityLevel, IsotopeRecord, NuclearEvent, SimulationSettings, SimulationState } from "../types";
import { classifyBond } from "./chemistry";

const LN2 = Math.log(2);
const EVENT_LIMIT = 12;

export function hydrateAtomIsotope(atom: AtomParticle, simTime = 0): AtomParticle {
  const isotope = resolveIsotope(atom);
  return {
    ...atom,
    protonCount: isotope.atomicNumber,
    neutronCount: isotope.neutronCount,
    massNumber: isotope.massNumber,
    isotopeId: isotope.id,
    isotopeCreatedAt: atom.isotopeCreatedAt ?? simTime
  };
}

export function resolveIsotope(atom: AtomParticle): IsotopeRecord {
  if (atom.isotopeId) {
    const known = isotopeRecordsById.get(atom.isotopeId);
    if (known) return known;
  }
  if (atom.massNumber && atom.protonCount) {
    const element = elementForAtomicNumber(atom.protonCount);
    if (element) {
      const known = isotopeRecordsById.get(isotopeId(element.symbol, atom.massNumber));
      if (known) return known;
      return estimatedIsotope(element.symbol, atom.massNumber);
    }
  }
  return defaultIsotopeBySymbol.get(atom.symbol) ?? estimatedIsotope(atom.symbol, atomData[atom.symbol].atomicNumber * 2);
}

export function isotopeOptionsForSymbol(symbol: AtomSymbol) {
  return isotopeRecordsBySymbol.get(symbol) ?? [defaultIsotopeBySymbol.get(symbol)].filter((item): item is IsotopeRecord => Boolean(item));
}

export function setAtomIsotope(atom: AtomParticle, nextIsotopeId: string, simTime = 0): AtomParticle {
  const isotope = isotopeRecordsById.get(nextIsotopeId);
  if (!isotope) return atom;
  return withElementAndIsotope(atom, isotope.symbol, isotope.massNumber, simTime);
}

export function setAtomNeutronCount(atom: AtomParticle, neutronCount: number, simTime = 0): AtomParticle {
  const protons = atom.protonCount ?? atomData[atom.symbol].atomicNumber;
  const nextNeutrons = Math.max(0, Math.round(neutronCount));
  const element = elementForAtomicNumber(protons);
  if (!element) return atom;
  return withElementAndIsotope(atom, element.symbol, protons + nextNeutrons, simTime);
}

export function setAtomProtonCount(atom: AtomParticle, protonCount: number, simTime = 0): AtomParticle {
  const nextProtons = Math.max(1, Math.min(118, Math.round(protonCount)));
  const element = elementForAtomicNumber(nextProtons);
  if (!element) return atom;
  const neutrons = atom.neutronCount ?? Math.max(0, (atom.massNumber ?? nextProtons * 2) - (atom.protonCount ?? atomData[atom.symbol].atomicNumber));
  return withElementAndIsotope(atom, element.symbol, nextProtons + Math.max(0, neutrons), simTime);
}

export function applyAtomIsotopeEdit(
  state: SimulationState,
  atomId: string,
  edit: "isotope" | "neutrons" | "protons",
  value: string | number
): SimulationState {
  const currentAtom = state.atoms.find((atom) => atom.id === atomId);
  if (!currentAtom) return state;
  const before = resolveIsotope(currentAtom);
  const editedAtom = edit === "isotope"
    ? setAtomIsotope(currentAtom, String(value), state.time)
    : edit === "neutrons"
      ? setAtomNeutronCount(currentAtom, Number(value), state.time)
      : setAtomProtonCount(currentAtom, Number(value), state.time);
  const after = resolveIsotope(editedAtom);
  if (before.id === after.id && currentAtom.symbol === editedAtom.symbol) return state;

  const rawAtoms = state.atoms.map((atom) => atom.id === atomId ? editedAtom : atom);
  const bonds = recomputeBondsForAtoms(state.bonds, rawAtoms);
  const attached = attachBondIds(rawAtoms, bonds);
  const changedElement = before.symbol !== after.symbol;
  const title = changedElement ? `${before.label} -> ${after.label}` : `${after.label} selected`;
  const plain = changedElement
    ? `${before.label} was edited into ${after.label}. Changing proton count changes the element.`
    : edit === "neutrons"
      ? `${before.label} became ${after.label}. Changing neutron count changes isotope mass, not the element.`
      : `${after.label} is now the selected isotope.`;
  const science = changedElement
    ? "Element identity follows proton count. The molecule graph keeps the atom in place, then rechecks local bond lengths, polarity, and valence context for the new element."
    : "Isotopes share the same proton count and electron structure, so chemical identity stays the same while nuclear mass and stability can change.";

  return {
    ...state,
    atoms: attached.atoms,
    bonds: attached.bonds,
    hydrogenBonds: [],
    selectedAtomId: atomId,
    selectedBondId: null,
    events: [{
      id: `isotope-edit-${atomId}-${Math.round(state.time * 1000)}-${Date.now()}`,
      time: state.time,
      title,
      plain,
      science
    }, ...state.events].slice(0, 8)
  };
}

export function decayProbability(halfLifeSeconds: number | null | undefined, dtSeconds: number) {
  if (!halfLifeSeconds || halfLifeSeconds <= 0 || dtSeconds <= 0) return 0;
  return 1 - Math.exp(-(LN2 / halfLifeSeconds) * dtSeconds);
}

export function isotopeActivityLevel(isotope: IsotopeRecord): IsotopeActivityLevel {
  if (isotope.stable || !isotope.halfLifeSeconds) return "none";
  if (isotope.halfLifeSeconds < 60) return "extreme";
  if (isotope.halfLifeSeconds < 60 * 60 * 24 * 180) return "high";
  if (isotope.halfLifeSeconds < 60 * 60 * 24 * 365.25 * 1000000) return "medium";
  return "low";
}

export function isAtomRadioactive(atom: AtomParticle) {
  const isotope = resolveIsotope(atom);
  return !isotope.stable && isotopeActivityLevel(isotope) !== "none";
}

export function formatDecayMode(mode: DecayMode) {
  const labels: Record<DecayMode, string> = {
    stable: "Stable",
    alpha: "Alpha decay",
    "beta-minus": "Beta-minus decay",
    "beta-plus": "Beta-plus decay",
    "electron-capture": "Electron capture",
    "neutron-emission": "Neutron emission",
    "proton-emission": "Proton emission",
    gamma: "Gamma / isomeric transition",
    "spontaneous-fission": "Spontaneous fission"
  };
  return labels[mode];
}

export function applyNuclearDecay(state: SimulationState, settings: SimulationSettings, clockDt: number): SimulationState {
  if (!settings.decayEnabled || clockDt <= 0 || !state.atoms.length) return state;
  const decayDt = clockDt * Math.max(1, settings.decayTeachingAcceleration ?? 1);
  let atoms = state.atoms;
  let bonds = state.bonds;
  let changed = false;
  const newEvents: NuclearEvent[] = [];

  for (const atom of state.atoms) {
    const isotope = resolveIsotope(atom);
    const branch = chooseDecayBranch(isotope);
    if (!branch) continue;
    const probability = decayProbability(isotope.halfLifeSeconds, decayDt);
    if (probability <= 0 || Math.random() > probability) continue;
    const decayed = decayAtom(atom, isotope, branch, state.time);
    if (!decayed) continue;
    changed = true;
    atoms = atoms.map((item) => item.id === atom.id ? decayed.atom : item);
    bonds = recomputeBondsForAtoms(bonds, atoms);
    newEvents.push(decayed.event);
  }

  if (!changed) return state;
  const attached = attachBondIds(atoms, bonds);
  const bondEvents = newEvents.map((event) => ({
    id: event.id,
    time: event.time,
    title: event.title,
    plain: event.plain,
    science: event.science
  }));
  return {
    ...state,
    atoms: attached.atoms,
    bonds: attached.bonds,
    events: [...bondEvents, ...state.events].slice(0, 8),
    nuclearEvents: [...newEvents, ...(state.nuclearEvents ?? [])].slice(0, EVENT_LIMIT)
  };
}

function decayAtom(atom: AtomParticle, isotope: IsotopeRecord, branch: DecayBranch, simTime: number) {
  const daughter = branch.daughter ?? estimateDaughter(isotope, branch.mode);
  if (!daughter) return null;
  const daughterRecord = isotopeRecordsById.get(isotopeId(daughter.symbol, daughter.massNumber)) ?? estimatedIsotope(daughter.symbol, daughter.massNumber);
  const nextAtom = withElementAndIsotope(atom, daughter.symbol, daughter.massNumber, simTime);
  nextAtom.decayedFromIsotopeId = isotope.id;
  const event: NuclearEvent = {
    id: `nuclear-${atom.id}-${Math.round(simTime * 1000)}-${branch.mode}`,
    time: simTime,
    atomId: atom.id,
    fromIsotopeId: isotope.id,
    toIsotopeId: daughterRecord.id,
    fromLabel: isotope.label,
    toLabel: daughterRecord.label,
    decayMode: branch.mode,
    x: atom.x,
    y: atom.y,
    z: atom.z,
    title: `${isotope.label} -> ${daughterRecord.label}`,
    plain: `${isotope.label} changed into ${daughterRecord.label} by ${formatDecayMode(branch.mode).toLowerCase()}.`,
    science: branch.description
  };
  return { atom: nextAtom, event };
}

function withElementAndIsotope(atom: AtomParticle, symbol: AtomSymbol, massNumber: number, simTime: number): AtomParticle {
  const data = atomData[symbol];
  const isotope = isotopeRecordsById.get(isotopeId(symbol, massNumber)) ?? estimatedIsotope(symbol, massNumber);
  return {
    ...atom,
    symbol,
    protonCount: isotope.atomicNumber,
    neutronCount: isotope.neutronCount,
    massNumber,
    isotopeId: isotope.id,
    isotopeChangedAt: simTime,
    radius: Math.min(34, Math.max(18, data.covalentRadius * 0.34))
  };
}

function estimatedIsotope(symbol: AtomSymbol, massNumber: number): IsotopeRecord {
  const data = atomData[symbol];
  const defaultIso = defaultIsotopeBySymbol.get(symbol);
  const neutrons = Math.max(0, massNumber - data.atomicNumber);
  const neutronDelta = defaultIso ? neutrons - defaultIso.neutronCount : 0;
  const looksNuclearUnstable = data.atomicNumber >= 84 || Math.abs(neutronDelta) >= 2;
  const stable = !looksNuclearUnstable;
  return {
    id: isotopeId(symbol, massNumber),
    symbol,
    atomicNumber: data.atomicNumber,
    massNumber,
    neutronCount: neutrons,
    label: `${symbol}-${massNumber}`,
    stable,
    stability: stable ? "stable" : "estimated",
    halfLifeSeconds: null,
    halfLifeLabel: stable ? "stable in this local estimate" : "not available without source-backed isotope data",
    decayBranches: [],
    source: "local estimate",
    notes: stable
      ? "No source-backed isotope record is loaded for this isotope; it is treated as stable by the local model."
      : "No source-backed isotope record is loaded for this isotope. The simulator does not guess decay chains for it."
  };
}

function estimateDaughter(isotope: IsotopeRecord, mode: DecayMode) {
  if (mode === "neutron-emission") return { atomicNumber: isotope.atomicNumber, symbol: isotope.symbol, massNumber: isotope.massNumber - 1, neutronCount: isotope.neutronCount - 1 };
  if (mode === "proton-emission") {
    const element = elementForAtomicNumber(isotope.atomicNumber - 1);
    return element ? { atomicNumber: element.atomicNumber, symbol: element.symbol, massNumber: isotope.massNumber - 1, neutronCount: isotope.massNumber - 1 - element.atomicNumber } : null;
  }
  if (mode === "beta-minus") {
    const element = elementForAtomicNumber(isotope.atomicNumber + 1);
    return element ? { atomicNumber: element.atomicNumber, symbol: element.symbol, massNumber: isotope.massNumber, neutronCount: isotope.massNumber - element.atomicNumber } : null;
  }
  if (mode === "beta-plus" || mode === "electron-capture") {
    const element = elementForAtomicNumber(isotope.atomicNumber - 1);
    return element ? { atomicNumber: element.atomicNumber, symbol: element.symbol, massNumber: isotope.massNumber, neutronCount: isotope.massNumber - element.atomicNumber } : null;
  }
  if (mode === "alpha") {
    const element = elementForAtomicNumber(isotope.atomicNumber - 2);
    return element ? { atomicNumber: element.atomicNumber, symbol: element.symbol, massNumber: isotope.massNumber - 4, neutronCount: isotope.massNumber - 4 - element.atomicNumber } : null;
  }
  if (mode === "gamma") return { atomicNumber: isotope.atomicNumber, symbol: isotope.symbol, massNumber: isotope.massNumber, neutronCount: isotope.neutronCount };
  return null;
}

function chooseDecayBranch(isotope: IsotopeRecord) {
  if (isotope.stable || !isotope.decayBranches.length) return null;
  const random = Math.random();
  let threshold = 0;
  for (const branch of isotope.decayBranches) {
    threshold += branch.probability ?? 1;
    if (random <= threshold) return branch;
  }
  return isotope.decayBranches[0] ?? null;
}

function recomputeBondsForAtoms(bonds: Bond[], atoms: AtomParticle[]) {
  const byId = new Map(atoms.map((atom) => [atom.id, atom]));
  return bonds.flatMap((bond) => {
    const a = byId.get(bond.a);
    const b = byId.get(bond.b);
    if (!a || !b) return [];
    const atomA = atomData[a.symbol];
    const atomB = atomData[b.symbol];
    const kind = bond.kind === "hydrogen" || bond.kind === "dispersion" ? bond.kind : classifyBond(a.symbol, b.symbol, bond.order);
    const polarity = Math.abs(atomA.electronegativity - atomB.electronegativity);
    return [{
      ...bond,
      kind,
      polarity,
      electronShift: atomA.electronegativity === atomB.electronegativity ? undefined : atomA.electronegativity > atomB.electronegativity ? a.id : b.id,
      length: Math.max(58, (atomA.covalentRadius + atomB.covalentRadius) * 0.86 * (1 - (bond.order - 1) * 0.08)),
      strength: kind === "ionic" ? 0.08 : 0.14 + bond.order * 0.04
    }];
  });
}

function attachBondIds(atoms: AtomParticle[], bonds: Bond[]) {
  const idsByAtom = new Map<string, string[]>();
  for (const bond of bonds) {
    idsByAtom.set(bond.a, [...(idsByAtom.get(bond.a) ?? []), bond.id]);
    idsByAtom.set(bond.b, [...(idsByAtom.get(bond.b) ?? []), bond.id]);
  }
  return {
    atoms: atoms.map((atom) => ({ ...atom, bonds: idsByAtom.get(atom.id) ?? [] })),
    bonds
  };
}
