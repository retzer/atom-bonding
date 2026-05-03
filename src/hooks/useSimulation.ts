import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { atomData } from "../data/atoms";
import { moleculePresets, presetById } from "../data/presets";
import type { AppMode, AtomParticle, AtomSymbol, Bond, BondEvent, ElectronEffect, LessonAnimationPart, LessonStep, MoleculePreset, SimulationSettings, SimulationState, ViewportAnnotation } from "../types";
import { classifyBond, eventForBond, makeBond } from "../simulation/chemistry";
import { createAtom, createFreeState, createPresetState, createSpawnedAtoms, stepSimulation } from "../simulation/engine";

const defaultSize = { width: 920, height: 640 };
type GlucoseAnomer = "alpha" | "beta";
type GlucoseStage = "idle" | "aldehyde" | "hemiacetal" | "ring";

const lessonSceneOffset = (width: number, height: number) => ({
  x: Math.max(0, (width - 920) / 2),
  y: (height * 0.5) - 300
});

export const defaultSettings: SimulationSettings = {
  temperature: 0.78,
  atomCount: 1,
  speed: 1,
  collisionStrength: 0.72,
  electronegativityEmphasis: 1,
  bondingDistance: 2.05,
   zoom: 1.4,
  theme: "light",
  visualStyle: "detailed",
  graphicsQuality: "high",
   projectionMode: "orthographic",
  cameraPreset: "free",
  lightYaw: -42,
  lightPitch: 48,
  lightIntensity: 0.5,
  lightColor: "#ffffff",
  showShells: true,
  shellOpacity2D: 0.62,
  shellSpacing2D: 0.3,
  valenceShellOnly2D: false,
  atomicModel2D: "bohr",
  electronColor2D: "#14b8a6",
  electronOpacity2D: 0.9,
  electronRenderMode2D: "particles",
  lonePairColor2D: "#8b5cf6",
  expansionScale2D: 1,
  showLabels: true,
  showElementNames2D: true,
  displayMode: "full",
  analysisMode: "chemistry",
  showElectronRegions: false,
  showBondTypes: true,
  showBondDipoles: true,
  showNetDipole: false,
  showCharges: true,
  showFunctionalGroups: false,
  focusMode: false,
  showElectronFlow: true,
  highlightLonePairs: true,
  geometryAssist: true,
   geometry3D: false,
   geometryMode: "rigid",
   relaxationStrength: 1.2,
  advanced: false,
  selectedElements: ["C"]
};

