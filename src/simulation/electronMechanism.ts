import { atomData } from "../data/atoms";
import type {
  AtomParticle,
  Bond,
  ElectronSource,
  ElectronTarget,
  MechanismGesture,
  ReactionAction,
  ReactionAtomDelta,
  ReactionBondDelta,
  ReactionHistoryEntry,
  ReactionPreview,
  ReactionStep,
  SimulationSettings,
  SimulationState
} from "../types";
import { availableBondSlots } from "./chemistry";
import { structuralBonds } from "./graph";
import { commitReaction, previewReaction, scoreMolecule, scoreReactionDelta } from "./reactions";
import { analyzeAtomGeometry, estimateLonePairs } from "./vsepr";

type CommitMechanismResult = {
  state: SimulationState;
  step: ReactionStep;
  preview: ReactionPreview;
  historyEntry: ReactionHistoryEntry;
};

const unique = <T,>(items: T[]) => [...new Set(items)];

export function deriveElectronSources(state: SimulationState): ElectronSource[] {
  const bonds = structuralBonds(state.bonds);
  const atomById = new Map(state.atoms.map((atom) => [atom.id, atom]));
  const sources: ElectronSource[] = [];

  for (const atom of state.atoms) {
    const localBonds = bonds.filter((bond) => bond.a === atom.id || bond.b === atom.id);
    const lonePairs = estimateLonePairs(atom, localBonds);
    if (lonePairs > 0) {
      const point = openSitePoint(atom, localBonds, atomById, atom.radius + 30);
      sources.push({
        id: `lp:${atom.id}`,
        kind: "lone-pair",
        label: `${atom.symbol} lone pair`,
        description: `${atomData[atom.symbol].name} has ${lonePairs} selectable lone-pair region${lonePairs === 1 ? "" : "s"}.`,
        atomIds: [atom.id],
        ownerAtomId: atom.id,
        electronCount: lonePairs * 2,
        x: point.x,
        y: point.y,
        z: atom.z,
        selectable: true,
        strength: atom.charge < 0 ? 1 : 0.74
      });
    }

    if (atom.charge < 0) {
      const point = openSitePoint(atom, localBonds, atomById, atom.radius + 44);
      sources.push({
        id: `charge:${atom.id}`,
        kind: "formal-charge",
        label: `${atom.symbol}- charge`,
        description: `The negative formal charge marks this atom as electron-rich.`,
        atomIds: [atom.id],
        ownerAtomId: atom.id,
        electronCount: 2,
        x: point.x,
        y: point.y,
        z: atom.z,
        selectable: true,
        strength: 1
      });
    }

    if (hasConjugationSignal(atom, bonds)) {
      const point = openSitePoint(atom, localBonds, atomById, atom.radius + 56);
      sources.push({
        id: `conj:${atom.id}`,
        kind: "conjugated-region",
        label: `${atom.symbol} conjugation`,
        description: `Adjacent pi or lone-pair regions can shift electron density through this atom.`,
        atomIds: [atom.id],
        ownerAtomId: atom.id,
        electronCount: 2,
        x: point.x,
        y: point.y,
        z: atom.z,
        selectable: true,
        strength: 0.68
      });
    }
  }

  for (const bond of bonds) {
    const a = atomById.get(bond.a);
    const b = atomById.get(bond.b);
    if (!a || !b) continue;
    const midpoint = bondMidpoint(a, b);
    sources.push({
      id: `sigma:${bond.id}`,
      kind: "sigma-bond",
      label: `${a.symbol}-${b.symbol} sigma`,
      description: `The sigma bonding pair can be moved to preview bond breaking or redistribution.`,
      atomIds: [a.id, b.id],
      bondId: bond.id,
      electronCount: 2,
      x: midpoint.x,
      y: midpoint.y,
      z: midpoint.z,
      selectable: true,
      strength: 0.52
    });

    if (bond.order >= 2) {
      const normal = bondNormal(a, b, 15);
      sources.push({
        id: `pi:${bond.id}`,
        kind: "pi-bond",
        label: `${a.symbol}-${b.symbol} pi`,
        description: `The pi pair can move into an adjacent atom or downshift the bond order.`,
        atomIds: [a.id, b.id],
        bondId: bond.id,
        electronCount: 2,
        x: midpoint.x + normal.x,
        y: midpoint.y + normal.y,
        z: midpoint.z,
        selectable: true,
        strength: 0.86
      });
    }
  }

  return sources;
}

