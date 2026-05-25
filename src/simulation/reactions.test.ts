import { describe, expect, it } from "vitest";
import { presetById } from "../data/presets";
import { defaultSettings } from "../hooks/useSimulation";
import type { SimulationState } from "../types";
import { createAtom, createFreeState, createPresetState, stepSimulation } from "./engine";
import { planReactionTimeJump } from "./reactionHistory";
import { reactionFamilies } from "./reactionRegistry";
import { commitReaction, previewReaction, scoreMolecule } from "./reactions";
import { formatSimulationTime } from "../utils/timeFormat";
import type { ReactionHistoryEntry, ReactionStep } from "../types";

const settings = { ...defaultSettings, geometryAssist: true, electronegativityEmphasis: 1 };

describe("reaction mechanism core", () => {
  it("previews and commits water protonation and deprotonation", () => {
    const water = createPresetState(900, 600, presetById.h2o);
    const oxygen = water.atoms.find((atom) => atom.symbol === "O");
    expect(oxygen).toBeTruthy();

    const protonation = previewReaction(water, settings, { type: "protonate", atomIds: [oxygen!.id] });
    expect(protonation.allowed).toBe(true);

    const hydronium = commitReaction(water, settings, { type: "protonate", atomIds: [oxygen!.id] });
    expect(hydronium).toBeTruthy();
    expect(hydronium!.step.beforeFormula).toBe("H2O");
    expect(hydronium!.step.afterFormula).toBe("H3O");
    expect(hydronium!.state.atoms.find((atom) => atom.id === oxygen!.id)?.charge).toBe(1);

    const deprotonated = commitReaction(hydronium!.state, settings, { type: "deprotonate", atomIds: [oxygen!.id] });
    expect(deprotonated).toBeTruthy();
    expect(deprotonated!.step.afterFormula).toBe("H2O");
    expect(deprotonated!.state.atoms.find((atom) => atom.id === oxygen!.id)?.charge).toBe(0);
  });

  it("blocks duplicate bond formation with a stable explanation", () => {
    const water = createPresetState(900, 600, presetById.h2o);
    const bond = water.bonds[0];
    const preview = previewReaction(water, settings, { type: "form-bond", atomIds: [bond.a, bond.b] });
    expect(preview.allowed).toBe(false);
    expect(preview.message).toMatch(/already bonded/i);
  });

  it("updates bond order, length, and reaction score signals", () => {
    const carbonDioxide = createPresetState(900, 600, presetById.co2);
    const doubleBond = carbonDioxide.bonds.find((bond) => bond.order === 2);
    expect(doubleBond).toBeTruthy();
    const beforeScore = scoreMolecule(carbonDioxide);

    const decreased = commitReaction(carbonDioxide, settings, { type: "decrease-bond-order", bondId: doubleBond!.id });
    expect(decreased).toBeTruthy();
    const changedBond = decreased!.state.bonds.find((bond) => bond.id === doubleBond!.id);
    expect(changedBond?.order).toBe(1);
    expect(changedBond!.length).toBeGreaterThan(doubleBond!.length);
    expect(decreased!.step.scoreDelta).toBeCloseTo(decreased!.preview.scoreAfter!.relativeStability - beforeScore.relativeStability, 5);
  });

  it("allows carbonyl nucleophile attack by relaxing the pi bond into an intermediate", () => {
    const formaldehyde = createPresetState(900, 600, presetById.formaldehyde);
    const carbonyl = formaldehyde.bonds.find((bond) => bond.order === 2);
    expect(carbonyl).toBeTruthy();
    const carbon = formaldehyde.atoms.find((atom) => (atom.id === carbonyl!.a || atom.id === carbonyl!.b) && atom.symbol === "C");
    expect(carbon).toBeTruthy();
    const nucleophile = { ...createAtom("O", carbon!.x - 140, carbon!.y, true), id: "test-nucleophile-oxygen", charge: -1, vx: 0, vy: 0 };
    const state: SimulationState = { ...formaldehyde, atoms: [...formaldehyde.atoms, nucleophile] };

    const preview = previewReaction(state, settings, { type: "nucleophile-attack", atomIds: [nucleophile.id, carbon!.id] });
    expect(preview.allowed).toBe(true);

    const attacked = commitReaction(state, settings, { type: "nucleophile-attack", atomIds: [nucleophile.id, carbon!.id] });
    expect(attacked).toBeTruthy();
    expect(attacked!.state.bonds.some((bond) => bond.a === nucleophile.id || bond.b === nucleophile.id)).toBe(true);
    expect(attacked!.state.bonds.find((bond) => bond.id === carbonyl!.id)?.order).toBe(1);
  });

  it("registers Expansion 6-8 domains with implemented v1 subsets and staged blockers", () => {
    const byExpansion = new Map<string, typeof reactionFamilies>();
    for (const family of reactionFamilies) {
      byExpansion.set(family.expansion, [...(byExpansion.get(family.expansion) ?? []), family]);
    }

    expect(byExpansion.get("biochemistry")?.map((family) => family.id)).toEqual(expect.arrayContaining([
      "peptide-bond-formation",
      "peptide-hydrolysis",
      "glycosidic-bond-formation",
      "phosphorylation",
      "dephosphorylation",
      "dna-base-pairing"
    ]));
    expect(byExpansion.get("inorganic-coordination")?.map((family) => family.id)).toEqual(expect.arrayContaining([
      "coordination-complex-formation",
      "ligand-substitution",
      "chelation",
      "complex-dissociation",
      "ionization"
    ]));
    expect(byExpansion.get("electrochem-energy")?.map((family) => family.id)).toEqual(expect.arrayContaining([
      "redox-reaction",
      "proton-coupled-electron-transfer"
    ]));
    expect(reactionFamilies.find((family) => family.id === "combustion")?.blockedReason).toMatch(/stoichiometry/i);
  });

  it("previews and commits a coordinate metal-ligand bond distinctly from ionic/covalent bonds", () => {
    const iron = { ...createAtom("Fe", 360, 300, true), id: "test-iron", vx: 0, vy: 0 };
    const ammoniaLikeNitrogen = { ...createAtom("N", 500, 300, true), id: "test-ligand-n", vx: 0, vy: 0 };
    const state: SimulationState = {
      ...createFreeState(900, 600, settings),
      atoms: [iron, ammoniaLikeNitrogen],
      selectedAtomId: iron.id
    };

    const preview = previewReaction(state, settings, { type: "form-bond", atomIds: [ammoniaLikeNitrogen.id, iron.id] });
    expect(preview.allowed).toBe(true);
    expect(preview.message).toMatch(/coordination/i);
    expect(preview.flowArrows[0]?.label).toMatch(/lone pair/i);

    const committed = commitReaction(state, settings, { type: "form-bond", atomIds: [ammoniaLikeNitrogen.id, iron.id] });
    expect(committed).toBeTruthy();
    expect(committed!.state.bonds[0]?.kind).toBe("coordinate");
    expect(committed!.state.bonds[0]?.donorAtomId).toBe(ammoniaLikeNitrogen.id);
  });

  it("advances scientific time with the global multiplier while keeping bounded visual stepping", () => {
    const base = createFreeState(900, 600, { ...settings, timeMultiplier: 1 });
    const normal = stepSimulation(base, { ...settings, timeMultiplier: 1 }, 900, 600, 0.016);
    const accelerated = stepSimulation(base, { ...settings, timeMultiplier: 1000 }, 900, 600, 0.016);
    const clamped = stepSimulation(base, { ...settings, timeMultiplier: 5000 }, 900, 600, 0.016);

    expect(normal.time).toBeCloseTo(0.016, 5);
    expect(accelerated.time).toBeCloseTo(16, 5);
    expect(clamped.time).toBeCloseTo(16, 5);
  });

  it("formats scaled simulation time in every display mode", () => {
    expect(formatSimulationTime(0, "clock")).toBe("00:00:00.000");
    expect(formatSimulationTime(3661.234, "clock")).toBe("01:01:01.234");
    expect(formatSimulationTime(3661.234, "labeled")).toBe("1 h 01 m 01 s 234 ms");
    expect(formatSimulationTime(1.2345, "seconds")).toBe("1.234 s");
    expect(formatSimulationTime(1.2345, "milliseconds")).toBe("1235 ms");
    expect(formatSimulationTime(1234, "scientific")).toBe("1.234e+3 s");
  });

  it("stores committed reaction steps at scaled simulation time", () => {
    const water = createPresetState(900, 600, presetById.h2o);
    const oxygen = water.atoms.find((atom) => atom.symbol === "O");
    const timedWater = { ...water, time: 42.5 };
    const result = commitReaction(timedWater, settings, { type: "protonate", atomIds: [oxygen!.id] });
    expect(result?.step.simTime).toBe(42.5);
    expect(result?.step.timestamp).not.toBe(42.5);
  });

  it("plans reaction time jumps by restoring snapshots and preserving redo history", () => {
    const base = createPresetState(900, 600, presetById.h2o);
    const firstState = { ...base, time: 4 };
    const secondState = { ...base, time: 8 };
    const step1 = testStep("step-1", 4);
    const step2 = testStep("step-2", 8);
    const entry1: ReactionHistoryEntry = { id: "history-1", step: step1, before: base, after: firstState };
    const entry2: ReactionHistoryEntry = { id: "history-2", step: step2, before: firstState, after: secondState };

    const jumpToFirst = planReactionTimeJump([entry2, entry1], [], "history-1");
    expect(jumpToFirst?.past.map((entry) => entry.id)).toEqual(["history-1"]);
    expect(jumpToFirst?.future.map((entry) => entry.id)).toEqual(["history-2"]);
    expect(jumpToFirst?.activeSteps.map((step) => step.id)).toEqual(["step-1"]);
    expect(jumpToFirst?.state.time).toBe(4);

    const jumpToStart = planReactionTimeJump([entry2, entry1], [], "start");
    expect(jumpToStart?.past).toEqual([]);
    expect(jumpToStart?.future.map((entry) => entry.id)).toEqual(["history-1", "history-2"]);
    expect(jumpToStart?.activeSteps).toEqual([]);
    expect(jumpToStart?.state.time).toBe(0);
  });
});

function testStep(id: string, simTime: number): ReactionStep {
  return {
    id,
    action: { type: "form-bond", atomIds: [] },
    beforeFormula: "H2O",
    afterFormula: "H2O",
    affectedAtomIds: [],
    affectedBondIds: [],
    explanation: "Test step",
    scoreDelta: 0,
    simTime,
    timestamp: Date.now()
  };
}