export function useSimulation() {
  const [mode, setMode] = useState<AppMode>("free");
  const [settings, setSettings] = useState<SimulationSettings>(defaultSettings);
  const [isRunning, setIsRunning] = useState(true);
  const [size, setSize] = useState(defaultSize);
  const [activePreset, setActivePreset] = useState<MoleculePreset | null>(null);
  const [glucoseAnomer, setGlucoseAnomer] = useState<GlucoseAnomer>("beta");
  const [glucoseStage, setGlucoseStage] = useState<GlucoseStage>("idle");
  const [lessonAnnotations, setLessonAnnotations] = useState<ViewportAnnotation[]>([]);
  const [highlightedAtomIds, setHighlightedAtomIds] = useState<string[]>([]);
  const [highlightedBondIds, setHighlightedBondIds] = useState<string[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [lessonStepText, setLessonStepText] = useState<string | undefined>(undefined);
  const [lessonStepIndex, setLessonStepIndex] = useState<number>(0);
  const [lessonTotalSteps, setLessonTotalSteps] = useState<number>(0);
  const [animParts, setAnimParts] = useState<LessonAnimationPart[]>([]);
  const [revealedCount, setRevealedCount] = useState(0);
  const [state, setState] = useState<SimulationState>(() => createFreeState(defaultSize.width, defaultSize.height, defaultSettings));
  const frame = useRef<number | null>(null);
  const lastTime = useRef<number | null>(null);
  const loadedSharedScene = useRef(false);
  const glucoseStageTimers = useRef<number[]>([]);

  const clearGlucoseStageTimers = useCallback(() => {
    for (const timer of glucoseStageTimers.current) window.clearTimeout(timer);
    glucoseStageTimers.current = [];
  }, []);

  useEffect(() => () => clearGlucoseStageTimers(), [clearGlucoseStageTimers]);

  const resetFree = useCallback((nextSettings = settings) => {
    clearGlucoseStageTimers();
    setActivePreset(null);
    setGlucoseStage("idle");
    setState(createFreeState(size.width, size.height, nextSettings));
  }, [clearGlucoseStageTimers, settings, size.height, size.width]);

  const spawnFreeAtoms = useCallback((count = settings.atomCount) => {
    const spawned = createSpawnedAtoms(size.width, size.height, settings, count);
    clearGlucoseStageTimers();
    setMode("free");
    setActivePreset(null);
    setGlucoseStage("idle");
    setState((current) => {
      const base = current.metallicLattice ? createFreeState(size.width, size.height, settings) : current;
      return {
        ...base,
        atoms: [...base.atoms, ...spawned],
        bonds: base.metallicLattice ? [] : base.bonds,
        hydrogenBonds: [],
        effects: base.metallicLattice ? [] : base.effects,
        metallicElectrons: [],
        selectedAtomId: spawned[0]?.id ?? base.selectedAtomId,
        selectedBondId: null,
        metallicLattice: false,
        events: [{
          id: `spawn-${Date.now()}`,
          time: base.time,
          title: "Atom spawned",
          plain: `${spawned[0]?.symbol ?? "An atom"} was added to the free simulation space.`,
          science: "The new atoms use the selected element set, then the same distance, valence, and electronegativity rules decide whether they bond."
        }, ...base.events].slice(0, 8)
      };
    });
    setIsRunning(true);
  }, [clearGlucoseStageTimers, settings, size.height, size.width]);

  const spawnAtom = useCallback((symbol: AtomSymbol) => {
    const nextSettings = { ...settings, selectedElements: [symbol] };
    const spawned = createSpawnedAtoms(size.width, size.height, nextSettings, 1);
    clearGlucoseStageTimers();
    setSettings((current) => ({ ...current, selectedElements: [symbol] }));
    setMode("free");
    setActivePreset(null);
    setGlucoseStage("idle");
    setLessonAnnotations([]);
    setHighlightedAtomIds([]);
    setHighlightedBondIds([]);
    setLessonStepText(undefined);
    setAnimParts([]);
    setState((current) => {
      const base = current.metallicLattice ? createFreeState(size.width, size.height, nextSettings) : current;
      return {
        ...base,
        atoms: [...base.atoms, ...spawned],
        bonds: base.metallicLattice ? [] : base.bonds,
        hydrogenBonds: [],
        effects: base.metallicLattice ? [] : base.effects,
        metallicElectrons: [],
        selectedAtomId: spawned[0]?.id ?? base.selectedAtomId,
        selectedBondId: null,
        metallicLattice: false,
        events: [{
          id: `spawn-${symbol}-${Date.now()}`,
          time: base.time,
          title: `${atomData[symbol].name} atom added`,
          plain: `${atomData[symbol].name} was added to the free simulation space.`,
          science: "The atom now follows the live collision, valence, and electronegativity rules."
        }, ...base.events].slice(0, 8)
      };
    });
    setIsRunning(true);
  }, [clearGlucoseStageTimers, settings, size.height, size.width]);

  const loadPreset = useCallback((presetId: string, nextMode: AppMode = "presets") => {
    const preset = presetById[presetId] ?? moleculePresets[0];
    clearGlucoseStageTimers();
    clearLessonAtoms();
    setMode(nextMode);
    setActivePreset(preset);
    setGlucoseStage(preset.id === "glucose-linear" ? "aldehyde" : isGlucoseRingPreset(preset.id) ? "ring" : "idle");
    if (isGlucoseRingPreset(preset.id)) setGlucoseAnomer(preset.id === "glucose-alpha" ? "alpha" : "beta");
    if (nextMode === "guided") {
      setState(createFreeState(size.width, size.height, settings));
    } else {
      setState(createPresetState(size.width, size.height, preset));
    }
    setIsRunning(true);
  }, [clearGlucoseStageTimers, size.height, size.width]);

  const loadMoleculePreset = useCallback((preset: MoleculePreset, nextMode: AppMode = "presets") => {
    clearGlucoseStageTimers();
    setMode(nextMode);
    setActivePreset(preset);
    setGlucoseStage(preset.id === "glucose-linear" ? "aldehyde" : isGlucoseRingPreset(preset.id) ? "ring" : "idle");
    if (isGlucoseRingPreset(preset.id)) setGlucoseAnomer(preset.id === "glucose-alpha" ? "alpha" : "beta");
    setState(createPresetState(size.width, size.height, preset));
    setIsRunning(true);
  }, [clearGlucoseStageTimers, size.height, size.width]);

  useEffect(() => {
    if (loadedSharedScene.current) return;
    loadedSharedScene.current = true;
    const match = window.location.hash.match(/scene=([^&]+)/);
    if (!match) return;
    try {
      const payload = JSON.parse(decodeURIComponent(escape(window.atob(match[1])))) as {
        settings?: Partial<SimulationSettings>;
        atoms?: Array<Pick<AtomParticle, "id" | "symbol" | "x" | "y" | "z" | "vx" | "vy" | "vz" | "radius" | "charge" | "bonds">>;
      };
      if (payload.settings) {
        setSettings((current) => ({ ...current, ...payload.settings, atomCount: 1 }));
      }
      if (payload.atoms?.length) {
        setMode("free");
        setActivePreset(null);
        setState((current) => ({
          ...createFreeState(size.width, size.height, settings),
          time: current.time,
          atoms: payload.atoms!.map((atom) => ({ ...atom, bonds: [], guided: false })),
          events: [{
            id: `shared-${Date.now()}`,
            time: current.time,
            title: "Shared scene loaded",
            plain: "A shared atom scene was restored from the URL.",
            science: "The share link stores atom positions and visual settings. Bonds reform through the simulation rules after loading."
          }]
        }));
      }
    } catch {
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    }
  }, [settings, size.height, size.width]);

  useEffect(() => {
    if (activePreset) {
      setState(createPresetState(size.width, size.height, activePreset));
    }
  }, [size.height, size.width]);

  useEffect(() => {
    if (!isRunning) {
      lastTime.current = null;
      return;
    }
    const tick = (time: number) => {
      if (lastTime.current === null) lastTime.current = time;
      const dt = (time - lastTime.current) / 1000;
      lastTime.current = time;
      setState((current) => stepSimulation(current, settings, size.width, size.height, dt));
      frame.current = window.requestAnimationFrame(tick);
    };
    frame.current = window.requestAnimationFrame(tick);
    return () => {
      if (frame.current !== null) window.cancelAnimationFrame(frame.current);
    };
  }, [isRunning, settings, size.height, size.width]);

  const updateSetting = <K extends keyof SimulationSettings>(key: K, value: SimulationSettings[K]) => {
    setSettings((current) => {
      const next = { ...current, [key]: value };
      if (key === "geometryMode") {
        next.relaxationStrength = value === "rigid" ? 1.2 : 0.72;
        next.geometryAssist = true;
      }
      return next;
    });
  };

  const setCanvasSize = useCallback((width: number, height: number) => {
    setSize({ width: Math.max(420, width), height: Math.max(420, height) });
  }, []);

  const selectAtom = useCallback((atomId: string | null) => {
    setState((current) => ({ ...current, selectedAtomId: atomId, selectedBondId: null }));
  }, []);

  const selectBond = useCallback((bondId: string | null) => {
    setState((current) => ({ ...current, selectedBondId: bondId, selectedAtomId: null }));
  }, []);

  const moveAtom = useCallback((atomId: string, x: number, y: number) => {
    setState((current) => {
      const movedAtoms = current.atoms.map((atom) => (
        atom.id === atomId
          ? { ...atom, x, y, vx: 0, vy: 0, targetX: atom.guided ? x : atom.targetX, targetY: atom.guided ? y : atom.targetY }
          : atom
      ));
      const atomById = new Map(movedAtoms.map((atom) => [atom.id, atom]));
      const overstretched = current.bonds.filter((bond) => {
        if (bond.a !== atomId && bond.b !== atomId) return false;
        const a = atomById.get(bond.a);
        const b = atomById.get(bond.b);
        if (!a || !b) return false;
        const distance = Math.hypot(a.x - b.x, a.y - b.y);
        return distance > Math.max(bond.length * 1.72, bond.length + 86);
      });

      if (!overstretched.length) {
        return { ...current, atoms: movedAtoms };
      }

      const brokenIds = new Set(overstretched.map((bond) => bond.id));
      const affectedAtomIds = new Set(overstretched.flatMap((bond) => [bond.a, bond.b]));
      const remainingBonds = current.bonds.filter((bond) => !brokenIds.has(bond.id));
      const remainingBondIdsByAtom = new Map<string, string[]>();
      for (const bond of remainingBonds) {
        remainingBondIdsByAtom.set(bond.a, [...(remainingBondIdsByAtom.get(bond.a) ?? []), bond.id]);
        remainingBondIdsByAtom.set(bond.b, [...(remainingBondIdsByAtom.get(bond.b) ?? []), bond.id]);
      }

      const atoms = movedAtoms.map((atom) => {
        const bonds = remainingBondIdsByAtom.get(atom.id) ?? [];
        if (!affectedAtomIds.has(atom.id)) return { ...atom, bonds };
        return {
          ...atom,
          bonds,
          charge: bonds.length ? atom.charge : 0,
          guided: bonds.length ? atom.guided : false,
          targetX: bonds.length ? atom.targetX : undefined,
          targetY: bonds.length ? atom.targetY : undefined
        };
      });
      const severed = overstretched[0];
      const a = atomById.get(severed.a);
      const b = atomById.get(severed.b);
      const label = a && b ? `${atomData[a.symbol].name}-${atomData[b.symbol].name}` : "A bond";

      return {
        ...current,
        atoms,
        bonds: remainingBonds,
        hydrogenBonds: current.hydrogenBonds.filter((bond) => !affectedAtomIds.has(bond.hydrogen) && !affectedAtomIds.has(bond.acceptor)),
        effects: current.effects.filter((effect) => !overstretched.some((bond) => effect.id.includes(bond.id) || effect.from === bond.a && effect.to === bond.b || effect.from === bond.b && effect.to === bond.a)),
        selectedBondId: brokenIds.has(current.selectedBondId ?? "") ? null : current.selectedBondId,
        selectedAtomId: atomId,
        events: [{
          id: `break-${Date.now()}`,
          time: current.time,
          title: "Bond severed",
          plain: `${label} was pulled far enough apart that the bond snapped. The separated atom returns to an isolated state.`,
          science: "In this simplified model, a bond breaks when dragging stretches it well beyond its stable bond length. Bond order and charge state are cleared for atoms that become isolated."
        }, ...current.events].slice(0, 8)
      };
    });
  }, []);

  const formGlucoseRing = useCallback((anomer: GlucoseAnomer = glucoseAnomer) => {
    const linear = presetById["glucose-linear"];
    if (!linear) return;
    const hemiacetal = glucoseHemiacetalPresetForAnomer(anomer);
    const ring = glucoseRingPresetForAnomer(anomer);

    clearGlucoseStageTimers();
    setMode("presets");
    setGlucoseAnomer(anomer);
    setGlucoseStage("aldehyde");
    setSettings((current) => {
      const next = { ...current, geometryAssist: true };
      if (current.geometryMode === "rigid") {
        next.relaxationStrength = 1.2;
      }
      return next;
    });
    setIsRunning(true);

    glucoseStageTimers.current = [
      window.setTimeout(() => {
        setGlucoseStage("hemiacetal");
        setState((current) => retargetPresetState(current, hemiacetal, linear, size.width, size.height, current.time, {
          event: {
            id: `glucose-hemiacetal-${Date.now()}`,
            time: current.time,
            title: "Hemiacetal forming",
            plain: "The C5 hydroxyl oxygen is moving toward C1 while the aldehyde oxygen becomes an alcohol group.",
            science: "This stage represents nucleophilic attack on the aldehyde carbon. Electron density shifts from the carbonyl into a new alcohol-like C1 center."
          },
          effectPair: [10, 0]
        }));
        setIsRunning(true);
      }, 520),
      window.setTimeout(() => {
        setGlucoseStage("ring");
        setActivePreset(ring);
        setState((current) => retargetPresetState(current, ring, linear, size.width, size.height, current.time, {
          event: {
            id: `glucose-ring-${Date.now()}`,
            time: current.time,
            title: `${anomer === "alpha" ? "Alpha" : "Beta"} glucose ring formed`,
            plain: `The chain closed into ${anomer === "alpha" ? "alpha" : "beta"}-glucose. The anomeric OH is ${anomer === "alpha" ? "down" : "up"} at C1.`,
            science: "The C5 oxygen bonds to C1 to form a cyclic hemiacetal. Flipping the anomer changes the orientation of the new C1 hydroxyl group."
          },
          effectPair: [10, 0]
        }));
        setIsRunning(true);
      }, 1420)
    ];
  }, [clearGlucoseStageTimers, glucoseAnomer, size.height, size.width]);

  const setGlucoseAnomerTarget = useCallback((anomer: GlucoseAnomer) => {
    setGlucoseAnomer(anomer);
    if (activePreset?.id === "glucose-linear") {
      setGlucoseStage("aldehyde");
      return;
    }
    if (!isGlucoseRingPreset(activePreset?.id ?? "")) return;

    const ring = glucoseRingPresetForAnomer(anomer);
    clearGlucoseStageTimers();
    setActivePreset(ring);
    setGlucoseStage("ring");
    setSettings((current) => {
      const next = { ...current, geometryAssist: true };
      if (current.geometryMode === "rigid") {
        next.relaxationStrength = 1.2;
      }
      return next;
    });
    setState((current) => retargetPresetState(current, ring, presetById["glucose-linear"] ?? ring, size.width, size.height, current.time, {
      event: {
        id: `glucose-anomer-${Date.now()}`,
        time: current.time,
        title: `${anomer === "alpha" ? "Alpha" : "Beta"} anomer selected`,
        plain: `The anomeric OH at C1 flipped ${anomer === "alpha" ? "down" : "up"}.`,
        science: "Alpha and beta glucose differ at the anomeric carbon, C1. The rest of the ring framework stays the same while the C1 hydroxyl changes orientation."
      },
      effectPair: [0, 6]
    }));
    setIsRunning(true);
  }, [activePreset?.id, clearGlucoseStageTimers, size.height, size.width]);

  const selectedAtom = useMemo<AtomParticle | null>(() => (
    state.atoms.find((atom) => atom.id === state.selectedAtomId) ?? null
  ), [state.atoms, state.selectedAtomId]);

  const selectedBond = useMemo<Bond | null>(() => (
    state.bonds.find((bond) => bond.id === state.selectedBondId) ?? null
  ), [state.bonds, state.selectedBondId]);

  const selectedMolecule = useMemo(() => {
    if (!selectedAtom) return [];
    const seen = new Set<string>([selectedAtom.id]);
    let changed = true;
    while (changed) {
      changed = false;
      for (const bond of state.bonds) {
        if (seen.has(bond.a) && !seen.has(bond.b)) {
          seen.add(bond.b);
          changed = true;
        }
        if (seen.has(bond.b) && !seen.has(bond.a)) {
          seen.add(bond.a);
          changed = true;
        }
      }
    }
    return state.atoms.filter((atom) => seen.has(atom.id));
  }, [selectedAtom, state.atoms, state.bonds]);

  const setLessonState = useCallback((annotations: ViewportAnnotation[], highlightAtoms: string[], highlightBonds: string[], stepIdx: number, stepTxt?: string, total?: number, parts?: LessonAnimationPart[], reveal?: number) => {
    setLessonAnnotations(annotations);
    setHighlightedAtomIds(highlightAtoms);
    setHighlightedBondIds(highlightBonds);
    setCurrentStepIndex(stepIdx);
    setLessonStepText(stepTxt);
    setLessonStepIndex(stepIdx);
    if (total !== undefined) setLessonTotalSteps(total);
    if (parts !== undefined) setAnimParts(parts);
    if (reveal !== undefined) setRevealedCount(reveal);
  }, []);

  const clearLessonState = useCallback(() => {
    setLessonAnnotations([]);
    setHighlightedAtomIds([]);
    setHighlightedBondIds([]);
    setCurrentStepIndex(0);
    setLessonStepText(undefined);
    setLessonStepIndex(0);
    setLessonTotalSteps(0);
    setAnimParts([]);
    setRevealedCount(0);
  }, []);

  const addLessonAtom = useCallback((symbol: AtomSymbol, x: number, y: number) => {
    const offset = lessonSceneOffset(size.width, size.height);
    const atom = createAtom(symbol, x + offset.x, y + offset.y, true);
    atom.targetX = x + offset.x;
    atom.targetY = y + offset.y;
    atom.vx = 0;
    atom.vy = 0;
    setState((current) => ({
      ...current,
      atoms: [...current.atoms, atom]
    }));
  }, [size.width, size.height]);

  const moveLessonAtom = useCallback((atomIndex: number, targetX: number, targetY: number) => {
    const offset = lessonSceneOffset(size.width, size.height);
    setState((current) => {
      const atoms = current.atoms.map((a, i) =>
        i === atomIndex ? { ...a, targetX: targetX + offset.x, targetY: targetY + offset.y, guided: true } : a
      );
      return { ...current, atoms };
    });
  }, [size.width, size.height]);

  const bondLessonAtoms = useCallback((atomIndexA: number, atomIndexB: number) => {
    setState((current) => {
      const atoms = current.atoms.map((atom) => ({ ...atom, bonds: [...atom.bonds] }));
      const a = atoms[atomIndexA];
      const b = atoms[atomIndexB];
      if (!a || !b) return current;
      if (current.bonds.some((item) => (item.a === a.id && item.b === b.id) || (item.a === b.id && item.b === a.id))) return current;
      const bond = makeBond(a, b, current.time, settings);
      a.bonds.push(bond.id);
      b.bonds.push(bond.id);
      return {
        ...current,
        atoms,
        bonds: [...current.bonds, bond],
        effects: [...current.effects, {
          id: `effect-${bond.id}`,
          from: bond.electronShift === a.id ? b.id : a.id,
          to: bond.electronShift === a.id ? a.id : b.id,
          progress: 0,
          kind: bond.kind === "ionic" ? "transfer" : "share"
        }],
        events: [eventForBond(bond, a, b), ...current.events].slice(0, 8)
      };
    });
  }, [settings]);

  const addLessonParticles = useCallback((fromIndex: number, toIndex: number, count: number, color: string) => {
    setState((current) => {
      const a = current.atoms[fromIndex];
      const b = current.atoms[toIndex];
      if (!a || !b) return current;
      const effects: ElectronEffect[] = [];
      for (let i = 0; i < count; i++) {
        effects.push({
          id: `lesson-particle-${Date.now()}-${i}`,
          from: a.id,
          to: b.id,
          progress: 0,
          kind: "share"
        });
      }
      return { ...current, effects: [...current.effects, ...effects] };
    });
  }, []);

  const clearLessonAtoms = useCallback(() => {
    setState((current) => createFreeState(size.width, size.height, settings));
  }, [settings, size.height, size.width]);

  const reset = () => {
    if (activePreset) {
      setState(createPresetState(size.width, size.height, activePreset));
    } else {
      resetFree(settings);
    }
  };

  const flingAtom = useCallback((atomId: string, vx: number, vy: number) => {
    setState((current) => {
      const atoms = current.atoms.map((atom) =>
        atom.id === atomId ? { ...atom, vx, vy } : atom
      );
      return { ...current, atoms };
    });
  }, []);

  const shareScene = useCallback(async () => {
    const payload = {
      settings: {
        theme: settings.theme,
        visualStyle: settings.visualStyle,
        graphicsQuality: settings.graphicsQuality,
        projectionMode: settings.projectionMode,
        cameraPreset: settings.cameraPreset,
        lightYaw: settings.lightYaw,
        lightPitch: settings.lightPitch,
        lightIntensity: settings.lightIntensity,
        lightColor: settings.lightColor,
        showShells: settings.showShells,
        shellOpacity2D: settings.shellOpacity2D,
        shellSpacing2D: settings.shellSpacing2D,
        valenceShellOnly2D: settings.valenceShellOnly2D,
        atomicModel2D: settings.atomicModel2D,
        electronColor2D: settings.electronColor2D,
        electronOpacity2D: settings.electronOpacity2D,
        electronRenderMode2D: settings.electronRenderMode2D,
        lonePairColor2D: settings.lonePairColor2D,
        expansionScale2D: settings.expansionScale2D,
        showLabels: settings.showLabels,
        showElementNames2D: settings.showElementNames2D,
        displayMode: settings.displayMode,
        analysisMode: settings.analysisMode,
        showElectronRegions: settings.showElectronRegions,
        showBondTypes: settings.showBondTypes,
        showBondDipoles: settings.showBondDipoles,
        showNetDipole: settings.showNetDipole,
        showCharges: settings.showCharges,
        showFunctionalGroups: settings.showFunctionalGroups,
        focusMode: settings.focusMode,
        showElectronFlow: settings.showElectronFlow,
        highlightLonePairs: settings.highlightLonePairs,
        geometryAssist: settings.geometryAssist,
        geometry3D: settings.geometry3D,
        geometryMode: settings.geometryMode,
        relaxationStrength: settings.relaxationStrength,
        selectedElements: settings.selectedElements,
        zoom: settings.zoom
      },
      atoms: state.atoms.map((atom) => ({
        id: atom.id,
        symbol: atom.symbol,
        x: Math.round(atom.x),
        y: Math.round(atom.y),
        z: Math.round(atom.z ?? 0),
        vx: 0,
        vy: 0,
        vz: 0,
        radius: atom.radius,
        charge: atom.charge,
        bonds: []
      }))
    };
    const encoded = window.btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
    const url = `${window.location.origin}${window.location.pathname}#scene=${encoded}`;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        window.prompt("Copy this scene link:", url);
      }
    } catch {
      window.prompt("Copy this scene link:", url);
    }
    setState((current) => ({
      ...current,
      events: [{
        id: `share-${Date.now()}`,
        time: current.time,
        title: "Scene link copied",
        plain: "A shareable link for this scene was copied to the clipboard.",
        science: "The link encodes atom positions and view settings in the URL hash so the browser can restore the scene locally."
      }, ...current.events].slice(0, 8)
    }));
    return url;
  }, [settings, state.atoms]);

  return {
    mode,
    setMode,
    settings,
    updateSetting,
    isRunning,
    setIsRunning,
    state,
    size,
    setCanvasSize,
    selectedAtom,
    selectedBond,
    selectedMolecule,
    activePreset,
    glucoseAnomer,
    glucoseStage,
    loadPreset,
    loadMoleculePreset,
    formGlucoseRing,
    setGlucoseAnomerTarget,
    shareScene,
    spawnFreeAtoms,
    spawnAtom,
    resetFree,
    reset,
    selectAtom,
    selectBond,
    moveAtom,
    flingAtom,
    lessonAnnotations,
    highlightedAtomIds,
    highlightedBondIds,
    currentStepIndex,
    lessonStepText,
    lessonStepIndex,
    lessonTotalSteps,
    animParts,
    revealedCount,
    setLessonState,
    clearLessonState,
    addLessonAtom,
    moveLessonAtom,
    bondLessonAtoms,
    addLessonParticles,
    clearLessonAtoms
  };
}
function createPresetBondsForAtoms(preset: MoleculePreset, atoms: AtomParticle[], time: number): Bond[] {
  if (!preset.bonds?.length) return [];
  return preset.bonds.flatMap((presetBond) => {
    const a = atoms[presetBond.a];
    const b = atoms[presetBond.b];
    if (!a || !b) return [];
    const kind = presetBond.kind ?? classifyBond(a.symbol, b.symbol, 1);
    const atomA = atomData[a.symbol];
    const atomB = atomData[b.symbol];
    const targetDistance = Math.hypot((a.targetX ?? a.x) - (b.targetX ?? b.x), (a.targetY ?? a.y) - (b.targetY ?? b.y));
    const polarity = Math.abs(atomA.electronegativity - atomB.electronegativity);
    const electronShift = atomA.electronegativity === atomB.electronegativity
      ? undefined
      : atomA.electronegativity > atomB.electronegativity ? a.id : b.id;

    return [{
      id: `preset-bond-${preset.id}-${presetBond.a}-${presetBond.b}-${Math.round(time * 1000)}`,
      a: a.id,
      b: b.id,
      kind,
      order: kind === "ionic" ? 1 : presetBond.order ?? 1,
      strength: kind === "ionic" ? 0.08 : 0.14 + (presetBond.order ?? 1) * 0.04,
      length: targetDistance || Math.max(78, (atomA.covalentRadius + atomB.covalentRadius) * 0.86),
      formedAt: time,
      polarity,
      electronShift
    }];
  });
}

