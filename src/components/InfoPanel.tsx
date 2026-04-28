import { Activity, BadgeInfo, CircleHelp, Orbit, Zap } from "lucide-react";
import type { CSSProperties } from "react";
import { atomData } from "../data/atoms";
import type { AtomParticle, Bond, BondEvent, MoleculePreset, SimulationSettings } from "../types";
import { bondKindLabel, stableShellText } from "../simulation/chemistry";

type Props = {
  atom: AtomParticle | null;
  bond: Bond | null;
  molecule: AtomParticle[];
  events: BondEvent[];
  settings: SimulationSettings;
  activePreset: MoleculePreset | null;
};

export function InfoPanel({ atom, bond, molecule, events, settings, activePreset }: Props) {
  const selectedAtom = atom ? atomData[atom.symbol] : null;
  const latest = events[0];
  const moleculeFormula = molecule.length
    ? Object.entries(molecule.reduce<Record<string, number>>((acc, item) => {
        acc[item.symbol] = (acc[item.symbol] ?? 0) + 1;
        return acc;
      }, {})).map(([symbol, count]) => `${symbol}${count > 1 ? count : ""}`).join("")
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
            </dl>
            <p className="plain-text">{selectedAtom.behavior}</p>
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
        </dl>
        <div className="explanation">
          <strong>Plain explanation</strong>
          <p>{latest?.plain ?? activePreset?.description ?? "Atoms move through space. When compatible atoms get close enough, the simplified bonding rules decide whether they share electrons, transfer electrons, or bounce apart."}</p>
          <strong>Scientific explanation</strong>
          <p>{settings.advanced ? latest?.science ?? activePreset?.science ?? "Bond classification uses valence capacity, distance, and electronegativity difference. Small differences create nonpolar covalent bonds, moderate differences create polar covalent bonds, and large metal-nonmetal differences create ionic bonds." : "Turn on Advanced to see the deeper chemistry model used for the current interaction."}</p>
        </div>
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
          <span><i className="legend-shell" />Electron shell</span>
        </div>
      </section>

      <section className="info-card compact">
        <h2>Advanced Forces</h2>
        <p>Hydrogen bonds, dipole-dipole forces, and London dispersion forces are intermolecular attractions. They are listed here as advanced context rather than treated as full particle constraints in this version.</p>
      </section>
    </aside>
  );
}