export function deriveElectronTargets(state: SimulationState): ElectronTarget[] {
  const bonds = structuralBonds(state.bonds);
  const atomById = new Map(state.atoms.map((atom) => [atom.id, atom]));
  const targets: ElectronTarget[] = [];

  for (const atom of state.atoms) {
    const localBonds = bonds.filter((bond) => bond.a === atom.id || bond.b === atom.id);
    const acceptsElectrons = atom.charge > 0 || availableBondSlots(atom, bonds) > 0 || hasElectrophileSignal(atom, bonds) || isCoordinationCenter(atom);
    targets.push({
      id: `atom:${atom.id}`,
      kind: "atom",
      label: `${atom.symbol} atom`,
      description: acceptsElectrons
        ? `${atomData[atom.symbol].name} can be tested as an electron target${isCoordinationCenter(atom) ? " or coordination center" : ""}.`
        : `${atomData[atom.symbol].name} has no obvious open local valence site.`,
      atomId: atom.id,
      x: atom.x,
      y: atom.y,
      z: atom.z,
      acceptsElectrons,
      priority: acceptsElectrons ? 0.82 : 0.18
    });

    if (atom.symbol === "H" && localBonds.some((bond) => {
      const other = atomById.get(bond.a === atom.id ? bond.b : bond.a);
      return other && other.symbol !== "H";
    })) {
      targets.push({
        id: `proton:${atom.id}`,
        kind: "proton",
        label: "H+ site",
        description: "A bonded hydrogen can be treated as a proton-transfer site.",
        atomId: atom.id,
        x: atom.x,
        y: atom.y,
        z: atom.z,
        acceptsElectrons: true,
        priority: 0.92
      });
    }
  }

  for (const bond of bonds) {
    const a = atomById.get(bond.a);
    const b = atomById.get(bond.b);
    if (!a || !b) continue;
    const midpoint = bondMidpoint(a, b);
    targets.push({
      id: `bond:${bond.id}`,
      kind: "bond",
      label: `${a.symbol}-${b.symbol} bond`,
      description: `Target this bond to preview bond-order or breaking movement.`,
      bondId: bond.id,
      x: midpoint.x,
      y: midpoint.y,
      z: midpoint.z,
      acceptsElectrons: true,
      priority: bond.order >= 2 ? 0.86 : 0.56
    });
  }

  return targets;
}

export function previewMechanism(state: SimulationState, settings: SimulationSettings, gesture: MechanismGesture): ReactionPreview {
  const sources = deriveElectronSources(state);
  const targets = deriveElectronTargets(state);
  const source = sources.find((item) => item.id === gesture.sourceId);
  const target = targets.find((item) => item.id === gesture.targetId);
  if (!source || !target) {
    return enrichPreview(blockedMechanismPreview(state, settings, gesture, "Choose a visible electron source and target.", "The engine needs a source handle and a target handle before it can preview movement."), state, settings, gesture, sources, targets);
  }

  const action = gestureToReactionAction(state, source, target, gesture.actionHint);
  if (!action) {
    return enrichPreview(blockedMechanismPreview(state, settings, gesture, "That electron move is not supported yet.", `${source.label} cannot be routed to ${target.label} by the local mechanism rules.`), state, settings, gesture, sources, targets, source, target);
  }

  const preview = previewReaction(state, settings, action);
  const sourceLabel = source.kind === "lone-pair" ? "lone pair" : source.kind.replace("-", " ");
  const targetLabel = target.kind === "proton" ? "proton site" : target.label;
  const explanation = `${sourceLabel} movement: ${source.label} -> ${targetLabel}. ${preview.explanation}`;
  return enrichPreview({ ...preview, mechanism: gesture, explanation }, state, settings, gesture, sources, targets, source, target);
}