function attachBondIds(atoms: AtomParticle[], bonds: Bond[]): AtomParticle[] {
  const idsByAtom = new Map<string, string[]>();
  for (const bond of bonds) {
    idsByAtom.set(bond.a, [...(idsByAtom.get(bond.a) ?? []), bond.id]);
    idsByAtom.set(bond.b, [...(idsByAtom.get(bond.b) ?? []), bond.id]);
  }
  return atoms.map((atom) => ({ ...atom, bonds: idsByAtom.get(atom.id) ?? [] }));
}

function isGlucoseRingPreset(id: string) {
  return id === "glucose-ring" || id === "glucose-alpha" || id === "glucose-beta";
}

function glucoseRingPresetForAnomer(anomer: GlucoseAnomer): MoleculePreset {
  const base = presetById["glucose-ring"];
  const atoms = base.atoms.map((atom) => ({ ...atom }));

  if (anomer === "alpha") {
    atoms[6] = { ...atoms[6], x: 178, y: 22 };
    atoms[22] = { ...atoms[22], x: 248, y: 48 };
    atoms[12] = { ...atoms[12], x: 152, y: -116 };
  } else {
    atoms[6] = { ...atoms[6], x: 188, y: -92 };
    atoms[22] = { ...atoms[22], x: 262, y: -116 };
    atoms[12] = { ...atoms[12], x: 150, y: -6 };
  }

  return {
    ...base,
    id: anomer === "alpha" ? "glucose-alpha" : "glucose-beta",
    name: anomer === "alpha" ? "\u03b1-glucose" : "\u03b2-glucose",
    aliases: [...(base.aliases ?? []), anomer === "alpha" ? "alpha glucose" : "beta glucose"],
    geometry: `${anomer === "alpha" ? "Alpha" : "Beta"} glucopyranose ring`,
    atoms,
    description: `${anomer === "alpha" ? "Alpha" : "Beta"} glucose shows the anomeric C1 hydroxyl ${anomer === "alpha" ? "down" : "up"} in this simplified Haworth-like view.`,
    science: "Alpha and beta glucose differ only at the anomeric carbon, C1. Ring closure creates that new stereocenter."
  };
}

