import { describe, expect, it } from "vitest";
import { presetById } from "../data/presets";
import { defaultSettings } from "../hooks/useSimulation";
import type { MechanismGesture, SimulationState } from "../types";
import { createAtom, createPresetState } from "./engine";
import { cloneState, commitMechanism, deriveElectronSources, deriveElectronTargets, nextBondOrderAction, previewMechanism } from "./electronMechanism";

const settings = { ...defaultSettings, geometryAssist: true, electronegativityEmphasis: 1 };

describe("electron-first mechanism layer", () => {
  it("derives visible electron sources and targets from a molecule graph", () => {
    const water = createPresetState(900, 600, presetById.h2o);
    const oxygen = water.atoms.find((atom) => atom.symbol === "O");
    expect(oxygen).toBeTruthy();

    const sources = deriveElectronSources(water);
    const targets = deriveElectronTargets(water);

    expect(sources.some((source) => source.id === `lp:${oxygen!.id}` && source.kind === "lone-pair")).toBe(true);
    expect(sources.some((source) => source.kind === "sigma-bond")).toBe(true);
    expect(targets.some((target) => target.kind === "proton")).toBe(true);
  });

  it("previews lone-pair to carbonyl electron movement without mutating state", () => {
    const formaldehyde = createPresetState(900, 600, presetById.formaldehyde);
    const carbonyl = formaldehyde.bonds.find((bond) => bond.order === 2);
    expect(carbonyl).toBeTruthy();
    const carbon = formaldehyde.atoms.find((atom) => (atom.id === carbonyl!.a || atom.id === carbonyl!.b) && atom.symbol === "C");
    expect(carbon).toBeTruthy();
    const nucleophile = { ...createAtom("O", carbon!.x - 140, carbon!.y, true), id: "test-nucleophile-oxygen", charge: -1, vx: 0, vy: 0 };
    const state: SimulationState = { ...formaldehyde, atoms: [...formaldehyde.atoms, nucleophile] };
    const before = cloneState(state);
    const gesture: MechanismGesture = {
      id: "lp-to-carbonyl",
      sourceId: `lp:${nucleophile.id}`,
      targetId: `bond:${carbonyl!.id}`,
      mode: "drag"
    };

    const preview = previewMechanism(state, settings, gesture);

    expect(preview.allowed).toBe(true);
    expect(preview.action.type).toBe("nucleophile-attack");
    expect(preview.ghostBonds.length).toBeGreaterThan(0);
    expect(preview.flowArrows.length).toBeGreaterThan(0);
    expect(preview.bondOrderDeltas?.some((delta) => delta.bondId === carbonyl!.id && delta.after === 1)).toBe(true);
    expect(preview.formalChargeDeltas?.length).toBeGreaterThan(0);
    expect(state.bonds).toEqual(before.bonds);
    expect(state.atoms).toEqual(before.atoms);
  });

  it("commits mechanism steps with history snapshots for undo and redo", () => {
    const water = createPresetState(900, 600, presetById.h2o);
    const oxygen = water.atoms.find((atom) => atom.symbol === "O");
    const hydrogen = water.atoms.find((atom) => atom.symbol === "H");
    expect(oxygen).toBeTruthy();
    expect(hydrogen).toBeTruthy();

    const gesture: MechanismGesture = {
      id: "lp-to-proton",
      sourceId: `lp:${oxygen!.id}`,
      targetId: `proton:${hydrogen!.id}`,
      mode: "click"
    };
    const result = commitMechanism(water, settings, gesture);

    expect(result).toBeTruthy();
    expect(result!.step.mechanism).toEqual(gesture);
    expect(result!.historyEntry.before.atoms.length).toBe(water.atoms.length);
    expect(result!.historyEntry.after.atoms.length).toBe(result!.state.atoms.length);
    expect(result!.step.formalChargeDeltas?.some((delta) => delta.atomId === oxygen!.id)).toBe(true);
  });

  it("blocks unsupported source-target moves with stable reasons", () => {
    const water = createPresetState(900, 600, presetById.h2o);
    const oxygen = water.atoms.find((atom) => atom.symbol === "O");
    expect(oxygen).toBeTruthy();

    const preview = previewMechanism(water, settings, {
      id: "self-target",
      sourceId: `lp:${oxygen!.id}`,
      targetId: `atom:${oxygen!.id}`,
      mode: "click"
    });

    expect(preview.allowed).toBe(false);
    expect(preview.warnings.join(" ")).toMatch(/cannot|needs|target/i);
  });

  it("maps numeric bond-order shortcuts into deterministic primitive actions", () => {
    const carbonDioxide = createPresetState(900, 600, presetById.co2);
    const doubleBond = carbonDioxide.bonds.find((bond) => bond.order === 2);
    expect(doubleBond).toBeTruthy();

    expect(nextBondOrderAction(doubleBond!, 3)).toEqual({ type: "increase-bond-order", bondId: doubleBond!.id });
    expect(nextBondOrderAction(doubleBond!, 1)).toEqual({ type: "decrease-bond-order", bondId: doubleBond!.id });
    expect(nextBondOrderAction(doubleBond!, 2)).toBeNull();
  });
});
