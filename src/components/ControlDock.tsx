import { useState } from "react";
import type { ReactNode } from "react";
import { Activity, ChevronDown, CircleHelp, ListChecks, Orbit, Share2, SlidersHorizontal, Waves } from "lucide-react";
import type { CSSProperties } from "react";
import { atomData } from "../data/atoms";
import type { AtomParticle, AtomSymbol, Bond, BondEvent, HydrogenBond, MoleculePreset, SimulationSettings } from "../types";

type Props = {
  settings: SimulationSettings;
  atoms: AtomParticle[];
  bonds: Bond[];
  hydrogenBonds: HydrogenBond[];
  events: BondEvent[];
  activePreset: MoleculePreset | null;
  onSetting: <K extends keyof SimulationSettings>(key: K, value: SimulationSettings[K]) => void;
  onSpawnAtom: (symbol: AtomSymbol) => void;
  onShareScene: () => void;
};

export function ControlDock({ settings, atoms, bonds, hydrogenBonds, events, activePreset, onSetting, onSpawnAtom, onShareScene }: Props) {
  const selectElement = (symbol: AtomSymbol) => {
    onSetting("selectedElements", [symbol]);
    onSpawnAtom(symbol);
  };

  const inventory = sceneInventory(atoms, bonds);

  return (
    <section className="control-dock" aria-label="Simulation controls">
      <div className="dock-title">
        <SlidersHorizontal size={18} />
        <h2>Controls</h2>
      </div>
      <div className="control-section">
        <div className="control-section-title">Physics</div>
        <div className="control-grid compact-grid">
          <Slider label="Temperature" title="Higher temperature makes atoms move faster." value={settings.temperature} min={0.1} max={1.8} step={0.05} onChange={(value) => onSetting("temperature", value)} />
          <Slider label="Speed" title="Overall simulation playback speed." value={settings.speed} min={0.2} max={2.4} step={0.05} onChange={(value) => onSetting("speed", value)} />
          <Slider label="Collision" title="How strongly atoms bounce when they do not bond." value={settings.collisionStrength} min={0.2} max={1.4} step={0.05} onChange={(value) => onSetting("collisionStrength", value)} />
          <Slider label="EN difference" title="Emphasizes electronegativity difference when classifying bonds." value={settings.electronegativityEmphasis} min={0.7} max={1.5} step={0.05} onChange={(value) => onSetting("electronegativityEmphasis", value)} />
          <Slider label="Bond distance" title="How close atoms must be before bond rules are tested." value={settings.bondingDistance} min={1.45} max={2.8} step={0.05} onChange={(value) => onSetting("bondingDistance", value)} />
          <Slider label="Zoom" title="Scale the simulation viewport without changing the chemistry." value={settings.zoom} min={0.55} max={2.2} step={0.05} onChange={(value) => onSetting("zoom", value)} />
        </div>
        <div className="projection-row" aria-label="Geometry behavior">
          <button className={settings.geometryMode === "rigid" ? "visual-choice active" : "visual-choice"} title="Strict textbook VSEPR geometry with minimal exploratory motion" onClick={() => onSetting("geometryMode", "rigid")}>
            <Orbit size={15} />
            Rigid
          </button>
          <button className={settings.geometryMode === "flexible" ? "visual-choice active" : "visual-choice"} title="Flexible exploration mode with gentle motion and spacing response" onClick={() => onSetting("geometryMode", "flexible")}>
            <Waves size={15} />
            Flexible
          </button>
        </div>
      </div>
      <div className="control-section">
        <div className="control-section-title">Elements</div>
        <div className="element-board quick-element-board" aria-label="Choose a common atom">
          <div className="element-group quick-elements">
            <div className="element-group-title">Common starters</div>
            <div className="element-picker">
              {quickElementSymbols.map((symbol) => {
                const atom = atomData[symbol];
                return (
                  <button
                    key={atom.symbol}
                    className={settings.selectedElements.includes(atom.symbol) ? "selected" : ""}
                    style={{ "--atom-color": atom.color } as CSSProperties}
                    title={`${atom.name}: ${atom.behavior}`}
                    onClick={() => selectElement(atom.symbol)}
                  >
                    {atom.symbol}
                  </button>
                );
              })}
            </div>
            <p className="element-group-hint">Open the full periodic table under the simulator for all 118 elements.</p>
          </div>
        </div>
      </div>
      <div className="control-section control-section-inline">
        <div className="spawn-row">
          <button className="spawn-button" title="Copy a shareable link for the current scene" onClick={onShareScene}>
            <Share2 size={16} />
            Share scene
          </button>
        </div>
      </div>

      <CollapsibleSection icon={<ListChecks size={18} />} title="Scene Composition" defaultOpen={false}>
        {inventory.groups.length ? (
          <>
            <div className="composition-list">
              {inventory.groups.map((group) => (
                <article key={group.key}>
                  <strong>{group.formula}</strong>
                  <span>{group.quantity} {group.atomCount === 1 ? "atom" : "molecule"}{group.quantity > 1 ? "s" : ""} - {group.atomCount} atoms - {group.bondCount} bonds</span>
                  <p>{group.elements}</p>
                </article>
              ))}
            </div>
            <p className="composition-total">{inventory.totalAtoms} atoms total - {inventory.totalBonds} bonds total - {inventory.elements}</p>
          </>
        ) : (
          <p className="muted">No compositions yet. Click an element to add atoms, or choose a preset molecule.</p>
        )}
      </CollapsibleSection>

      <CollapsibleSection icon={<Activity size={18} />} title="Recent Events" defaultOpen={false}>
        <div className="event-list">
          {events.length ? events.slice(0, 4).map((event) => (
            <article key={event.id}>
              <strong>{event.title}</strong>
              <p>{event.plain}</p>
            </article>
          )) : <p className="muted">No bond event yet. Spawn atoms in Free Simulation or choose a preset molecule.</p>}
        </div>
      </CollapsibleSection>

      <CollapsibleSection icon={<CircleHelp size={18} />} title="Legend" defaultOpen={false}>
        <div className="legend-grid">
          <span><i className="legend-electron" />Valence electron</span>
          <span><i className="legend-covalent" />Covalent sharing</span>
          <span><i className="legend-ionic" />Ionic transfer</span>
          <span><i className="legend-polar" />Partial charge</span>
          <span><i className="legend-metal" />Electron sea</span>
          <span><i className="legend-hbond" />Hydrogen bond</span>
          <span><i className="legend-shell" />Electron shell</span>
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Geometry Forces" icon={null} defaultOpen={false}>
        <p>{settings.geometryAssist ? settings.geometryMode === "rigid" ? `Rigid mode keeps the structure close to textbook VSEPR geometry with minimal thermal drift${settings.geometry3D ? ". The 3D view prioritizes ideal bond angles and central-atom geometry." : "."}` : `Flexible mode keeps VSEPR guidance active while allowing exploratory motion, spacing, and gentle distortion${settings.geometry3D ? ". The 3D view blends textbook geometry with the live simulation." : "."}` : "Geometry assist is off. Atoms still bond and collide, but VSEPR angle guidance is paused."}</p>
      </CollapsibleSection>
    </section>
  );
}