export function commitMechanism(state: SimulationState, settings: SimulationSettings, gesture: MechanismGesture): CommitMechanismResult | null {
  const preview = previewMechanism(state, settings, gesture);
  if (!preview.allowed) return null;
  const result = commitReaction(state, settings, preview.action);
  if (!result) return null;
  const enrichedPreview = enrichPreview({ ...result.preview, mechanism: gesture }, state, settings, gesture, deriveElectronSources(state), deriveElectronTargets(state));
  const deltas = reactionDeltas(state, result.state);
  const step: ReactionStep = {
    ...result.step,
    mechanism: gesture,
    formalChargeDeltas: deltas.formalChargeDeltas,
    bondOrderDeltas: deltas.bondOrderDeltas,
    hybridizationDeltas: deltas.hybridizationDeltas,
    stabilityReasons: stabilityReasonsForChange(state, result.state)
  };
  const historyEntry: ReactionHistoryEntry = {
    id: `reaction-history-${Date.now()}`,
    step,
    before: cloneState(state),
    after: cloneState(result.state)
  };
  return {
    state: result.state,
    step,
    preview: {
      ...enrichedPreview,
      scoreAfter: result.preview.scoreAfter,
      formalChargeDeltas: step.formalChargeDeltas,
      bondOrderDeltas: step.bondOrderDeltas,
      hybridizationDeltas: step.hybridizationDeltas,
      stabilityReasons: step.stabilityReasons
    },
    historyEntry
  };
}

export function previewDirectReaction(state: SimulationState, settings: SimulationSettings, action: ReactionAction): ReactionPreview {
  return enrichPreview(previewReaction(state, settings, action), state, settings, undefined, deriveElectronSources(state), deriveElectronTargets(state));
}

export function commitDirectReaction(state: SimulationState, settings: SimulationSettings, action: ReactionAction): CommitMechanismResult | null {
  const result = commitReaction(state, settings, action);
  if (!result) return null;
  const deltas = reactionDeltas(state, result.state);
  const step: ReactionStep = {
    ...result.step,
    formalChargeDeltas: deltas.formalChargeDeltas,
    bondOrderDeltas: deltas.bondOrderDeltas,
    hybridizationDeltas: deltas.hybridizationDeltas,
    stabilityReasons: stabilityReasonsForChange(state, result.state)
  };
  const historyEntry: ReactionHistoryEntry = {
    id: `reaction-history-${Date.now()}`,
    step,
    before: cloneState(state),
    after: cloneState(result.state)
  };
  return {
    state: result.state,
    step,
    preview: enrichPreview({ ...result.preview, formalChargeDeltas: step.formalChargeDeltas, bondOrderDeltas: step.bondOrderDeltas, hybridizationDeltas: step.hybridizationDeltas, stabilityReasons: step.stabilityReasons }, state, settings),
    historyEntry
  };
}