function glucoseHemiacetalPresetForAnomer(anomer: GlucoseAnomer): MoleculePreset {
  const linear = presetById["glucose-linear"];
  const ring = glucoseRingPresetForAnomer(anomer);
  const atoms = ring.atoms.map((atom) => ({ ...atom }));
  atoms[10] = { ...atoms[10], x: 18, y: -126 };

  const bonds: NonNullable<MoleculePreset["bonds"]> = [
    { a: 0, b: 1, order: 1 },
    { a: 1, b: 2, order: 1 },
    { a: 2, b: 3, order: 1 },
    { a: 3, b: 4, order: 1 },
    { a: 4, b: 5, order: 1 },
    { a: 0, b: 6, order: 1 },
    { a: 1, b: 7, order: 1 },
    { a: 2, b: 8, order: 1 },
    { a: 3, b: 9, order: 1 },
    { a: 4, b: 10, order: 1 },
    { a: 5, b: 11, order: 1 },
    { a: 0, b: 12, order: 1 },
    { a: 1, b: 13, order: 1 },
    { a: 2, b: 14, order: 1 },
    { a: 3, b: 15, order: 1 },
    { a: 4, b: 16, order: 1 },
    { a: 5, b: 17, order: 1 },
    { a: 5, b: 18, order: 1 },
    { a: 7, b: 19, order: 1 },
    { a: 8, b: 20, order: 1 },
    { a: 9, b: 21, order: 1 },
    { a: 6, b: 22, order: 1 },
    { a: 11, b: 23, order: 1 }
  ];

  return {
    ...linear,
    id: `glucose-hemiacetal-${anomer}`,
    name: "Glucose hemiacetal",
    geometry: "Curled hemiacetal-forming glucose",
    atoms,
    bonds,
    description: "The aldehyde carbon is converting into an alcohol-like C1 center while O5 approaches for ring closure.",
    science: "The intermediate view shows the C1 carbonyl becoming a hemiacetal center before the six-membered ring closes."
  };
}

