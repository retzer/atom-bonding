import { atomData } from "../data/atoms";
import type { AtomParticle, Bond, BondKind, ElectronEffect, ReactionAction, ReactionPreview, ReactionScore, ReactionStep, SimulationSettings, SimulationState } from "../types";
import { availableBondSlots, bondKindLabel, classifyBond, desiredBondOrder } from "./chemistry";
import { structuralBonds } from "./graph";
import { analyzeMolecule } from "./moleculeAnalysis";
import { analyzeAtomGeometry, estimateLonePairs } from "./vsepr";

type CommitResult = {
  state: SimulationState;
  step: ReactionStep;
  preview: ReactionPreview;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const unique = <T,>(items: T[]) => [...new Set(items)];

export function previewReaction(state: SimulationState, settings: SimulationSettings, action: ReactionAction): ReactionPreview {
  const scoreBefore = scoreMolecule(state);
  const base = basePreview(action, scoreBefore);
  const atoms = state.atoms;
  const bonds = structuralBonds(state.bonds);
  const atomById = new Map(atoms.map((atom) => [atom.id, atom]));
  const bondById = new Map(bonds.map((bond) => [bond.id, bond]));

  if (action.type === "form-bond" || action.type === "nucleophile-attack") {
    const [aId, bId] = action.atomIds ?? [];
    const a = aId ? atomById.get(aId) : null;
    const b = bId ? atomById.get(bId) : null;
    if (!a || !b || a.id === b.id) return blocked(base, "Choose two different atoms.", "A bond-forming step needs two distinct atoms.");
    const existing = bonds.find((bond) => samePair(bond, a.id, b.id));
    if (existing) return blocked({ ...base, affectedAtomIds: [a.id, b.id], affectedBondIds: [existing.id] }, "Those atoms are already bonded.", "Change the bond order or break the existing bond first.");
    const kind = classifyReactionBondKind(a, b, settings);
    if (kind === "metallic") return blocked({ ...base, affectedAtomIds: [a.id, b.id] }, "Metallic bonding is not edited as a single mechanism step.", "Use molecular covalent or ionic structures for reaction mechanisms.");
    const order = action.type === "nucleophile-attack" ? 1 : (kind === "ionic" || kind === "coordinate") ? 1 : desiredBondOrder(a.symbol, b.symbol);
    const warnings = kind === "coordinate"
      ? coordinationCapacityWarnings(a, b, state.bonds)
      : action.type === "nucleophile-attack"
      ? nucleophileCapacityWarnings(a, b, state, order)
      : bondCapacityWarnings(a, b, state.bonds, order);
    const nucWarning = action.type === "nucleophile-attack" ? nucleophileWarnings(a, b, state) : [];
    const allowed = warnings.length === 0 && nucWarning.length === 0;
    return {
      ...base,
      allowed,
      message: allowed ? kind === "coordinate" ? "Coordination preview ready." : (action.type === "nucleophile-attack" ? "Nucleophile attack preview ready." : "Bond formation preview ready.") : "This bond-forming step is blocked.",
      explanation: kind === "coordinate"
        ? `${labelAtom(ligandDonor(a, b) ?? a)} donates a lone-pair region toward ${labelAtom(coordinationCenter(a, b) ?? b)}. The preview uses a coordinate bond so the metal-ligand interaction stays visually distinct from ordinary covalent sharing.`
        : action.type === "nucleophile-attack"
        ? `${labelAtom(a)} donates electron density toward ${labelAtom(b)}. A new single bond is proposed and any adjacent carbonyl pi bond may relax into an intermediate.`
        : `${labelAtom(a)} and ${labelAtom(b)} can form a ${bondKindLabel[kind].toLowerCase()} interaction if their valence capacity can absorb ${order} shared pair${order > 1 ? "s" : ""}.`,
      affectedAtomIds: [a.id, b.id],
      ghostBonds: [{ a: a.id, b: b.id, order, label: action.type === "nucleophile-attack" ? "ATTACK" : "FORM" }],
      flowArrows: [{ fromAtomId: (ligandDonor(a, b) ?? a).id, toAtomId: (coordinationCenter(a, b) ?? b).id, label: kind === "coordinate" ? "lone pair -> metal" : action.type === "nucleophile-attack" ? "electron pair" : "bond", tone: "form" }],
      warnings: [...warnings, ...nucWarning],
      scoreAfter: allowed ? estimateScoreAfterPreview(state, action, settings) : undefined
    };
  }

  if (action.type === "break-bond") {
    const bond = action.bondId ? bondById.get(action.bondId) : null;
    if (!bond) return blocked(base, "Select a structural bond to break.", "Hydrogen-bond and dispersion overlays are not treated as editable structural bonds.");
    return {
      ...base,
      allowed: true,
      message: "Bond break preview ready.",
      explanation: "The selected bond will be removed. The two atoms keep their element identity, while local charges and geometry are re-evaluated.",
      affectedAtomIds: [bond.a, bond.b],
      affectedBondIds: [bond.id],
      breakingBondIds: [bond.id],
      flowArrows: [{ fromAtomId: bond.a, toAtomId: bond.b, label: "bond breaks", tone: "break" }],
      scoreAfter: estimateScoreAfterPreview(state, action, settings)
    };
  }

  if (action.type === "increase-bond-order" || action.type === "decrease-bond-order") {
    const bond = action.bondId ? bondById.get(action.bondId) : null;
    if (!bond) return blocked(base, "Select a covalent bond first.", "Bond-order edits require an existing structural bond.");
    if (bond.kind === "ionic" || bond.kind === "metallic" || bond.kind === "coordinate") return blocked({ ...base, affectedAtomIds: [bond.a, bond.b], affectedBondIds: [bond.id] }, "Only covalent bond orders can be changed.", "Ionic, metallic, and coordinate interactions are not represented with double or triple bond orders.");
    if (action.type === "increase-bond-order" && bond.order >= 3) return blocked({ ...base, affectedAtomIds: [bond.a, bond.b], affectedBondIds: [bond.id] }, "This bond is already triple.", "Triple is the maximum bond order in this model.");
    if (action.type === "decrease-bond-order" && bond.order <= 1) return blocked({ ...base, affectedAtomIds: [bond.a, bond.b], affectedBondIds: [bond.id] }, "This bond is already single.", "Use Break bond to remove a single bond.");
    const a = atomById.get(bond.a);
    const b = atomById.get(bond.b);
    if (!a || !b) return blocked(base, "Bond endpoints are missing.", "The selected bond no longer has both atoms in the scene.");
    const warnings = action.type === "increase-bond-order" ? orderCapacityWarnings(a, b, state.bonds, bond) : [];
    const allowed = warnings.length === 0;
    return {
      ...base,
      allowed,
      message: allowed ? "Bond order preview ready." : "This bond-order change is blocked.",
      explanation: action.type === "increase-bond-order"
        ? "One more shared electron pair is added, shortening and strengthening the bond while increasing valence demand."
        : "One shared electron pair is removed, lengthening the bond and reducing valence demand.",
      affectedAtomIds: [bond.a, bond.b],
      affectedBondIds: [bond.id],
      flowArrows: [{ fromAtomId: bond.a, toAtomId: bond.b, label: action.type === "increase-bond-order" ? "more sharing" : "less sharing", tone: "charge" }],
      warnings,
      scoreAfter: allowed ? estimateScoreAfterPreview(state, action, settings) : undefined
    };
  }

  if (action.type === "protonate") {
    const [atomId] = action.atomIds ?? [];
    const atom = atomId ? atomById.get(atomId) : null;
    if (!atom) return blocked(base, "Select an atom to protonate.", "Protonation needs a target atom with an available lone-pair or electron-rich site.");
    const warnings = protonationWarnings(atom, state.bonds);
    const allowed = warnings.length === 0;
    return {
      ...base,
      allowed,
      message: allowed ? "Protonation preview ready." : "This protonation is blocked.",
      explanation: `${labelAtom(atom)} receives H+. A new X-H bond is drawn and the target becomes one charge unit more positive.`,
      affectedAtomIds: [atom.id],
      ghostBonds: [{ a: atom.id, b: "ghost-H", order: 1, label: "H+" }],
      flowArrows: [{ fromAtomId: atom.id, toAtomId: atom.id, label: "lone pair -> H+", tone: "charge" }],
      warnings,
      scoreAfter: allowed ? estimateScoreAfterPreview(state, action, settings) : undefined
    };
  }

  if (action.type === "deprotonate") {
    const target = findDeprotonationTarget(state, action);
    if (!target) return blocked(base, "Select an X-H bond or an atom with a removable H.", "Deprotonation removes a bonded hydrogen from a non-hydrogen atom.");
    return {
      ...base,
      allowed: true,
      message: "Deprotonation preview ready.",
      explanation: `${labelAtom(target.heavy)} loses H+. The X-H bond is removed and the heavy atom becomes one charge unit more negative.`,
      affectedAtomIds: [target.heavy.id, target.hydrogen.id],
      affectedBondIds: [target.bond.id],
      breakingBondIds: [target.bond.id],
      flowArrows: [{ fromAtomId: target.hydrogen.id, toAtomId: target.heavy.id, label: "bond pair stays", tone: "break" }],
      scoreAfter: estimateScoreAfterPreview(state, action, settings)
    };
  }

  return blocked(base, "Reaction action is not supported yet.", "Choose one of the available mechanism primitives.");
}

export function commitReaction(state: SimulationState, settings: SimulationSettings, action: ReactionAction): CommitResult | null {
  const preview = previewReaction(state, settings, action);
  if (!preview.allowed) return null;
  const beforeFormula = formulaFromAtoms(state.atoms);
  const beforeScore = preview.scoreBefore;
  let atoms = state.atoms.map((atom) => ({ ...atom, bonds: [...atom.bonds] }));
  let bonds = state.bonds.map((bond) => ({ ...bond }));
  let selectedAtomId = state.selectedAtomId;
  let selectedBondId = state.selectedBondId;
  const effects: ElectronEffect[] = [...state.effects];

  const atomById = () => new Map(atoms.map((atom) => [atom.id, atom]));
  const addEffect = (from: string, to: string, kind: ElectronEffect["kind"] = "share") => {
    effects.push({ id: `reaction-effect-${Date.now()}-${effects.length}`, from, to, progress: 0, kind });
  };

  if (action.type === "form-bond" || action.type === "nucleophile-attack") {
    const [aId, bId] = action.atomIds ?? [];
    const map = atomById();
    const a = aId ? map.get(aId) : null;
    const b = bId ? map.get(bId) : null;
    if (!a || !b) return null;
    const bond = createReactionBond(a, b, state.time, settings, action.type === "nucleophile-attack" ? 1 : undefined);
    bonds.push(bond);
    selectedBondId = bond.id;
    selectedAtomId = null;
    addEffect(a.id, b.id, bond.kind === "ionic" ? "transfer" : "share");
    if (action.type === "nucleophile-attack") {
      atoms = applyNucleophileChargeShift(atoms, bonds, a.id, b.id);
      bonds = relaxAdjacentPiBond(bonds, atoms, b.id);
    }
  } else if (action.type === "break-bond") {
    bonds = bonds.filter((bond) => bond.id !== action.bondId);
    selectedBondId = null;
  } else if (action.type === "increase-bond-order" || action.type === "decrease-bond-order") {
    bonds = bonds.map((bond) => {
      if (bond.id !== action.bondId) return bond;
      const nextOrder = clamp(bond.order + (action.type === "increase-bond-order" ? 1 : -1), 1, 3) as 1 | 2 | 3;
      return { ...bond, order: nextOrder, strength: bond.kind === "ionic" ? 0.08 : 0.14 + nextOrder * 0.04, length: adjustedBondLength(bond, nextOrder) };
    });
    selectedBondId = action.bondId ?? null;
    const bond = bonds.find((item) => item.id === action.bondId);
    if (bond) addEffect(bond.a, bond.b);
  } else if (action.type === "protonate") {
    const [atomId] = action.atomIds ?? [];
    const target = atomId ? atomById().get(atomId) : null;
    if (!target) return null;
    const hydrogen = createHydrogenNear(target, atoms.length);
    atoms.push(hydrogen);
    bonds.push(createReactionBond(target, hydrogen, state.time, settings, 1));
    atoms = atoms.map((atom) => atom.id === target.id ? { ...atom, charge: atom.charge + 1 } : atom);
    selectedAtomId = target.id;
    selectedBondId = null;
    addEffect(target.id, hydrogen.id, "share");
  } else if (action.type === "deprotonate") {
    const target = findDeprotonationTarget({ ...state, atoms, bonds }, action);
    if (!target) return null;
    bonds = bonds.filter((bond) => bond.id !== target.bond.id);
    atoms = atoms
      .filter((atom) => atom.id !== target.hydrogen.id)
      .map((atom) => atom.id === target.heavy.id ? { ...atom, charge: atom.charge - 1 } : atom);
    selectedAtomId = target.heavy.id;
    selectedBondId = null;
    addEffect(target.hydrogen.id, target.heavy.id, "transfer");
  }

  atoms = attachBondIds(atoms, bonds);
  atoms = refreshGeometryTargets(atoms, bonds, settings);
  const afterState: SimulationState = {
    ...state,
    atoms,
    bonds,
    hydrogenBonds: [],
    effects: effects.slice(-24),
    selectedAtomId,
    selectedBondId,
    metallicLattice: false,
    events: [reactionEvent(preview, state.time), ...state.events].slice(0, 8)
  };
  const afterFormula = formulaFromAtoms(afterState.atoms);
  const afterScore = scoreMolecule(afterState);
  const step: ReactionStep = {
    id: `reaction-step-${Date.now()}`,
    action,
    beforeFormula,
    afterFormula,
    affectedAtomIds: preview.affectedAtomIds,
    affectedBondIds: preview.affectedBondIds,
    explanation: preview.explanation,
    scoreDelta: afterScore.relativeStability - beforeScore.relativeStability,
    simTime: afterState.time,
    timestamp: Date.now()
  };
  return { state: afterState, step, preview: { ...preview, scoreAfter: afterScore } };
}

export function scoreMolecule(state: Pick<SimulationState, "atoms" | "bonds" | "hydrogenBonds">): ReactionScore {
  const structural = structuralBonds(state.bonds);
  const atomById = new Map(state.atoms.map((atom) => [atom.id, atom]));
  let valenceStress = 0;
  let angleStrain = 0;
  for (const atom of state.atoms) {
    const data = atomData[atom.symbol];
    const order = structural
      .filter((bond) => bond.a === atom.id || bond.b === atom.id)
      .reduce((sum, bond) => sum + (bond.kind === "ionic" || bond.kind === "coordinate" ? 1 : bond.order), 0);
    valenceStress += Math.max(0, order - data.maxBonds) * 2;
    if (atom.symbol !== "H" && order === 0 && Math.abs(atom.charge) > 0) valenceStress += 0.5;
    const geometry = analyzeAtomGeometry(atom, state.atoms, state.bonds);
    if (geometry && geometry.bondedAtoms > 1 && geometry.relaxAngle > 0) {
      const neighbors = structural
        .filter((bond) => bond.a === atom.id || bond.b === atom.id)
        .map((bond) => atomById.get(bond.a === atom.id ? bond.b : bond.a))
        .filter((item): item is AtomParticle => Boolean(item));
      for (let i = 0; i < neighbors.length; i += 1) {
        for (let j = i + 1; j < neighbors.length; j += 1) {
          const angle = angleBetween(atom, neighbors[i], neighbors[j]);
          angleStrain += Math.min(45, Math.abs(angle - geometry.relaxAngle)) / 45;
        }
      }
    }
  }
  const chargeSeparation = state.atoms.reduce((sum, atom) => sum + Math.abs(atom.charge), 0);
  const analysis = analyzeMolecule(state.atoms, state.bonds, state.hydrogenBonds);
  const polarityShift = analysis.polarity.estimatedDipole;
  const penalty = valenceStress * 14 + angleStrain * 5 + chargeSeparation * 7 + Math.max(0, polarityShift - 2) * 2;
  const relativeStability = clamp(100 - penalty, 0, 100);
  const notes = [
    valenceStress > 0 ? "Valence stress is present." : "Valence checks are within the local limits.",
    angleStrain > 1.5 ? "Angles are strained relative to VSEPR targets." : "Angles are close to the local VSEPR estimate.",
    chargeSeparation > 0 ? "Formal charge separation affects stability." : "No formal charge separation is currently assigned."
  ];
  return {
    valenceStress: Number(valenceStress.toFixed(2)),
    angleStrain: Number(angleStrain.toFixed(2)),
    chargeSeparation,
    polarityShift: Number(polarityShift.toFixed(2)),
    relativeStability: Number(relativeStability.toFixed(1)),
    notes
  };
}

export function scoreReactionDelta(before: ReactionScore, after: ReactionScore) {
  return Number((after.relativeStability - before.relativeStability).toFixed(1));
}

export function buildReactionSnapshot(state: SimulationState, action?: ReactionAction) {
  const analysis = analyzeMolecule(state.atoms, state.bonds, state.hydrogenBonds);
  const selectedAtom = state.selectedAtomId ? state.atoms.find((atom) => atom.id === state.selectedAtomId) : null;
  const selectedBond = state.selectedBondId ? state.bonds.find((bond) => bond.id === state.selectedBondId) : null;
  return {
    action,
    selectedAtom: selectedAtom ? { id: selectedAtom.id, symbol: selectedAtom.symbol, charge: selectedAtom.charge, bonds: selectedAtom.bonds.length } : null,
    selectedBond: selectedBond ? { id: selectedBond.id, kind: selectedBond.kind, order: selectedBond.order, polarity: selectedBond.polarity } : null,
    analysis,
    score: scoreMolecule(state)
  };
}

function basePreview(action: ReactionAction, scoreBefore: ReactionScore): ReactionPreview {
  return {
    id: `preview-${action.type}-${Date.now()}`,
    action,
    allowed: false,
    message: "",
    explanation: "",
    affectedAtomIds: [],
    affectedBondIds: [],
    ghostBonds: [],
    breakingBondIds: [],
    flowArrows: [],
    warnings: [],
    scoreBefore
  };
}

function blocked(preview: ReactionPreview, message: string, explanation: string): ReactionPreview {
  return { ...preview, allowed: false, message, explanation, warnings: preview.warnings.length ? preview.warnings : [explanation] };
}

function estimateScoreAfterPreview(state: SimulationState, action: ReactionAction, settings: SimulationSettings) {
  const committed = commitPreviewOnly(state, settings, action);
  return committed ? scoreMolecule(committed) : undefined;
}

function commitPreviewOnly(state: SimulationState, settings: SimulationSettings, action: ReactionAction) {
  const result = commitReactionWithoutPreviewLoop(state, settings, action);
  return result;
}

function commitReactionWithoutPreviewLoop(state: SimulationState, settings: SimulationSettings, action: ReactionAction): SimulationState | null {
  let atoms = state.atoms.map((atom) => ({ ...atom, bonds: [...atom.bonds] }));
  let bonds = state.bonds.map((bond) => ({ ...bond }));
  const map = () => new Map(atoms.map((atom) => [atom.id, atom]));
  if (action.type === "form-bond" || action.type === "nucleophile-attack") {
    const [aId, bId] = action.atomIds ?? [];
    const a = aId ? map().get(aId) : null;
    const b = bId ? map().get(bId) : null;
    if (!a || !b) return null;
    bonds.push(createReactionBond(a, b, state.time, settings, action.type === "nucleophile-attack" ? 1 : undefined));
    if (action.type === "nucleophile-attack") {
      atoms = applyNucleophileChargeShift(atoms, bonds, a.id, b.id);
      bonds = relaxAdjacentPiBond(bonds, atoms, b.id);
    }
  } else if (action.type === "break-bond") {
    bonds = bonds.filter((bond) => bond.id !== action.bondId);
  } else if (action.type === "increase-bond-order" || action.type === "decrease-bond-order") {
    bonds = bonds.map((bond) => {
      if (bond.id !== action.bondId) return bond;
      const nextOrder = clamp(bond.order + (action.type === "increase-bond-order" ? 1 : -1), 1, 3) as 1 | 2 | 3;
      return { ...bond, order: nextOrder, length: adjustedBondLength(bond, nextOrder) };
    });
  } else if (action.type === "protonate") {
    const [atomId] = action.atomIds ?? [];
    const target = atomId ? map().get(atomId) : null;
    if (!target) return null;
    const hydrogen = createHydrogenNear(target, atoms.length);
    atoms.push(hydrogen);
    bonds.push(createReactionBond(target, hydrogen, state.time, settings, 1));
    atoms = atoms.map((atom) => atom.id === target.id ? { ...atom, charge: atom.charge + 1 } : atom);
  } else if (action.type === "deprotonate") {
    const target = findDeprotonationTarget({ ...state, atoms, bonds }, action);
    if (!target) return null;
    bonds = bonds.filter((bond) => bond.id !== target.bond.id);
    atoms = atoms.filter((atom) => atom.id !== target.hydrogen.id).map((atom) => atom.id === target.heavy.id ? { ...atom, charge: atom.charge - 1 } : atom);
  }
  atoms = attachBondIds(atoms, bonds);
  return { ...state, atoms, bonds, hydrogenBonds: [] };
}

function createReactionBond(a: AtomParticle, b: AtomParticle, time: number, settings: SimulationSettings, forcedOrder?: 1 | 2 | 3): Bond {
  const kind = classifyReactionBondKind(a, b, settings);
  const atomA = atomData[a.symbol];
  const atomB = atomData[b.symbol];
  const order = (kind === "ionic" || kind === "coordinate") ? 1 : forcedOrder ?? desiredBondOrder(a.symbol, b.symbol);
  const polarity = Math.abs(atomA.electronegativity - atomB.electronegativity);
  const donor = kind === "coordinate" ? ligandDonor(a, b) : null;
  const metal = kind === "coordinate" ? coordinationCenter(a, b) : null;
  return {
    id: `reaction-bond-${a.id}-${b.id}-${Math.round(time * 1000)}-${Date.now()}`,
    a: a.id,
    b: b.id,
    kind,
    order,
    strength: kind === "ionic" ? 0.08 : kind === "coordinate" ? 0.11 : 0.14 + order * 0.04,
    length: Math.max(58, (atomA.covalentRadius + atomB.covalentRadius) * 0.86),
    formedAt: time,
    polarity,
    electronShift: kind === "coordinate" ? metal?.id : atomA.electronegativity === atomB.electronegativity ? undefined : atomA.electronegativity > atomB.electronegativity ? a.id : b.id,
    donorAtomId: donor?.id
  };
}

function classifyReactionBondKind(a: AtomParticle, b: AtomParticle, settings: SimulationSettings): BondKind {
  if (isCoordinationPair(a, b)) return "coordinate";
  return classifyBond(a.symbol, b.symbol, settings.electronegativityEmphasis);
}

function isCoordinationPair(a: AtomParticle, b: AtomParticle) {
  return Boolean(coordinationCenter(a, b) && ligandDonor(a, b));
}

function coordinationCenter(a: AtomParticle, b: AtomParticle) {
  if (isCoordinationCenter(a) && isLigandDonor(b)) return a;
  if (isCoordinationCenter(b) && isLigandDonor(a)) return b;
  return null;
}

function ligandDonor(a: AtomParticle, b: AtomParticle) {
  if (isCoordinationCenter(a) && isLigandDonor(b)) return b;
  if (isCoordinationCenter(b) && isLigandDonor(a)) return a;
  return null;
}

function isCoordinationCenter(atom: AtomParticle) {
  const group = atomData[atom.symbol].group;
  return group === "transition-metals" || group === "lanthanides" || group === "actinides";
}

function isLigandDonor(atom: AtomParticle) {
  return ["N", "O", "S", "P", "F", "Cl", "Br", "I"].includes(atom.symbol);
}

function coordinationCapacityWarnings(a: AtomParticle, b: AtomParticle, bonds: Bond[]) {
  const metal = coordinationCenter(a, b);
  const donor = ligandDonor(a, b);
  if (!metal || !donor) return ["Choose a transition, lanthanide, or actinide metal and a lone-pair donor ligand."];
  const metalCoordination = bonds.filter((bond) => (bond.a === metal.id || bond.b === metal.id) && bond.kind === "coordinate").length;
  const donorBonds = bonds.filter((bond) => bond.a === donor.id || bond.b === donor.id);
  const donorLonePairs = estimateLonePairs(donor, donorBonds);
  const donorOrder = donorBonds.reduce((sum, bond) => sum + (bond.kind === "ionic" || bond.kind === "coordinate" ? 1 : bond.order), 0);
  const warnings: string[] = [];
  if (metalCoordination >= 6) warnings.push(`${labelAtom(metal)} already has six coordinate ligands in this local model.`);
  if (donorLonePairs <= 0 && donor.charge >= 0 && donorOrder >= atomData[donor.symbol].maxBonds) {
    warnings.push(`${labelAtom(donor)} has no clear lone-pair site available for donation.`);
  }
  return warnings;
}

function adjustedBondLength(bond: Bond, nextOrder: 1 | 2 | 3) {
  const orderDelta = nextOrder - bond.order;
  return Math.max(48, bond.length * (1 - orderDelta * 0.08));
}

function attachBondIds(atoms: AtomParticle[], bonds: Bond[]) {
  const ids = new Map<string, string[]>();
  for (const bond of bonds) {
    ids.set(bond.a, [...(ids.get(bond.a) ?? []), bond.id]);
    ids.set(bond.b, [...(ids.get(bond.b) ?? []), bond.id]);
  }
  return atoms.map((atom) => ({ ...atom, bonds: ids.get(atom.id) ?? [] }));
}

function refreshGeometryTargets(atoms: AtomParticle[], bonds: Bond[], settings: SimulationSettings) {
  if (!settings.geometryAssist) return atoms;
  const centered = atoms.map((atom) => ({ ...atom }));
  for (const center of centered) {
    const neighbors = structuralBonds(bonds)
      .filter((bond) => bond.a === center.id || bond.b === center.id)
      .map((bond) => centered.find((atom) => atom.id === (bond.a === center.id ? bond.b : bond.a)))
      .filter((atom): atom is AtomParticle => Boolean(atom));
    if (neighbors.length < 2) continue;
    const geometry = analyzeAtomGeometry(center, centered, bonds);
    if (!geometry || geometry.relaxAngle <= 0) continue;
    neighbors.forEach((neighbor, index) => {
      const angle = -Math.PI / 2 + index * Math.PI * 2 / neighbors.length;
      const bond = bonds.find((item) => samePair(item, center.id, neighbor.id));
      const distance = bond?.length ?? Math.hypot(neighbor.x - center.x, neighbor.y - center.y);
      neighbor.targetX = center.x + Math.cos(angle) * distance;
      neighbor.targetY = center.y + Math.sin(angle) * distance;
      neighbor.targetZ = settings.geometry3D ? (index % 2 ? distance * 0.36 : -distance * 0.26) : 0;
      neighbor.guided = true;
    });
  }
  return centered;
}

function bondCapacityWarnings(a: AtomParticle, b: AtomParticle, bonds: Bond[], order: number) {
  const warnings: string[] = [];
  if (availableBondSlots(a, bonds) < order) warnings.push(`${labelAtom(a)} would exceed its local valence capacity.`);
  if (availableBondSlots(b, bonds) < order) warnings.push(`${labelAtom(b)} would exceed its local valence capacity.`);
  return warnings;
}

function nucleophileCapacityWarnings(nucleophile: AtomParticle, electrophile: AtomParticle, state: SimulationState, order: number) {
  const adjustedBonds = carbonylBondFor(state.bonds, state.atoms, electrophile.id)
    ? state.bonds.map((bond) => bond.id === carbonylBondFor(state.bonds, state.atoms, electrophile.id)?.bond.id ? { ...bond, order: 1 as const } : bond)
    : state.bonds;
  return bondCapacityWarnings(nucleophile, electrophile, adjustedBonds, order);
}

function orderCapacityWarnings(a: AtomParticle, b: AtomParticle, bonds: Bond[], currentBond: Bond) {
  const withoutCurrent = bonds.filter((bond) => bond.id !== currentBond.id);
  return bondCapacityWarnings(a, b, withoutCurrent, currentBond.order + 1);
}

function protonationWarnings(atom: AtomParticle, bonds: Bond[]) {
  if (atom.symbol === "H") return ["Hydrogen is the proton being transferred, not the heavy-atom target."];
  const data = atomData[atom.symbol];
  if (data.nobleGas || data.metal) return [`${data.name} is not a normal protonation target in this local mechanism model.`];
  const localBonds = bonds.filter((bond) => bond.a === atom.id || bond.b === atom.id);
  const lonePairs = estimateLonePairs(atom, localBonds);
  if (lonePairs <= 0 && atom.charge >= 0 && !["N", "O", "S", "P", "F", "Cl", "Br", "I"].includes(atom.symbol)) {
    return [`${data.name} does not have an obvious lone pair or negative charge to accept H+.`];
  }
  return [];
}

function nucleophileWarnings(nucleophile: AtomParticle, electrophile: AtomParticle, state: SimulationState) {
  const warnings: string[] = [];
  const nucBonds = state.bonds.filter((bond) => bond.a === nucleophile.id || bond.b === nucleophile.id);
  const lonePairs = estimateLonePairs(nucleophile, nucBonds);
  if (nucleophile.charge >= 0 && lonePairs <= 0 && !["N", "O", "S", "P", "Cl", "Br", "I"].includes(nucleophile.symbol)) {
    warnings.push(`${labelAtom(nucleophile)} is not electron-rich enough to act as the nucleophile.`);
  }
  const hasElectrophileSignal = electrophile.charge > 0 || carbonylBondFor(state.bonds, state.atoms, electrophile.id) || state.bonds.some((bond) => (bond.a === electrophile.id || bond.b === electrophile.id) && bond.electronShift !== electrophile.id && bond.polarity > 0.55);
  if (!hasElectrophileSignal) warnings.push(`${labelAtom(electrophile)} does not have a clear electron-poor site.`);
  return warnings;
}

function findDeprotonationTarget(state: Pick<SimulationState, "atoms" | "bonds">, action: ReactionAction) {
  const atomById = new Map(state.atoms.map((atom) => [atom.id, atom]));
  const structural = structuralBonds(state.bonds);
  const selectedBond = action.bondId ? structural.find((bond) => bond.id === action.bondId) : null;
  const fromBond = selectedBond ? deprotonationFromBond(selectedBond, atomById) : null;
  if (fromBond) return fromBond;
  const [atomId] = action.atomIds ?? [];
  const heavy = atomId ? atomById.get(atomId) : null;
  if (!heavy || heavy.symbol === "H") return null;
  for (const bond of structural) {
    if (bond.a !== heavy.id && bond.b !== heavy.id) continue;
    const other = atomById.get(bond.a === heavy.id ? bond.b : bond.a);
    if (other?.symbol === "H") return { heavy, hydrogen: other, bond };
  }
  return null;
}

function deprotonationFromBond(bond: Bond, atomById: Map<string, AtomParticle>) {
  const a = atomById.get(bond.a);
  const b = atomById.get(bond.b);
  if (!a || !b) return null;
  if (a.symbol === "H" && b.symbol !== "H") return { heavy: b, hydrogen: a, bond };
  if (b.symbol === "H" && a.symbol !== "H") return { heavy: a, hydrogen: b, bond };
  return null;
}

function createHydrogenNear(target: AtomParticle, index: number): AtomParticle {
  const angle = -Math.PI / 2 + index * 0.92;
  return {
    id: `H-reaction-${Date.now()}-${index}`,
    symbol: "H",
    x: target.x + Math.cos(angle) * 74,
    y: target.y + Math.sin(angle) * 74,
    z: (target.z ?? 0) + 8,
    vx: 0,
    vy: 0,
    vz: 0,
    radius: Math.max(18, atomData.H.covalentRadius * 0.55),
    charge: 0,
    bonds: [],
    guided: true,
    targetX: target.x + Math.cos(angle) * 74,
    targetY: target.y + Math.sin(angle) * 74,
    targetZ: (target.z ?? 0) + 8
  };
}

function applyNucleophileChargeShift(atoms: AtomParticle[], bonds: Bond[], nucleophileId: string, electrophileId: string) {
  const carbonyl = carbonylBondFor(bonds, atoms, electrophileId);
  return atoms.map((atom) => {
    if (atom.id === nucleophileId && atom.charge < 0) return { ...atom, charge: atom.charge + 1 };
    if (carbonyl && atom.id === carbonyl.heteroId) return { ...atom, charge: atom.charge - 1 };
    return atom;
  });
}

function relaxAdjacentPiBond(bonds: Bond[], atoms: AtomParticle[], electrophileId: string) {
  const carbonyl = carbonylBondFor(bonds, atoms, electrophileId);
  if (!carbonyl) return bonds;
  return bonds.map((bond) => bond.id === carbonyl.bond.id ? { ...bond, order: 1 as const, strength: 0.18 } : bond);
}

function carbonylBondFor(bonds: Bond[], atoms: AtomParticle[], atomId: string) {
  const atomById = new Map(atoms.map((atom) => [atom.id, atom]));
  for (const bond of structuralBonds(bonds)) {
    if (bond.order !== 2 || (bond.a !== atomId && bond.b !== atomId)) continue;
    const otherId = bond.a === atomId ? bond.b : bond.a;
    const other = atomById.get(otherId);
    const center = atomById.get(atomId);
    if (center?.symbol === "C" && other && ["O", "N", "S"].includes(other.symbol)) {
      return { bond, heteroId: other.id };
    }
  }
  return null;
}

function reactionEvent(preview: ReactionPreview, time: number) {
  return {
    id: `reaction-event-${Date.now()}`,
    time,
    title: reactionTitle(preview.action.type),
    plain: preview.message,
    science: preview.explanation,
    bondId: preview.affectedBondIds[0]
  };
}

function reactionTitle(type: ReactionAction["type"]) {
  const labels: Record<ReactionAction["type"], string> = {
    "form-bond": "Bond formed",
    "break-bond": "Bond broken",
    "increase-bond-order": "Bond order increased",
    "decrease-bond-order": "Bond order decreased",
    protonate: "Protonation step",
    deprotonate: "Deprotonation step",
    "nucleophile-attack": "Nucleophile attack"
  };
  return labels[type];
}

function formulaFromAtoms(atoms: AtomParticle[]) {
  const counts = atoms.reduce<Record<string, number>>((acc, atom) => {
    acc[atom.symbol] = (acc[atom.symbol] ?? 0) + 1;
    return acc;
  }, {});
  const symbols = Object.keys(counts).sort((a, b) => {
    if (counts.C) {
      if (a === "C") return -1;
      if (b === "C") return 1;
      if (a === "H") return -1;
      if (b === "H") return 1;
    }
    return a.localeCompare(b);
  });
  return symbols.map((symbol) => `${symbol}${counts[symbol] > 1 ? counts[symbol] : ""}`).join("");
}

function angleBetween(center: AtomParticle, a: AtomParticle, b: AtomParticle) {
  const ax = a.x - center.x;
  const ay = a.y - center.y;
  const bx = b.x - center.x;
  const by = b.y - center.y;
  const dot = ax * bx + ay * by;
  const len = Math.max(0.001, Math.hypot(ax, ay) * Math.hypot(bx, by));
  return Math.acos(clamp(dot / len, -1, 1)) * 180 / Math.PI;
}

function samePair(bond: Bond, a: string, b: string) {
  return (bond.a === a && bond.b === b) || (bond.a === b && bond.b === a);
}

function labelAtom(atom: AtomParticle) {
  return `${atomData[atom.symbol].name} (${atom.symbol})`;
}