const quickElementSymbols: AtomSymbol[] = [
  "H", "C", "N", "O", "F", "Na", "Mg", "Al", "Si", "P", "S", "Cl",
  "K", "Ca", "Fe", "Cu", "Zn", "Br", "Ag", "I", "Au", "Hg", "Pb"
];

function CollapsibleSection({ icon, title, defaultOpen, children }: {
  icon: ReactNode | null;
  title: string;
  defaultOpen: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`control-section collapsible-section${open ? " expanded" : ""}`}>
      <button className="collapsible-header" onClick={() => setOpen((prev) => !prev)}>
        <span className="collapsible-header-left">
          {icon}
          <span className="control-section-title">{title}</span>
        </span>
        <ChevronDown size={16} className={`collapsible-chevron${open ? " rotated" : ""}`} />
      </button>
      {open && <div className="collapsible-body">{children}</div>}
    </div>
  );
}

function Slider({ label, title, value, min, max, step, onChange }: {
  label: string;
  title: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="slider" title={title}>
      <span>
        {label}
        <strong>{Number.isInteger(value) ? value : value.toFixed(2)}</strong>
      </span>
      <input type="range" value={value} min={min} max={max} step={step} onChange={(event) => onChange(Number(event.target.value))} />
    </label>
  );
}

function sceneInventory(atoms: AtomParticle[], bonds: Bond[]) {
  const structuralBonds = bonds.filter((bond) => bond.kind !== "hydrogen" && bond.kind !== "dispersion");
  const adjacency = new Map<string, Set<string>>();
  for (const atom of atoms) adjacency.set(atom.id, new Set());
  for (const bond of structuralBonds) {
    adjacency.get(bond.a)?.add(bond.b);
    adjacency.get(bond.b)?.add(bond.a);
  }

  const seen = new Set<string>();
  const components: AtomParticle[][] = [];
  for (const atom of atoms) {
    if (seen.has(atom.id)) continue;
    const stack = [atom.id];
    const ids = new Set<string>();
    seen.add(atom.id);
    while (stack.length) {
      const id = stack.pop()!;
      ids.add(id);
      for (const next of adjacency.get(id) ?? []) {
        if (seen.has(next)) continue;
        seen.add(next);
        stack.push(next);
      }
    }
    components.push(atoms.filter((item) => ids.has(item.id)));
  }

  const grouped = new Map<string, {
    key: string;
    formula: string;
    quantity: number;
    atomCount: number;
    bondCount: number;
    elements: string;
  }>();

  for (const component of components) {
    const ids = new Set(component.map((atom) => atom.id));
    const bondCount = structuralBonds.filter((bond) => ids.has(bond.a) && ids.has(bond.b)).length;
    const formula = formulaFromAtoms(component);
    const key = `${formula}-${component.length}-${bondCount}`;
    const existing = grouped.get(key);
    if (existing) {
      existing.quantity += 1;
    } else {
      grouped.set(key, {
        key,
        formula,
        quantity: 1,
        atomCount: component.length,
        bondCount,
        elements: elementSummary(component)
      });
    }
  }

  return {
    groups: [...grouped.values()].sort((a, b) => b.atomCount - a.atomCount || a.formula.localeCompare(b.formula)),
    totalAtoms: atoms.length,
    totalBonds: structuralBonds.length,
    elements: elementSummary(atoms)
  };
}