function retargetPresetState(
  current: SimulationState,
  preset: MoleculePreset,
  fallback: MoleculePreset,
  width: number,
  height: number,
  time: number,
  options: { event?: BondEvent; effectPair?: [number, number] } = {}
): SimulationState {
  const canReuseAtoms = current.atoms.length === preset.atoms.length && current.atoms.every((atom, index) => atom.symbol === preset.atoms[index]?.symbol);
  const source = canReuseAtoms ? current : createPresetState(width, height, fallback);
  const cx = width * 0.48;
  const cy = height * 0.48;
  const atoms = source.atoms.map((atom, index) => {
    const target = preset.atoms[index];
    const targetX = cx + target.x;
    const targetY = cy + target.y;
    return {
      ...atom,
      symbol: target.symbol,
      charge: 0,
      bonds: [],
      guided: true,
      targetX,
      targetY,
      targetZ: 0,
      vx: (targetX - atom.x) * 0.12,
      vy: (targetY - atom.y) * 0.12,
      vz: 0
    };
  });
  const bonds = createPresetBondsForAtoms(preset, atoms, time);
  const atomsWithBonds = attachBondIds(atoms, bonds);
  const [fromIndex, toIndex] = options.effectPair ?? [];
  const effectFrom = fromIndex !== undefined ? atomsWithBonds[fromIndex]?.id : undefined;
  const effectTo = toIndex !== undefined ? atomsWithBonds[toIndex]?.id : undefined;

  return {
    ...source,
    atoms: atomsWithBonds,
    bonds,
    hydrogenBonds: [],
    effects: effectFrom && effectTo ? [{ id: `effect-${preset.id}-${Date.now()}`, from: effectFrom, to: effectTo, progress: 0, kind: "share" }] : [],
    metallicElectrons: [],
    selectedAtomId: atomsWithBonds[toIndex ?? 0]?.id ?? atomsWithBonds[0]?.id ?? null,
    selectedBondId: null,
    time,
    metallicLattice: false,
    events: options.event ? [options.event, ...source.events].slice(0, 8) : source.events
  };
}
