import { describe, expect, it, vi } from "vitest";
import type { SimulationSettings, SimulationState } from "../types";
import { createAtom } from "./engine";
import { applyAtomIsotopeEdit, applyNuclearDecay, decayProbability, resolveIsotope, setAtomIsotope, setAtomNeutronCount, setAtomProtonCount } from "./isotopes";

const settings = {
  decayEnabled: true,
  decayTeachingAcceleration: 1
} as SimulationSettings;

function stateWith(atom = createAtom("C", 0, 0)): SimulationState {
  return {
    atoms: [atom],
    bonds: [],
    hydrogenBonds: [],
    effects: [],
    metallicElectrons: [],
    events: [],
    nuclearEvents: [],
    selectedAtomId: atom.id,
    selectedBondId: null,
    time: 0,
    metallicLattice: false
  };
}

describe("isotope model", () => {
  it("uses a default isotope for spawned atoms", () => {
    const atom = createAtom("H", 0, 0);
    const isotope = resolveIsotope(atom);
    expect(isotope.id).toBe("H-1");
    expect(atom.protonCount).toBe(1);
    expect(atom.neutronCount).toBe(0);
  });

  it("changes neutron count without changing element identity", () => {
    const carbon = createAtom("C", 0, 0);
    const edited = setAtomNeutronCount(carbon, 8);
    expect(edited.symbol).toBe("C");
    expect(edited.protonCount).toBe(6);
    expect(edited.neutronCount).toBe(8);
    expect(edited.massNumber).toBe(14);
  });

  it("changes element identity when proton count changes", () => {
    const carbon = createAtom("C", 0, 0);
    const edited = setAtomProtonCount(carbon, 7);
    expect(edited.symbol).toBe("N");
    expect(edited.protonCount).toBe(7);
  });

  it("computes larger decay probability for larger elapsed time", () => {
    expect(decayProbability(10, 10)).toBeGreaterThan(decayProbability(10, 1));
  });

  it("keeps stable isotopes from decaying", () => {
    const stable = setAtomIsotope(createAtom("C", 0, 0), "C-12");
    const next = applyNuclearDecay(stateWith(stable), settings, 1e12);
    expect(next.atoms[0].symbol).toBe("C");
    expect(resolveIsotope(next.atoms[0]).id).toBe("C-12");
    expect(next.nuclearEvents).toHaveLength(0);
  });

  it("beta-minus decay changes carbon-14 into nitrogen-14", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    const carbon14 = setAtomIsotope(createAtom("C", 0, 0), "C-14");
    const next = applyNuclearDecay(stateWith(carbon14), settings, 1);
    vi.restoreAllMocks();
    expect(next.atoms[0].symbol).toBe("N");
    expect(resolveIsotope(next.atoms[0]).id).toBe("N-14");
    expect(next.nuclearEvents[0]?.decayMode).toBe("beta-minus");
  });

  it("alpha decay changes uranium-238 into thorium-234", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    const uranium238 = setAtomIsotope(createAtom("U", 0, 0), "U-238");
    const next = applyNuclearDecay(stateWith(uranium238), settings, 1e18);
    vi.restoreAllMocks();
    expect(next.atoms[0].symbol).toBe("Th");
    expect(resolveIsotope(next.atoms[0]).id).toBe("Th-234");
    expect(next.nuclearEvents[0]?.decayMode).toBe("alpha");
  });

  it("does not collapse lawrencium-266 into a guessed lead chain", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    const lawrencium266 = setAtomIsotope(createAtom("Lr", 0, 0), "Lr-266");
    const next = applyNuclearDecay(stateWith(lawrencium266), settings, 6 * 60 * 60);
    vi.restoreAllMocks();
    expect(next.atoms[0].symbol).toBe("Lr");
    expect(resolveIsotope(next.atoms[0]).id).toBe("Lr-266");
    expect(next.nuclearEvents).toHaveLength(0);
  });

  it("does not auto-decay source-missing estimated heavy daughters", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    const lawrencium266 = setAtomIsotope(createAtom("Lr", 0, 0), "Lr-266");
    const mendelevium262 = setAtomProtonCount(setAtomNeutronCount(lawrencium266, 161), 101);
    const next = applyNuclearDecay(stateWith(mendelevium262), settings, 1e9);
    vi.restoreAllMocks();
    expect(resolveIsotope(next.atoms[0]).id).toBe("Md-262");
    expect(next.nuclearEvents).toHaveLength(0);
  });

  it("records isotope edits as state events", () => {
    const carbon = createAtom("C", 0, 0);
    const next = applyAtomIsotopeEdit(stateWith(carbon), carbon.id, "neutrons", 8);
    expect(resolveIsotope(next.atoms[0]).id).toBe("C-14");
    expect(next.events[0]?.plain).toContain("neutron count changes isotope mass");
  });
});