export function gestureToReactionAction(state: SimulationState, source: ElectronSource, target: ElectronTarget, actionHint?: ReactionAction["type"]): ReactionAction | null {
  if (actionHint) {
    if (actionHint === "form-bond" || actionHint === "nucleophile-attack") {
      const sourceAtomId = source.ownerAtomId ?? source.atomIds[0];
      const targetAtomId = target.atomId ?? electrophileAtomForBondTarget(state, target.bondId);
      return sourceAtomId && targetAtomId && sourceAtomId !== targetAtomId ? { type: actionHint, atomIds: [sourceAtomId, targetAtomId] } : null;
    }
    if (actionHint === "protonate") {
      const atomId = source.ownerAtomId ?? source.atomIds[0] ?? target.atomId;
      return atomId ? { type: "protonate", atomIds: [atomId] } : null;
    }
    if (actionHint === "deprotonate") return { type: "deprotonate", bondId: target.bondId, atomIds: target.atomId ? [target.atomId] : source.ownerAtomId ? [source.ownerAtomId] : undefined };
    return target.bondId ? { type: actionHint, bondId: target.bondId } : null;
  }

  if (target.kind === "proton") {
    const sourceAtomId = source.ownerAtomId ?? source.atomIds[0];
    return sourceAtomId ? { type: "protonate", atomIds: [sourceAtomId] } : null;
  }

  if (target.kind === "bond" || target.kind === "antibond") {
    if (!target.bondId) return null;
    if (source.bondId === target.bondId) {
      return source.kind === "pi-bond" ? { type: "decrease-bond-order", bondId: target.bondId } : { type: "break-bond", bondId: target.bondId };
    }
    const targetAtomId = electrophileAtomForBondTarget(state, target.bondId);
    const sourceAtomId = source.ownerAtomId ?? source.atomIds[0];
    if (sourceAtomId && targetAtomId && sourceAtomId !== targetAtomId) return { type: "nucleophile-attack", atomIds: [sourceAtomId, targetAtomId] };
    return { type: "decrease-bond-order", bondId: target.bondId };
  }

  if (target.kind === "atom" && target.atomId) {
    const targetAtomId = target.atomId;
    const sourceAtomId = source.ownerAtomId ?? source.atomIds[0];
    if (!sourceAtomId || sourceAtomId === targetAtomId) return null;
    const existing = structuralBonds(state.bonds).find((bond) => samePair(bond, sourceAtomId, targetAtomId));
    if (existing) return source.kind === "pi-bond" ? { type: "increase-bond-order", bondId: existing.id } : null;
    return source.kind === "lone-pair" || source.kind === "formal-charge" || source.kind === "conjugated-region"
      ? { type: "nucleophile-attack", atomIds: [sourceAtomId, targetAtomId] }
      : { type: "form-bond", atomIds: [sourceAtomId, targetAtomId] };
  }

  return null;
}

export function nextBondOrderAction(bond: Bond, requestedOrder: 1 | 2 | 3): ReactionAction | null {
  if (requestedOrder === bond.order) return null;
  return { type: requestedOrder > bond.order ? "increase-bond-order" : "decrease-bond-order", bondId: bond.id };
}

export function cloneState(state: SimulationState): SimulationState {
  return {
    ...state,
    atoms: state.atoms.map((atom) => ({ ...atom, bonds: [...atom.bonds] })),
    bonds: state.bonds.map((bond) => ({ ...bond })),
    hydrogenBonds: state.hydrogenBonds.map((bond) => ({ ...bond })),
    effects: state.effects.map((effect) => ({ ...effect })),
    metallicElectrons: state.metallicElectrons.map((electron) => ({ ...electron })),
    events: state.events.map((event) => ({ ...event })),
    nuclearEvents: (state.nuclearEvents ?? []).map((event) => ({ ...event }))
  };
}

export function reactionDeltas(before: SimulationState, after: SimulationState) {
  const beforeAtoms = new Map(before.atoms.map((atom) => [atom.id, atom]));
  const afterAtoms = new Map(after.atoms.map((atom) => [atom.id, atom]));
  const beforeBonds = new Map(before.bonds.map((bond) => [bond.id, bond]));
  const afterBonds = new Map(after.bonds.map((bond) => [bond.id, bond]));

  const formalChargeDeltas: ReactionAtomDelta[] = [];
  for (const [atomId, atom] of beforeAtoms) {
    const next = afterAtoms.get(atomId);
    if (next && next.charge !== atom.charge) formalChargeDeltas.push({ atomId, before: chargeLabel(atom.charge), after: chargeLabel(next.charge), label: "formal charge" });
  }
  for (const [atomId, atom] of afterAtoms) {
    if (!beforeAtoms.has(atomId) && atom.charge !== 0) formalChargeDeltas.push({ atomId, before: "new", after: chargeLabel(atom.charge), label: "formal charge" });
  }

  const bondOrderDeltas: ReactionBondDelta[] = [];
  for (const [bondId, bond] of beforeBonds) {
    const next = afterBonds.get(bondId);
    if (!next) bondOrderDeltas.push({ bondId, before: bond.order, after: "broken", label: "bond order" });
    else if (next.order !== bond.order) bondOrderDeltas.push({ bondId, before: bond.order, after: next.order, label: "bond order" });
  }
  for (const [bondId, bond] of afterBonds) {
    if (!beforeBonds.has(bondId)) bondOrderDeltas.push({ bondId, before: "new", after: bond.order, label: "bond order" });
  }

  const hybridizationDeltas: ReactionAtomDelta[] = [];
  for (const atomId of unique([...before.atoms.map((atom) => atom.id), ...after.atoms.map((atom) => atom.id)])) {
    const beforeLabel = hybridizationForAtom(atomId, before);
    const afterLabel = hybridizationForAtom(atomId, after);
    if (beforeLabel !== afterLabel) hybridizationDeltas.push({ atomId, before: beforeLabel, after: afterLabel, label: "hybridization" });
  }

  return { formalChargeDeltas, bondOrderDeltas, hybridizationDeltas };
}

