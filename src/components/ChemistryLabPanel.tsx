import { useMemo } from "react";
import { ExternalLink, FlaskConical } from "lucide-react";
import { analyzeMolecule } from "../simulation/moleculeAnalysis";
import { detectFunctionalGroups, type FunctionalGroup } from "../simulation/functionalGroups";
import { structuralBonds } from "../simulation/graph";
import type { Bond, ChemistryInspectTarget, MoleculePreset, PubChemCompoundInfo, SimulationState } from "../types";

type Props = {
  state: SimulationState;
  activePreset: MoleculePreset | null;
  onInspectTarget: (target: ChemistryInspectTarget) => void;
};

export function ChemistryLabPanel({ state, activePreset, onInspectTarget }: Props) {
  const analysis = useMemo(
    () => analyzeMolecule(state.atoms, state.bonds, state.hydrogenBonds),
    [state.atoms, state.bonds, state.hydrogenBonds]
  );
  const atomById = useMemo(() => new Map(state.atoms.map((atom) => [atom.id, atom])), [state.atoms]);
  const structural = useMemo(() => structuralBonds(state.bonds), [state.bonds]);
  const functionalGroups = useMemo(() => detectFunctionalGroups(state.atoms, state.bonds), [state.atoms, state.bonds]);
  const polarBonds = useMemo(() => structural.filter((bond) => bond.kind === "polar-covalent"), [structural]);
  const ionicBonds = useMemo(() => structural.filter((bond) => bond.kind === "ionic"), [structural]);
  const maxPolarityBond = useMemo(() => structural.reduce<Bond | null>((best, bond) => !best || bond.polarity > best.polarity ? bond : best, null), [structural]);
  const pubChem = activePreset?.pubChem;

  const atomIdsForSymbol = (symbol: string) => state.atoms.filter((atom) => atom.symbol === symbol).map((atom) => atom.id);
  const bondsTouchingAtoms = (atomIds: string[]) => {
    const ids = new Set(atomIds);
    return structural.filter((bond) => ids.has(bond.a) || ids.has(bond.b));
  };
  const inspectAtoms = (atomIds: string[]) => {
    const bonds = bondsTouchingAtoms(atomIds);
    onInspectTarget({ atomIds, bondIds: bonds.map((bond) => bond.id), selectAtomId: atomIds[0] ?? null });
  };
  const inspectBonds = (bonds: Bond[]) => {
    const atomIds = bonds.flatMap((bond) => [bond.a, bond.b]);
    onInspectTarget({ atomIds, bondIds: bonds.map((bond) => bond.id), selectBondId: bonds[0]?.id ?? null });
  };
  const inspectGroup = (group: { atomIds: string[]; bondIds: string[] }) => {
    onInspectTarget({
      atomIds: group.atomIds,
      bondIds: group.bondIds,
      selectBondId: group.bondIds[0] ?? null,
      selectAtomId: group.atomIds[0] ?? null
    });
  };
  const functionalGroupRows = groupedFunctionalGroups(functionalGroups);
  const hydrogenBondAtomIds = state.hydrogenBonds.flatMap((bond) => [bond.donor, bond.hydrogen, bond.acceptor]);
  const heteroAtomIds = state.atoms.filter((atom) => atom.symbol !== "C" && atom.symbol !== "H").map((atom) => atom.id);
  const aromaticGroups = functionalGroups.filter((group) => group.kind === "aromatic");

  return (
    <aside className="chemistry-lab-panel">
      <div className="chemistry-lab-header">
        <div className="chemistry-lab-title">
          <FlaskConical size={20} />
          <div>
            <h2>Chemistry Lab</h2>
            <p>Composition, structure, and chemical meaning for the active molecule.</p>
          </div>
        </div>
      </div>

      <section className="chem-lab-card composition-card">
        <CardHeader title="Composition" source="local" />
        <div className="composition-hero">
          <div>
            <span className="chem-label">Formula</span>
            <strong>{(pubChem?.molecularFormula ?? activePreset?.formula ?? analysis.formula) || "not available"}</strong>
          </div>
          <div>
            <span className="chem-label">Molar mass</span>
            <strong>{analysis.molarMass > 0 ? `${formatNumber(analysis.molarMass, 3)} g/mol` : "not available"}</strong>
          </div>
          <div>
            <span className="chem-label">Atoms</span>
            <strong>{analysis.atomCount}</strong>
          </div>
        </div>
        <div className="chemistry-list">
          {analysis.atomCounts.map((entry) => (
            <button key={entry.symbol} type="button" className="chemistry-row-button" onClick={() => inspectAtoms(atomIdsForSymbol(entry.symbol))}>
              <span>{entry.name}</span>
              <strong>{entry.symbol}{entry.count > 1 ? ` x ${entry.count}` : ""}</strong>
            </button>
          ))}
        </div>
        <div className="percent-bars">
          {analysis.percentComposition.slice(0, 8).map((entry) => (
            <button key={entry.symbol} type="button" className="percent-row-button" onClick={() => inspectAtoms(atomIdsForSymbol(entry.symbol))}>
              <span>{entry.symbol}</span>
              <div><i style={{ width: `${Math.max(3, entry.percent)}%` }} /></div>
              <strong>{formatNumber(entry.percent, 1)}%</strong>
            </button>
          ))}
        </div>
      </section>

      <section className="chem-lab-card">
        <CardHeader title="Structure" source="local" />
        <div className="chemistry-metric-grid">
          <Metric label="Structural bonds" value={analysis.bondCount} onClick={structural.length ? () => inspectBonds(structural) : undefined} />
          <Metric label="Rings detected" value={analysis.ringCount || "none"} onClick={aromaticGroups.length ? () => inspectGroup(mergeGroups(aromaticGroups)) : undefined} />
          <Metric label="Heteroatoms" value={analysis.heteroAtoms.length ? analysis.heteroAtoms.map((entry) => `${entry.symbol}${entry.count > 1 ? entry.count : ""}`).join(", ") : "none"} onClick={heteroAtomIds.length ? () => inspectAtoms(heteroAtomIds) : undefined} />
          <Metric label="H-bonds shown" value={analysis.hydrogenBondCount || "none"} onClick={hydrogenBondAtomIds.length ? () => onInspectTarget({ atomIds: hydrogenBondAtomIds, selectAtomId: hydrogenBondAtomIds[0] ?? null }) : undefined} />
        </div>
        <CompactList title="Bond types" empty="No structural bonds yet." rows={analysis.bondCounts.map((entry) => [`${entry.label}`, `${entry.count}`, () => inspectBonds(structural.filter((bond) => bond.kind === entry.kind))] as CompactRow)} />
        <CompactList title="Bond orders" empty="No bond orders yet." rows={analysis.bondOrderCounts.map((entry) => [`${entry.order === 1 ? "single" : entry.order === 2 ? "double" : "triple"}`, `${entry.count}`, () => inspectBonds(structural.filter((bond) => bond.order === entry.order))] as CompactRow)} />
        <CompactList title="Functional groups" empty="None detected by the local rule set." rows={functionalGroupRows.map((entry) => [entry.label, `${entry.count}`, () => inspectGroup(entry)] as CompactRow)} />
      </section>

      <section className="chem-lab-card">
        <CardHeader title="Bonding Explanation" source="local" />
        <p className="chemistry-summary">{analysis.polarity.summary}</p>
        <div className="chemistry-metric-grid">
          <Metric label="Polar bonds" value={analysis.polarity.polarBondCount} onClick={polarBonds.length ? () => inspectBonds(polarBonds) : undefined} />
          <Metric label="Ionic bonds" value={analysis.polarity.ionicBondCount} onClick={ionicBonds.length ? () => inspectBonds(ionicBonds) : undefined} />
          <Metric label="Max EN spread" value={formatNumber(analysis.polarity.maxBondPolarity, 2)} onClick={maxPolarityBond ? () => inspectBonds([maxPolarityBond]) : undefined} />
          <Metric label="Dipole estimate" value={formatNumber(analysis.polarity.estimatedDipole, 2)} onClick={polarBonds.length || ionicBonds.length ? () => inspectBonds([...polarBonds, ...ionicBonds]) : undefined} />
        </div>
        <CompactList title="Polarity map" empty="No polar or ionic bond vectors are estimated." rows={[...polarBonds, ...ionicBonds].sort((a, b) => b.polarity - a.polarity).slice(0, 6).map((bond) => [bondPairLabel(bond, atomById), `ΔEN ${formatNumber(bond.polarity, 2)}, ${bond.order === 1 ? "single" : bond.order === 2 ? "double" : "triple"}`, () => inspectBonds([bond])] as CompactRow)} />
        <CompactList title="VSEPR highlights" empty="No central geometry to summarize." rows={analysis.geometryHighlights.map((entry) => [`${entry.symbol}: ${entry.axe}`, `${entry.shape}${entry.lonePairs ? `, ${entry.lonePairs} lone pair${entry.lonePairs > 1 ? "s" : ""}` : ""}`, () => inspectAtoms([entry.atomId])] as CompactRow)} />
        <CompactList title="Lone pairs" empty="No lone pairs estimated." rows={analysis.lonePairSummary.map((entry) => [entry.symbol, `${entry.totalLonePairs} pair${entry.totalLonePairs > 1 ? "s" : ""} across ${entry.atomCount} atom${entry.atomCount > 1 ? "s" : ""}`, () => inspectAtoms(atomIdsForSymbol(entry.symbol))] as CompactRow)} />
      </section>

      <section className="chem-lab-card">
        <CardHeader title="What This Means" source="full" />
        <ul className="chemistry-meaning">
          {meaningStatements(analysis, pubChem).map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="chem-lab-card">
        <CardHeader title="PubChem Properties" source={pubChem ? "PubChem" : "not imported"} />
        {pubChem ? (
          <>
            <div className="pubchem-title-line">
              <strong>{pubChem.title ?? activePreset?.name ?? "Imported compound"}</strong>
              <a href={pubChem.sourceUrl} target="_blank" rel="noreferrer" title="Open PubChem record">
                <ExternalLink size={15} />
              </a>
            </div>
            <PropertyGrid pubChem={pubChem} />
            <SourceLine items={["Powered by PubChem PUG REST", "Bond labels from local electronegativity rules"]} />
          </>
        ) : (
          <p className="chemistry-empty">Import from PubChem to add CID, SMILES, InChI, exact mass, XLogP, TPSA, and descriptor fields. Local composition still works without those values.</p>
        )}
      </section>

      {analysis.warnings.length > 0 && (
        <section className="chem-lab-card warning-card">
          <CardHeader title="Analysis Notes" source="local" />
          <ul className="chemistry-meaning">
            {analysis.warnings.map((warning) => <li key={warning}>{warning}</li>)}
          </ul>
        </section>
      )}
    </aside>
  );
}

function SourceLine({ items }: { items: string[] }) {
  return (
    <div className="source-line">
      {items.map((item) => <span key={item}>{item}</span>)}
    </div>
  );
}

function CardHeader({ title, source }: { title: string; source: string }) {
  return (
    <div className="chem-card-header">
      <h3>{title}</h3>
      <span>{source}</span>
    </div>
  );
}

function Metric({ label, value, onClick }: { label: string; value: string | number; onClick?: () => void }) {
  const content = (
    <>
      <span>{label}</span>
      <strong>{value}</strong>
    </>
  );
  return onClick ? (
    <button type="button" className="chemistry-metric interactive" onClick={onClick}>
      {content}
    </button>
  ) : (
    <div className="chemistry-metric">
      {content}
    </div>
  );
}

type CompactRow = [label: string, value: string, onClick?: () => void];

function CompactList({ title, rows, empty }: { title: string; rows: CompactRow[]; empty: string }) {
  return (
    <div className="compact-chem-list">
      <h4>{title}</h4>
      {rows.length ? rows.map(([label, value, onClick]) => {
        const content = (
          <>
            <span>{label}</span>
            <strong>{value}</strong>
          </>
        );
        return onClick ? (
          <button key={`${title}-${label}-${value}`} type="button" className="compact-row-button" onClick={onClick}>
            {content}
          </button>
        ) : (
          <div key={`${title}-${label}-${value}`}>
            {content}
          </div>
        );
      }) : <p>{empty}</p>}
    </div>
  );
}

function PropertyGrid({ pubChem }: { pubChem: PubChemCompoundInfo }) {
  const rows: Array<[string, string | number | undefined]> = [
    ["CID", pubChem.cid],
    ["IUPAC name", pubChem.iupacName],
    ["Molecular weight", pubChem.molecularWeight],
    ["Exact mass", pubChem.exactMass],
    ["XLogP", pubChem.xlogp],
    ["TPSA", pubChem.tpsa],
    ["H-bond donors", pubChem.hBondDonorCount],
    ["H-bond acceptors", pubChem.hBondAcceptorCount],
    ["Rotatable bonds", pubChem.rotatableBondCount],
    ["Formal charge", pubChem.formalCharge],
    ["Complexity", pubChem.complexity]
  ];

  const proRows: Array<[string, string | number | undefined]> = [
    ["Canonical SMILES", pubChem.canonicalSmiles],
    ["Isomeric SMILES", pubChem.isomericSmiles],
    ["InChIKey", pubChem.inchiKey],
    ["InChI", pubChem.inchi]
  ];

  return (
    <>
      <div className="property-grid">
        {rows.map(([label, value]) => (
          <div key={label}>
            <span>{label}</span>
            <strong>{formatValue(value)}</strong>
          </div>
        ))}
      </div>
      <div className="property-grid pro-property-grid">
        {proRows.map(([label, value]) => (
          <div key={label}>
            <span>{label}</span>
            <strong>{formatValue(value)}</strong>
          </div>
        ))}
      </div>
      {pubChem.synonyms.length > 0 && (
        <div className="synonym-row">
          {pubChem.synonyms.slice(0, 10).map((synonym) => <span key={synonym}>{synonym}</span>)}
        </div>
      )}
    </>
  );
}

function meaningStatements(analysis: ReturnType<typeof analyzeMolecule>, pubChem: PubChemCompoundInfo | undefined) {
  const dominant = analysis.percentComposition[0];
  const groupLabels = analysis.functionalGroups.map((group) => group.label.toLocaleLowerCase());
  const statements = [
    analysis.atomCount
      ? `This molecule contains ${analysis.atomCount} atom${analysis.atomCount === 1 ? "" : "s"} arranged as ${analysis.formula || "an active structure"}.`
      : "Load or import a molecule to begin composition analysis.",
    dominant ? `${dominant.symbol} contributes the largest mass share at about ${formatNumber(dominant.percent, 1)}%.` : "Percent composition needs atomic masses and an active structure.",
    analysis.functionalGroups.length
      ? `The most visible functional signal is ${analysis.functionalGroups[0].label}.`
      : "No common functional group is detected by the current local rules."
  ];

  if (groupLabels.some((label) => label.includes("aldehyde"))) {
    statements.push("An aldehyde carbonyl marks a planar sp2 center and a reactive electron-poor carbon.");
  }
  if (groupLabels.some((label) => label.includes("polyol"))) {
    statements.push("Multiple -OH groups make the structure strongly hydrogen-bonding and usually much more water-friendly.");
  }
  if (groupLabels.some((label) => label.includes("hemiacetal"))) {
    statements.push("An aldehyde plus nearby alcohol groups can support hemiacetal formation, which is why sugars can cyclize.");
  }

  statements.push(
    analysis.polarity.polarBondCount || analysis.polarity.ionicBondCount
      ? "Electronegativity differences create local electron-rich and electron-poor regions."
      : "With few or no polar bonds, London dispersion or shape usually matters more than strong permanent dipoles."
  );
  if (analysis.geometryHighlights[0]) {
    statements.push(`${analysis.geometryHighlights[0].symbol} is a useful geometry anchor: ${analysis.geometryHighlights[0].axe}, ${analysis.geometryHighlights[0].shape}.`);
  }
  if (pubChem?.hBondDonorCount !== undefined || pubChem?.hBondAcceptorCount !== undefined) {
    statements.push(`PubChem reports ${formatValue(pubChem.hBondDonorCount)} H-bond donor(s) and ${formatValue(pubChem.hBondAcceptorCount)} acceptor(s), which helps estimate water interaction.`);
  }
  if (pubChem?.xlogp !== undefined) {
    const xlogp = Number(pubChem.xlogp);
    if (Number.isFinite(xlogp)) {
      statements.push(xlogp >= 3 ? "Higher XLogP suggests stronger preference for nonpolar environments." : "Lower XLogP suggests stronger compatibility with polar or aqueous environments.");
    }
  }

  statements.push(
    `Local bond model: average EN spread ${formatNumber(analysis.polarity.averageBondPolarity, 2)}, dipole estimate ${formatNumber(analysis.polarity.estimatedDipole, 2)}.`,
    pubChem?.canonicalSmiles ? "Use SMILES/InChI fields for database lookup, comparison, and reproducible structure identity." : "No database identifiers are attached yet; import from PubChem for reproducible external identifiers."
  );
  return statements;
}

function groupedFunctionalGroups(groups: FunctionalGroup[]) {
  const grouped = new Map<string, { label: string; count: number; atomIds: string[]; bondIds: string[] }>();
  for (const group of groups) {
    const current = grouped.get(group.label) ?? { label: group.label, count: 0, atomIds: [], bondIds: [] };
    grouped.set(group.label, {
      label: group.label,
      count: current.count + 1,
      atomIds: uniqueIds([...current.atomIds, ...group.atomIds]),
      bondIds: uniqueIds([...current.bondIds, ...group.bondIds])
    });
  }
  return [...grouped.values()].sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

function mergeGroups(groups: FunctionalGroup[]) {
  return {
    atomIds: uniqueIds(groups.flatMap((group) => group.atomIds)),
    bondIds: uniqueIds(groups.flatMap((group) => group.bondIds))
  };
}

function formatNumber(value: number, digits: number) {
  if (!Number.isFinite(value)) return "not available";
  return value.toLocaleString(undefined, { maximumFractionDigits: digits });
}

function formatValue(value: string | number | undefined) {
  if (value === undefined || value === "") return "not available";
  if (typeof value === "number") return formatNumber(value, 4);
  return value;
}

function bondPairLabel(bond: Bond, atomById: Map<string, { symbol: string }>) {
  const a = atomById.get(bond.a)?.symbol ?? "?";
  const b = atomById.get(bond.b)?.symbol ?? "?";
  const pull = bond.electronShift ? atomById.get(bond.electronShift)?.symbol : null;
  return pull ? `${a}-${b} -> ${pull}` : `${a}-${b}`;
}

function uniqueIds(ids: string[]) {
  return [...new Set(ids.filter(Boolean))];
}
