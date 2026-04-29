import { Activity, BadgeInfo, CircleHelp, ListChecks, Orbit, Zap } from "lucide-react";
import type { CSSProperties } from "react";
import { atomData } from "../data/atoms";
import type { AtomParticle, Bond, BondEvent, HydrogenBond, MoleculePreset, SimulationSettings } from "../types";
import { bondKindLabel, stableShellText } from "../simulation/chemistry";
import { analyzeAtomGeometry } from "../simulation/vsepr";

type Props = {
  atom: AtomParticle | null;
  bond: Bond | null;
  atoms: AtomParticle[];
  bonds: Bond[];
  hydrogenBonds: HydrogenBond[];
  molecule: AtomParticle[];
  events: BondEvent[];
  settings: SimulationSettings;
  activePreset: MoleculePreset | null;
};

export function InfoPanel({ atom, bond, atoms, bonds, hydrogenBonds, molecule, events, settings, activePreset }: Props) {
  const selectedAtom = atom ? atomData[atom.symbol] : null;
  const latest = events[0];
  const valence = atom ? valenceStatus(atom, bonds) : null;
  const stretch = bond ? bondStretchStatus(bond, atoms) : atom ? strongestStretchForAtom(atom, bonds, atoms) : null;
  const why = bond ? bondReason(bond, atoms) : latest?.science;
  const inventory = sceneInventory(atoms, bonds);
  const geometry = atom ? analyzeAtomGeometry(atom, atoms, bonds) : null;
  const resonance = resonanceHint(molecule.length ? molecule : atoms, bonds);
  const moleculeFormula = molecule.length
    ? formulaFromAtoms(molecule)
    : activePreset?.formula ?? "No molecule selected";

  return (
    <aside className="info-panel">
      <section className="info-card primary-info">
        <div className="section-heading">
          <BadgeInfo size={18} />
          <h2>Inspection</h2>
        </div>
        {selectedAtom ? (
          <>
            <div className="atom-title">
              <span style={{ "--atom-color": selectedAtom.color } as CSSProperties}>{selectedAtom.symbol}</span>
              <div>
                <h3>{selectedAtom.name}</h3>
                <p>{molecule.length > 1 ? `Part of ${moleculeFormula}` : "Single atom"}</p>
              </div>
            </div>
            <dl className="fact-grid">
              <dt>Atomic number</dt><dd>{selectedAtom.atomicNumber}</dd>
              <dt>Valence electrons</dt><dd>{selectedAtom.valenceElectrons}</dd>
              <dt>Electronegativity</dt><dd>{selectedAtom.electronegativity}</dd>
              <dt>Bonds formed</dt><dd>{atom?.bonds.length ?? 0}</dd>
              <dt>Electron config</dt><dd>{selectedAtom.shellSummary}</dd>
              <dt>Stability cue</dt><dd>{stableShellText(selectedAtom.symbol)}</dd>
              <dt>Valence fill</dt><dd>{valence ? `${valence.fill}/${valence.target}` : "-"}</dd>
              <dt>VSEPR shape</dt><dd>{geometry ? `${geometry.axe}: ${geometry.molecularShape}` : "Not enough bonds"}</dd>
              <dt>Electron domains</dt><dd>{geometry ? `${geometry.electronDomains} (${geometry.lonePairs} lone pair${geometry.lonePairs === 1 ? "" : "s"})` : "-"}</dd>
            </dl>
            {valence && (
              <div className="meter-block">
                <div><span>Valence completion</span><strong>{valence.complete ? "stable" : "seeking electrons"}</strong></div>
                <div className="meter"><i style={{ width: `${Math.min(100, valence.percent)}%` }} /></div>
              </div>
            )}
            <p className="plain-text">{selectedAtom.behavior}</p>
            {geometry && geometry.lonePairs > 0 && (
              <div className="explanation mini-lesson">
                <strong>Lone electron pair</strong>
                <p>{selectedAtom.symbol} has {geometry.lonePairs} lone pair{geometry.lonePairs === 1 ? "" : "s"} in this VSEPR model. Lone pairs occupy electron regions without making bonds, and they repel bonding regions strongly enough to bend or compress the molecular shape.</p>
              </div>
            )}
          </>
        ) : (
          <div className="empty-state">
            <Orbit size={30} />
            <p>Click an atom, bond line, or molecule in the canvas to inspect it here.</p>
          </div>
        )}
      </section>

      <section className="info-card">
        <div className="section-heading">
          <Zap size={18} />
          <h2>Bond Explanation</h2>
        </div>
        <dl className="fact-grid">
          <dt>Selected bond</dt><dd>{bond ? bondKindLabel[bond.kind] : latest?.title ?? "Waiting for interaction"}</dd>
          <dt>Bond order</dt><dd>{bond ? bond.order : "-"}</dd>
          <dt>Polarity</dt><dd>{bond ? bond.polarity.toFixed(2) : "-"}</dd>
          <dt>Molecule</dt><dd>{moleculeFormula}</dd>
          <dt>H-bonds nearby</dt><dd>{hydrogenBonds.length}</dd>
        </dl>
        {stretch && (
          <div className="meter-block danger">
            <div><span>Bond stretch</span><strong>{Math.round(stretch.percent)}%</strong></div>
            <div className="meter"><i style={{ width: `${Math.min(100, stretch.percent)}%` }} /></div>
          </div>
        )}
        <div className="explanation">
          <strong>Plain explanation</strong>
          <p>{latest?.plain ?? activePreset?.description ?? "Atoms move through space. When compatible atoms get close enough, the simplified bonding rules decide whether they share electrons, transfer electrons, or bounce apart."}</p>
          <strong>Scientific explanation</strong>
          <p>{settings.advanced ? latest?.science ?? activePreset?.science ?? "Bond classification uses valence capacity, distance, and electronegativity difference. Small differences create nonpolar covalent bonds, moderate differences create polar covalent bonds, and large metal-nonmetal differences create ionic bonds." : "Turn on Advanced to see the deeper chemistry model used for the current interaction."}</p>
          <strong>Why did this bond form?</strong>
          <p>{why ?? "Select a bond to see the exact rule check: distance, valence capacity, electronegativity difference, and bond classification."}</p>
          {resonance && (
            <>
              <strong>Resonance</strong>
              <p>{resonance}</p>
            </>
          )}
        </div>
      </section>

      <section className="info-card">
        <div className="section-heading">
          <ListChecks size={18} />
          <h2>Scene Composition</h2>
        </div>
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
          <p className="muted">No compositions yet. Build a molecule, choose a preset, or spawn atoms.</p>
        )}
      </section>

      <section className="info-card">
        <div className="section-heading">
          <Activity size={18} />
          <h2>Recent Events</h2>
        </div>
        <div className="event-list">
          {events.length ? events.slice(0, 4).map((event) => (
            <article key={event.id}>
              <strong>{event.title}</strong>
              <p>{event.plain}</p>
            </article>
          )) : <p className="muted">No bond event yet. Spawn atoms in Free Simulation or choose a preset molecule.</p>}
        </div>
      </section>

      <section className="info-card legend-card">
        <div className="section-heading">
          <CircleHelp size={18} />
          <h2>Legend</h2>
        </div>
        <div className="legend-grid">
          <span><i className="legend-electron" />Valence electron</span>
          <span><i className="legend-covalent" />Covalent sharing</span>
          <span><i className="legend-ionic" />Ionic transfer</span>
          <span><i className="legend-polar" />Partial charge</span>
          <span><i className="legend-metal" />Electron sea</span>
          <span><i className="legend-hbond" />Hydrogen bond</span>
          <span><i className="legend-shell" />Electron shell</span>
        </div>
      </section>

      <section className="info-card compact">
        <h2>Geometry Forces</h2>
        <p>{settings.geometryAssist ? `VSEPR angle targets, bond-length springs, damping, and nonbonded repulsion are gently relaxing the structure${settings.geometry3D ? ". The main view is using a separate orbitable 3D renderer, independent of the 2D collision canvas." : "."}` : "Geometry assist is off. Atoms still bond and collide, but VSEPR angle relaxation is paused."}</p>
      </section>
    </aside>
  );
}