export function stabilityReasonsForChange(before: SimulationState, after: SimulationState) {
  const beforeScore = scoreMolecule(before);
  const afterScore = scoreMolecule(after);
  const delta = scoreReactionDelta(beforeScore, afterScore);
  const affected = unique([...before.atoms, ...after.atoms].map((atom) => atom.id)).slice(0, 8);
  const reasons = [
    delta >= 0 ? `Relative stability improves by ${delta.toFixed(1)} in the local model.` : `Relative stability drops by ${Math.abs(delta).toFixed(1)} in the local model.`,
    ...afterScore.notes,
    ...affected.flatMap((atomId) => octetReasonsForAtom(atomId, after)).slice(0, 5)
  ];
  return unique(reasons).slice(0, 8);
}

function enrichPreview(
  preview: ReactionPreview,
  state: SimulationState,
  settings: SimulationSettings,
  gesture?: MechanismGesture,
  sources = deriveElectronSources(state),
  targets = deriveElectronTargets(state),
  source?: ElectronSource,
  target?: ElectronTarget
): ReactionPreview {
  const result = preview.allowed ? commitReaction(state, settings, preview.action) : null;
  const deltas = result ? reactionDeltas(state, result.state) : { formalChargeDeltas: [], bondOrderDeltas: [], hybridizationDeltas: [] };
  const stabilityReasons = result ? stabilityReasonsForChange(state, result.state) : preview.warnings;
  return {
    ...preview,
    mechanism: gesture ?? preview.mechanism,
    electronSources: sources,
    electronTargets: targets,
    formalChargeDeltas: deltas.formalChargeDeltas,
    bondOrderDeltas: deltas.bondOrderDeltas,
    hybridizationDeltas: deltas.hybridizationDeltas,
    stabilityReasons,
    confirmRequired: true,
    affectedAtomIds: unique([...preview.affectedAtomIds, ...(source?.atomIds ?? []), ...(target?.atomId ? [target.atomId] : [])]),
    affectedBondIds: unique([...preview.affectedBondIds, ...(source?.bondId ? [source.bondId] : []), ...(target?.bondId ? [target.bondId] : [])])
  };
}

function blockedMechanismPreview(state: SimulationState, settings: SimulationSettings, gesture: MechanismGesture, message: string, explanation: string): ReactionPreview {
  return {
    id: `mechanism-blocked-${Date.now()}`,
    action: { type: "form-bond", atomIds: [] },
    mechanism: gesture,
    allowed: false,
    message,
    explanation,
    affectedAtomIds: [],
    affectedBondIds: [],
    ghostBonds: [],
    breakingBondIds: [],
    flowArrows: [],
    warnings: [explanation],
    scoreBefore: previewReaction(state, settings, { type: "form-bond", atomIds: [] }).scoreBefore
  };
}

function openSitePoint(atom: AtomParticle, localBonds: Bond[], atomById: Map<string, AtomParticle>, distance: number) {
  const neighbors = localBonds
    .map((bond) => atomById.get(bond.a === atom.id ? bond.b : bond.a))
    .filter((item): item is AtomParticle => Boolean(item));
  const angle = neighbors.length
    ? Math.atan2(atom.y - average(neighbors.map((item) => item.y)), atom.x - average(neighbors.map((item) => item.x)))
    : -Math.PI / 2;
  return {
    x: atom.x + Math.cos(angle) * distance,
    y: atom.y + Math.sin(angle) * distance
  };
}

