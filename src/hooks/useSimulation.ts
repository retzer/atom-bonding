import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { atomData } from "../data/atoms";
import { moleculePresets, presetById } from "../data/presets";
import type { AppMode, AtomParticle, Bond, MoleculePreset, SimulationSettings, SimulationState } from "../types";
import { createFreeState, createPresetState, createSpawnedAtoms, stepSimulation } from "../simulation/engine";

const defaultSize = { width: 920, height: 640 };

export const defaultSettings: SimulationSettings = {
  temperature: 0.78,
  atomCount: 1,
  speed: 1,
  collisionStrength: 0.72,
  electronegativityEmphasis: 1,
  bondingDistance: 2.05,
  zoom: 1,
  theme: "light",
  visualStyle: "detailed",
  projectionMode: "soft-perspective",
  cameraPreset: "free",
  lightYaw: -42,
  lightPitch: 48,
  lightIntensity: 1,
  lightColor: "#ffffff",
  showShells: true,
  showLabels: true,
  displayMode: "full",
  analysisMode: "chemistry",
  showElectronRegions: false,
  showBondDipoles: true,
  showNetDipole: true,
  showCharges: true,
  showFunctionalGroups: false,
  focusMode: false,
  showElectronFlow: true,
  highlightLonePairs: true,
  geometryAssist: true,
  geometry3D: false,
  relaxationStrength: 0.74,
  advanced: false,
  selectedElements: ["C"]
};

export function useSimulation() {
  const [mode, setMode] = useState<AppMode>("free");
  const [settings, setSettings] = useState<SimulationSettings>(defaultSettings);
  const [isRunning, setIsRunning] = useState(true);
  const [size, setSize] = useState(defaultSize);
  const [activePreset, setActivePreset] = useState<MoleculePreset | null>(null);
  const [state, setState] = useState<SimulationState>(() => createFreeState(defaultSize.width, defaultSize.height, defaultSettings));
  const frame = useRef<number | null>(null);
  const lastTime = useRef<number | null>(null);
  const loadedSharedScene = useRef(false);

  const resetFree = useCallback((nextSettings = settings) => {
    setActivePreset(null);
    setState(createFreeState(size.width, size.height, nextSettings));
  }, [settings, size.height, size.width]);

  const spawnFreeAtoms = useCallback((count = settings.atomCount) => {
    const spawned = createSpawnedAtoms(size.width, size.height, settings, count);
    setMode("free");
    setActivePreset(null);
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
  }, [settings, size.height, size.width]);

  const loadPreset = useCallback((presetId: string, nextMode: AppMode = "presets") => {
    const preset = presetById[presetId] ?? moleculePresets[0];
    setMode(nextMode);
    setActivePreset(preset);
    setState(createPresetState(size.width, size.height, preset));
    setIsRunning(true);
  }, [size.height, size.width]);

  const loadMoleculePreset = useCallback((preset: MoleculePreset, nextMode: AppMode = "presets") => {
    setMode(nextMode);
    setActivePreset(preset);
    setState(createPresetState(size.width, size.height, preset));
    setIsRunning(true);
  }, [size.height, size.width]);

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
  }, [activePreset, size.height, size.width]);

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
    setSettings((current) => ({ ...current, [key]: value }));
    if (key === "geometry3D" && value === true) setIsRunning(true);
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

  const reset = () => {
    if (activePreset) {
      setState(createPresetState(size.width, size.height, activePreset));
    } else {
      resetFree(settings);
    }
  };

  const shareScene = useCallback(async () => {
    const payload = {
      settings: {
        theme: settings.theme,
        visualStyle: settings.visualStyle,
        projectionMode: settings.projectionMode,
        cameraPreset: settings.cameraPreset,
        lightYaw: settings.lightYaw,
        lightPitch: settings.lightPitch,
        lightIntensity: settings.lightIntensity,
        lightColor: settings.lightColor,
        showShells: settings.showShells,
        showLabels: settings.showLabels,
        displayMode: settings.displayMode,
        analysisMode: settings.analysisMode,
        showElectronRegions: settings.showElectronRegions,
        showBondDipoles: settings.showBondDipoles,
        showNetDipole: settings.showNetDipole,
        showCharges: settings.showCharges,
        showFunctionalGroups: settings.showFunctionalGroups,
        focusMode: settings.focusMode,
        showElectronFlow: settings.showElectronFlow,
        highlightLonePairs: settings.highlightLonePairs,
        geometryAssist: settings.geometryAssist,
        geometry3D: settings.geometry3D,
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
    loadPreset,
    loadMoleculePreset,
    shareScene,
    spawnFreeAtoms,
    resetFree,
    reset,
    selectAtom,
    selectBond,
    moveAtom
  };
}