function valenceStatus(atom: AtomParticle, bonds: Bond[]) {
  const data = atomData[atom.symbol];
  const target = atom.symbol === "H" ? 2 : data.nobleGas ? data.valenceElectrons : data.metal ? data.valenceElectrons : 8;
  const bondOrder = bonds
    .filter((bond) => bond.a === atom.id || bond.b === atom.id)
    .reduce((sum, bond) => sum + (bond.kind === "ionic" ? Math.abs(atom.charge) : bond.order), 0);
  const fill = data.nobleGas ? target : data.metal ? Math.max(0, data.valenceElectrons - Math.max(0, atom.charge)) : Math.min(target, data.valenceElectrons + bondOrder);
  return { fill, target, percent: target ? (fill / target) * 100 : 100, complete: fill >= target };
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

function bondStretchStatus(bond: Bond, atoms: AtomParticle[]) {
  const a = atoms.find((atom) => atom.id === bond.a);
  const b = atoms.find((atom) => atom.id === bond.b);
  if (!a || !b || bond.kind === "metallic") return null;
  const distance = Math.hypot(a.x - b.x, a.y - b.y);
  const threshold = Math.max(bond.length * 1.72, bond.length + 86);
  return { distance, threshold, percent: Math.max(0, ((distance - bond.length) / (threshold - bond.length)) * 100) };
}

function strongestStretchForAtom(atom: AtomParticle, bonds: Bond[], atoms: AtomParticle[]) {
  return bonds
    .filter((bond) => bond.a === atom.id || bond.b === atom.id)
    .map((bond) => bondStretchStatus(bond, atoms))
    .filter((item): item is NonNullable<ReturnType<typeof bondStretchStatus>> => Boolean(item))
    .sort((a, b) => b.percent - a.percent)[0] ?? null;
}

function bondReason(bond: Bond, atoms: AtomParticle[]) {
  const a = atoms.find((atom) => atom.id === bond.a);
  const b = atoms.find((atom) => atom.id === bond.b);
  if (!a || !b) return null;
  const atomA = atomData[a.symbol];
  const atomB = atomData[b.symbol];
  const distance = Math.hypot(a.x - b.x, a.y - b.y);
  const diff = Math.abs(atomA.electronegativity - atomB.electronegativity);
  const distanceCheck = distance <= bond.length * 1.35 ? "close enough" : "held by an existing bond constraint";
  const valenceCheck = bond.kind === "ionic" ? "electron transfer is favored" : `${bond.order} shared electron pair${bond.order > 1 ? "s" : ""} fit the open valence slots`;
  return `${atomA.symbol}-${atomB.symbol}: atoms were ${distanceCheck}; EN difference ${diff.toFixed(2)} classified it as ${bondKindLabel[bond.kind].toLowerCase()}; ${valenceCheck}.`;
}

function resonanceHint(atoms: AtomParticle[], bonds: Bond[]) {
  if (atoms.length < 3) return null;
  const ids = new Set(atoms.map((atom) => atom.id));
  const localBonds = bonds.filter((bond) => ids.has(bond.a) && ids.has(bond.b) && bond.kind !== "hydrogen" && bond.kind !== "dispersion" && bond.kind !== "metallic");
  const doubleBonds = localBonds.filter((bond) => bond.order === 2);
  if (!doubleBonds.length) return null;
  const atomById = new Map(atoms.map((atom) => [atom.id, atom]));
  const conjugated = doubleBonds.some((bond) => {
    const neighbors = localBonds.filter((item) => item.id !== bond.id && (item.a === bond.a || item.b === bond.a || item.a === bond.b || item.b === bond.b));
    return neighbors.some((item) => {
      const otherId = [item.a, item.b].find((id) => id !== bond.a && id !== bond.b);
      const atom = otherId ? atomById.get(otherId) : null;
      return atom && ["C", "N", "O", "S", "P"].includes(atom.symbol);
    });
  });
  if (!conjugated) return null;
  return "This structure has adjacent pi-bond or lone-pair regions, so real electron density may be delocalized across more than one drawing. This simulator keeps one visible bond layout, but highlights the idea as resonance-capable.";
}