function bondMidpoint(a: AtomParticle, b: AtomParticle) {
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
    z: ((a.z ?? 0) + (b.z ?? 0)) / 2
  };
}

function bondNormal(a: AtomParticle, b: AtomParticle, distance: number) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const length = Math.max(1, Math.hypot(dx, dy));
  return { x: -dy / length * distance, y: dx / length * distance };
}

function hasConjugationSignal(atom: AtomParticle, bonds: Bond[]) {
  const local = bonds.filter((bond) => bond.a === atom.id || bond.b === atom.id);
  return local.filter((bond) => bond.order >= 2).length >= 2 || (atom.charge !== 0 && local.some((bond) => bond.order >= 2));
}

function hasElectrophileSignal(atom: AtomParticle, bonds: Bond[]) {
  if (atom.charge > 0) return true;
  return bonds.some((bond) => (bond.a === atom.id || bond.b === atom.id) && bond.polarity > 0.55 && bond.electronShift !== atom.id);
}

function isCoordinationCenter(atom: AtomParticle) {
  const group = atomData[atom.symbol].group;
  return group === "transition-metals" || group === "lanthanides" || group === "actinides";
}

function electrophileAtomForBondTarget(state: SimulationState, bondId?: string) {
  if (!bondId) return null;
  const bond = structuralBonds(state.bonds).find((item) => item.id === bondId);
  if (!bond) return null;
  if (bond.electronShift === bond.a) return bond.b;
  if (bond.electronShift === bond.b) return bond.a;
  const a = state.atoms.find((atom) => atom.id === bond.a);
  const b = state.atoms.find((atom) => atom.id === bond.b);
  if (a?.charge && a.charge > 0) return a.id;
  if (b?.charge && b.charge > 0) return b.id;
  return bond.a;
}

function hybridizationForAtom(atomId: string, state: SimulationState) {
  const atom = state.atoms.find((item) => item.id === atomId);
  if (!atom) return "removed";
  const geometry = analyzeAtomGeometry(atom, state.atoms, state.bonds);
  if (!geometry) return "unbound";
  const labels: Record<number, string> = {
    1: "s",
    2: "sp",
    3: "sp2",
    4: "sp3",
    5: "sp3d",
    6: "sp3d2"
  };
  return labels[geometry.electronDomains] ?? `${geometry.electronDomains} domains`;
}

function octetReasonsForAtom(atomId: string, state: SimulationState) {
  const atom = state.atoms.find((item) => item.id === atomId);
  if (!atom) return [];
  const bonds = structuralBonds(state.bonds).filter((bond) => bond.a === atom.id || bond.b === atom.id);
  const bondOrder = bonds.reduce((sum, bond) => sum + (bond.kind === "ionic" ? 1 : bond.order), 0);
  if (atom.symbol === "H") return [bondOrder <= 1 ? "Hydrogen follows a duet target with one bond." : "Hydrogen is over-bonded relative to the duet rule."];
  const lonePairs = estimateLonePairs(atom, bonds);
  const electronsAround = bondOrder * 2 + lonePairs * 2;
  const data = atomData[atom.symbol];
  if (bondOrder > data.maxBonds) return [`${data.name} exceeds the local valence capacity (${bondOrder}/${data.maxBonds}).`];
  if (electronsAround >= 8) return [`${data.name} has an octet-like local electron count.`];
  return [`${data.name} has ${electronsAround} local valence electrons in this simplified model.`];
}

function chargeLabel(charge: number) {
  if (charge === 0) return "0";
  return charge > 0 ? `+${charge}` : `${charge}`;
}

function average(values: number[]) {
  return values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length);
}

function samePair(bond: Bond, a: string, b: string) {
  return (bond.a === a && bond.b === b) || (bond.a === b && bond.b === a);
}