function formulaFromAtoms(atoms: AtomParticle[]) {
  const counts = atoms.reduce<Record<string, number>>((acc, item) => {
    acc[item.symbol] = (acc[item.symbol] ?? 0) + 1;
    return acc;
  }, {});
  return formatCounts(counts, true);
}

function elementSummary(atoms: AtomParticle[]) {
  const counts = atoms.reduce<Record<string, number>>((acc, item) => {
    acc[item.symbol] = (acc[item.symbol] ?? 0) + 1;
    return acc;
  }, {});
  return formatCounts(counts, false).replace(/([A-Z][a-z]?)(\d+)/g, "$1 x $2").replace(/([A-Z][a-z]?)(?=$|,)/g, "$1 x 1");
}

function formatCounts(counts: Record<string, number>, hillOrder: boolean) {
  const symbols = Object.keys(counts).sort((a, b) => {
    if (hillOrder && counts.C) {
      if (a === "C") return -1;
      if (b === "C") return 1;
      if (a === "H") return -1;
      if (b === "H") return 1;
    }
    return (atomData[a as keyof typeof atomData]?.atomicNumber ?? 999) - (atomData[b as keyof typeof atomData]?.atomicNumber ?? 999);
  });
  return symbols.map((symbol) => `${symbol}${counts[symbol] > 1 ? counts[symbol] : ""}`).join(hillOrder ? "" : ", ");
}
