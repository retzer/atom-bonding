import { useEffect, useMemo, useRef, useState } from "react";
import { BadgeInfo, BrainCircuit, Orbit, WandSparkles, Zap } from "lucide-react";
import type { CSSProperties } from "react";
import { atomData } from "../data/atoms";
import { elementDetails } from "../data/elementDetails";
import { periodicElements } from "../data/periodicTable";
import { buildChemAiSelectionCacheKey, fetchChemAiSelectionInsight, getCachedChemAiInsight } from "../data/chemAi";
import type { AtomDefinition, AtomParticle, AtomSymbol, Bond, BondEvent, ChemAiInsight, ElectronSource, ElectronTarget, HydrogenBond, IsotopeActivityLevel, IsotopeRecord, MoleculePreset, ReactionPreview, SimulationSettings } from "../types";
import { bondKindLabel, stableShellText } from "../simulation/chemistry";
import { formatDecayMode, isotopeActivityLevel, isotopeOptionsForSymbol, resolveIsotope } from "../simulation/isotopes";
import { analyzeMolecule } from "../simulation/moleculeAnalysis";
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
  reactionPreview?: ReactionPreview | null;
  selectedElectronSource?: ElectronSource | null;
  selectedElectronTarget?: ElectronTarget | null;
  onSetAtomIsotope?: (atomId: string, isotopeId: string) => void;
  onSetAtomNeutrons?: (atomId: string, neutronCount: number) => void;
  onSetAtomProtons?: (atomId: string, protonCount: number) => void;
  section?: "all" | "inspection" | "bond";
};

const periodicBySymbol = new Map(periodicElements.map((element) => [element.symbol, element]));

export function InfoPanel({ atom, bond, atoms, bonds, hydrogenBonds, molecule, events, settings, activePreset, reactionPreview, selectedElectronSource, selectedElectronTarget, onSetAtomIsotope, onSetAtomNeutrons, onSetAtomProtons, section = "all" }: Props) {
  const audioRef = useRef<GeigerAudio | null>(null);
  const showInspection = section !== "bond";
  const showBond = section !== "inspection";
  const selectedAtom = atom ? atomData[atom.symbol] : null;
  const elementDetail = atom ? elementDetails[atom.symbol] : null;
  const isotope = atom ? resolveIsotope(atom) : null;
  const isotopeOptions = atom ? isotopeOptionsForSymbol(atom.symbol) : [];
  const activityLevel = isotope ? isotopeActivityLevel(isotope) : "none";
  const radioactive = isotope && activityLevel !== "none" ? isotope : null;
  const latest = events[0];
  const valence = atom ? valenceStatus(atom, bonds) : null;
  const stretch = bond ? bondStretchStatus(bond, atoms) : atom ? strongestStretchForAtom(atom, bonds, atoms) : null;
  const why = bond ? bondReason(bond, atoms) : latest?.science;
  const geometry = atom ? analyzeAtomGeometry(atom, atoms, bonds) : null;
  const resonance = resonanceHint(molecule.length ? molecule : atoms, bonds);
  const geiger = activityLevel !== "none" ? geigerReading(activityLevel) : null;
  const moleculeAnalysis = useMemo(() => analyzeMolecule(atoms, bonds, hydrogenBonds), [atoms, bonds, hydrogenBonds]);
  const moleculeFormula = molecule.length
    ? formulaFromAtoms(molecule)
    : activePreset?.formula ?? "No molecule selected";

  useEffect(() => {
    if (!showInspection || !radioactive || !settings.geigerAudioEnabled) {
      audioRef.current?.stop();
      audioRef.current = null;
      return;
    }
    audioRef.current?.stop();
    const geigerAudio = createGeigerAudio(activityLevel);
    audioRef.current = geigerAudio;
    geigerAudio.start();
    return () => {
      geigerAudio.stop();
      if (audioRef.current === geigerAudio) audioRef.current = null;
    };
  }, [activityLevel, atom?.id, radioactive?.id, settings.geigerAudioEnabled, showInspection]);

  return (
    <aside className={`info-panel info-panel-${section}`}>
      {showInspection && (
      <section className="info-card primary-info">
        <div className="section-heading">
          <BadgeInfo size={18} />
          <h2>Inspection</h2>
        </div>
        {selectedAtom ? (
          <>
            <div className="inspection-hero">
              <div className="atom-title">
                <span style={{ "--atom-color": selectedAtom.color } as CSSProperties}>{selectedAtom.symbol}</span>
                <div>
                  <h3>{selectedAtom.name}</h3>
                  <p>{molecule.length > 1 ? `Part of ${moleculeFormula}` : "Single atom"}</p>
                </div>
              </div>
              <InspectionAtomModel atom={selectedAtom} />
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
            {atom && isotope && (
              <IsotopeEditorCard
                atom={atom}
                isotope={isotope}
                options={isotopeOptions}
                activityLevel={activityLevel}
                onSetAtomIsotope={onSetAtomIsotope}
                onSetAtomNeutrons={onSetAtomNeutrons}
                onSetAtomProtons={onSetAtomProtons}
              />
            )}
            {elementDetail && (
              <div className="explanation mini-lesson atom-summary">
                <strong>{selectedAtom.name} summary</strong>
                <p>{elementDetail.description} {elementDetail.discoveryYear === "Ancient" ? "It has been known since antiquity." : `It was found in ${elementDetail.discoveryYear}.`}</p>
              </div>
            )}
            {radioactive && (
              <div className={`geiger-card ${activityLevel}`}>
                <div className="geiger-head">
                  <strong>Geiger counter</strong>
                  <span>{activityLevel}</span>
                </div>
                {geiger && (
                  <div
                    className="geiger-dial"
                    style={{
                      "--needle-rest": geiger.needleRest,
                      "--needle-peak": geiger.needlePeak
                    } as CSSProperties}
                    aria-label={`Radiation reading ${geiger.dose} and ${geiger.cpm}`}
                  >
                    <div className="geiger-scale">
                      <span>0</span>
                      <span>50</span>
                      <span>200</span>
                    </div>
                    <i className="geiger-needle" />
                    <b className="geiger-pivot" />
                    <div className="geiger-reading">
                      <strong>{geiger.dose}</strong>
                      <span>{geiger.cpm}</span>
                    </div>
                  </div>
                )}
                <div className="geiger-meter" aria-hidden="true">
                  {Array.from({ length: 16 }, (_, index) => <i key={index} style={{ "--tick": index } as CSSProperties} />)}
                </div>
                <dl className="fact-grid compact-facts">
                  <dt>Active isotope</dt><dd>{radioactive.label}</dd>
                  <dt>Half-life</dt><dd>{radioactive.halfLifeLabel ?? "not available"}</dd>
                </dl>
                <p>{radioactive.notes ?? radioactive.decayBranches[0]?.description ?? "This isotope is radioactive in the local nuclear model."}</p>
              </div>
            )}
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
            <InspectionAiNotes
              atom={atom}
              bond={null}
              activePreset={activePreset}
              analysis={moleculeAnalysis}
            />
            <MechanismPreviewCard preview={reactionPreview} source={selectedElectronSource} target={selectedElectronTarget} />
          </>
        ) : bond ? (
          <>
            <InspectionAiNotes
              atom={null}
              bond={bond}
              activePreset={activePreset}
              analysis={moleculeAnalysis}
            />
            <MechanismPreviewCard preview={reactionPreview} source={selectedElectronSource} target={selectedElectronTarget} />
          </>
        ) : (
          <div className="empty-state">
            <Orbit size={30} />
            <p>Click an atom, bond line, or molecule in the canvas to inspect it here.</p>
          </div>
        )}
      </section>
      )}

      {showBond && (
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
        <MechanismPreviewCard preview={reactionPreview} source={selectedElectronSource} target={selectedElectronTarget} />
      </section>
      )}
    </aside>
  );
}

function MechanismPreviewCard({ preview, source, target }: { preview?: ReactionPreview | null; source?: ElectronSource | null; target?: ElectronTarget | null }) {
  if (!preview && !source && !target) return null;
  return (
    <div className="explanation mini-lesson mechanism-preview-card">
      <strong>Electron movement</strong>
      <dl className="fact-grid compact-facts">
        <dt>Source</dt><dd>{source ? source.label : preview?.mechanism?.sourceId ?? "-"}</dd>
        <dt>Target</dt><dd>{target ? target.label : preview?.mechanism?.targetId ?? "-"}</dd>
        <dt>Status</dt><dd>{preview ? preview.allowed ? "allowed preview" : "blocked preview" : "selecting"}</dd>
      </dl>
      {preview?.flowArrows.length ? (
        <p>{preview.flowArrows.map((arrow) => arrow.label).join(", ")}.</p>
      ) : null}
      {preview?.formalChargeDeltas?.length ? (
        <p>Formal charge: {preview.formalChargeDeltas.map((delta) => `${delta.before} -> ${delta.after}`).join(", ")}.</p>
      ) : null}
      {preview?.bondOrderDeltas?.length ? (
        <p>Bond order: {preview.bondOrderDeltas.map((delta) => `${delta.before} -> ${delta.after}`).join(", ")}.</p>
      ) : null}
      {preview?.hybridizationDeltas?.length ? (
        <p>Hybridization: {preview.hybridizationDeltas.map((delta) => `${delta.before} -> ${delta.after}`).join(", ")}.</p>
      ) : null}
      {preview?.stabilityReasons?.length ? (
        <ul>
          {preview.stabilityReasons.slice(0, 3).map((reason) => <li key={reason}>{reason}</li>)}
        </ul>
      ) : null}
    </div>
  );
}

function InspectionAiNotes({ atom, bond, activePreset, analysis }: { atom: AtomParticle | null; bond: Bond | null; activePreset: MoleculePreset | null; analysis: ReturnType<typeof analyzeMolecule> }) {
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [message, setMessage] = useState("");
  const [insight, setInsight] = useState<ChemAiInsight | null>(null);
  const [fromCache, setFromCache] = useState(false);
  const cacheKey = useMemo(
    () => buildChemAiSelectionCacheKey({ activePreset, analysis, pubChem: activePreset?.pubChem, atom, bond }),
    [activePreset, analysis, atom, bond]
  );
  const targetName = bond ? "selected bond" : atom ? `${atomData[atom.symbol].name} (${atom.symbol})` : "molecule";

  useEffect(() => {
    const cached = getCachedChemAiInsight(cacheKey);
    setInsight(cached);
    setFromCache(Boolean(cached));
    setStatus(cached ? "ready" : "idle");
    setMessage(cached ? "Loaded from local inspection cache." : "");
  }, [cacheKey]);

  const generate = async () => {
    setStatus("loading");
    setMessage("Checking cache, then asking DeepSeek only if needed...");
    try {
      const result = await fetchChemAiSelectionInsight({ cacheKey, activePreset, analysis, pubChem: activePreset?.pubChem, atom, bond });
      setInsight(result.insight);
      setFromCache(result.cached);
      setStatus("ready");
      setMessage(result.cached ? "Loaded from cache. No new request was spent." : "Generated with DeepSeek V4 Flash and cached for this selection.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "AI inspection notes are not available yet.");
    }
  };

  return (
    <div className="explanation mini-lesson inspection-ai-notes">
      <div className="inspection-ai-head">
        <strong><BrainCircuit size={14} /> AI inspection notes</strong>
        <span>{insight ? fromCache ? "cached" : "DeepSeek" : "optional"}</span>
      </div>
      {insight ? (
        <>
          <p>{insight.summary}</p>
          {insight.takeaways.length > 0 && (
            <ul>
              {insight.takeaways.slice(0, 3).map((item) => <li key={item}>{item}</li>)}
            </ul>
          )}
        </>
      ) : (
        <p>Ask DeepSeek to explain what the {targetName} contributes to this structure, using the local molecule graph and PubChem fields when available.</p>
      )}
      <button className="builder-button inspection-ai-button" type="button" disabled={status === "loading"} onClick={() => void generate()}>
        <WandSparkles size={15} />
        <span>{insight ? "Refresh note" : "Generate note"}</span>
      </button>
      <div className="source-line">
        <span>Powered by DeepSeek V4 Flash</span>
        <span>Cache-first</span>
      </div>
      {message && <p className={`builder-message ${status === "ready" ? "success" : status === "error" ? "error" : ""}`}>{message}</p>}
    </div>
  );
}

function valenceStatus(atom: AtomParticle, bonds: Bond[]) {
  const data = atomData[atom.symbol];
  const target = atom.symbol === "H" ? 2 : data.nobleGas ? data.valenceElectrons : data.metal ? data.valenceElectrons : 8;
  const bondOrder = bonds
    .filter((bond) => bond.a === atom.id || bond.b === atom.id)
    .reduce((sum, bond) => sum + (bond.kind === "ionic" ? Math.abs(atom.charge) : bond.kind === "coordinate" ? 1 : bond.order), 0);
  const fill = data.nobleGas ? target : data.metal ? Math.max(0, data.valenceElectrons - Math.max(0, atom.charge)) : Math.min(target, data.valenceElectrons + bondOrder);
  return { fill, target, percent: target ? (fill / target) * 100 : 100, complete: fill >= target };
}

function IsotopeEditorCard({
  atom,
  isotope,
  options,
  activityLevel,
  onSetAtomIsotope,
  onSetAtomNeutrons,
  onSetAtomProtons
}: {
  atom: AtomParticle;
  isotope: IsotopeRecord;
  options: IsotopeRecord[];
  activityLevel: IsotopeActivityLevel;
  onSetAtomIsotope?: (atomId: string, isotopeId: string) => void;
  onSetAtomNeutrons?: (atomId: string, neutronCount: number) => void;
  onSetAtomProtons?: (atomId: string, protonCount: number) => void;
}) {
  const optionList = options.some((item) => item.id === isotope.id) ? options : [...options, isotope].sort((a, b) => a.massNumber - b.massNumber);
  const branches = isotope.decayBranches.length
    ? isotope.decayBranches.map((branch) => `${formatDecayMode(branch.mode)}${branch.daughter ? ` to ${branch.daughter.symbol}-${branch.daughter.massNumber}` : ""}`).join(", ")
    : "No decay branch";
  const abundance = isotope.naturalAbundance === undefined ? "not listed" : `${isotope.naturalAbundance}%`;
  const sourceLabel = isotope.source === "local estimate" ? "Local estimate" : isotope.source;

  return (
    <div className={`isotope-card isotope-${activityLevel}`}>
      <div className="isotope-card-head">
        <div>
          <strong>Isotope</strong>
          <p>{isotope.label} - {isotope.stable ? "stable" : "radioactive"}</p>
        </div>
        <span>{sourceLabel}</span>
      </div>
      <label className="isotope-select">
        <span>Known isotope</span>
        <select value={isotope.id} onChange={(event) => onSetAtomIsotope?.(atom.id, event.target.value)}>
          {optionList.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}{option.stable ? " stable" : ` ${option.halfLifeLabel ?? "radioactive"}`}
            </option>
          ))}
        </select>
      </label>
      <dl className="fact-grid compact-facts">
        <dt>Protons</dt><dd>{isotope.atomicNumber}</dd>
        <dt>Neutrons</dt><dd>{isotope.neutronCount}</dd>
        <dt>Mass number</dt><dd>{isotope.massNumber}</dd>
        <dt>Half-life</dt><dd>{isotope.halfLifeLabel ?? "not available"}</dd>
        <dt>Abundance</dt><dd>{abundance}</dd>
        <dt>Decay</dt><dd>{branches}</dd>
      </dl>
      <div className="isotope-edit-row">
        <div>
          <span>Neutrons</span>
          <button type="button" onClick={() => onSetAtomNeutrons?.(atom.id, isotope.neutronCount - 1)}>-</button>
          <button type="button" onClick={() => onSetAtomNeutrons?.(atom.id, isotope.neutronCount + 1)}>+</button>
        </div>
        <div>
          <span>Protons</span>
          <button type="button" onClick={() => onSetAtomProtons?.(atom.id, isotope.atomicNumber - 1)} disabled={isotope.atomicNumber <= 1}>-</button>
          <button type="button" onClick={() => onSetAtomProtons?.(atom.id, isotope.atomicNumber + 1)} disabled={isotope.atomicNumber >= 118}>+</button>
        </div>
      </div>
      <p className="isotope-note">
        Neutrons change isotope mass. Protons change element identity.
      </p>
    </div>
  );
}

function InspectionAtomModel({ atom }: { atom: AtomDefinition }) {
  const shells = shellsForAtom(atom.symbol);
  const shellCount = Math.max(1, shells.length);
  const maxRadius = shellCount >= 6 ? 70 : 68;
  const minRadius = shellCount === 1 ? 46 : shellCount >= 6 ? 31 : 36;
  const radiusStep = shellCount > 1 ? (maxRadius - minRadius) / (shellCount - 1) : 0;
  const activeShells = shells.map((count, index) => ({
    n: index + 1,
    count,
    radius: shellCount === 1 ? 43 : minRadius + radiusStep * index
  }));
  const electronRadius = shellCount >= 6 ? 1.75 : shellCount >= 4 ? 2.05 : 2.45;

  return (
    <div className="inspection-shell-model" aria-label={`${atom.name} atom model with ${activeShells.length} shell${activeShells.length === 1 ? "" : "s"}`}>
      <svg viewBox="0 0 180 180" role="img" aria-hidden="true">
        <defs>
          <radialGradient id={`nucleus-${atom.symbol}`} cx="36%" cy="28%" r="68%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.86" />
            <stop offset="34%" stopColor={atom.color} stopOpacity="0.78" />
            <stop offset="100%" stopColor={atom.color} stopOpacity="0.28" />
          </radialGradient>
        </defs>
        {activeShells.map((shell) => (
          <g key={`shell-${shell.n}`}>
            <circle className="inspection-shell-ring" cx="90" cy="90" r={shell.radius} />
            <g
              className="inspection-shell-electrons"
              style={{
                "--spin-duration": `${10 + shell.n * 3.4}s`,
                "--spin-delay": `${shell.n * -0.58}s`
              } as CSSProperties}
            >
              {Array.from({ length: shell.count }, (_, electronIndex) => {
                const angle = Math.PI * 2 * electronIndex / Math.max(1, shell.count);
                const jitter = shell.count > 12 ? Math.sin(electronIndex * 1.7) * 0.9 : 0;
                const x = 90 + Math.cos(angle) * (shell.radius + jitter);
                const y = 90 + Math.sin(angle) * (shell.radius + jitter);
                return <circle key={`e-${shell.n}-${electronIndex}`} className="inspection-electron-dot" cx={x} cy={y} r={electronRadius} />;
              })}
            </g>
          </g>
        ))}
        <circle className="inspection-nucleus-glow" cx="90" cy="90" r="27" fill={atom.glow} />
        <circle className="inspection-nucleus" cx="90" cy="90" r="19" fill={`url(#nucleus-${atom.symbol})`} />
        <text className="inspection-nucleus-symbol" x="90" y="96">{atom.symbol}</text>
      </svg>
      <span>{activeShells.map((shell) => shell.count).join("-")}</span>
    </div>
  );
}

function shellsForAtom(symbol: AtomSymbol) {
  const periodicShells = periodicBySymbol.get(symbol)?.shells?.filter((count) => count > 0);
  if (periodicShells?.length) return periodicShells;
  return shellCountsFromAtomicNumber(atomData[symbol].atomicNumber);
}

function shellCountsFromAtomicNumber(atomicNumber: number) {
  const capacities = [2, 8, 18, 32, 32, 18, 8];
  let remaining = atomicNumber;
  const shells: number[] = [];
  for (const capacity of capacities) {
    if (remaining <= 0) break;
    const count = Math.min(capacity, remaining);
    shells.push(count);
    remaining -= count;
  }
  return shells.length ? shells : [1];
}

function formulaFromAtoms(atoms: AtomParticle[]) {
  const counts = atoms.reduce<Record<string, number>>((acc, item) => {
    acc[item.symbol] = (acc[item.symbol] ?? 0) + 1;
    return acc;
  }, {});
  return formatCounts(counts, true);
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
  const valenceCheck = bond.kind === "ionic" ? "electron transfer is favored" : bond.kind === "coordinate" ? "a ligand lone pair donates toward a metal coordination site" : `${bond.order} shared electron pair${bond.order > 1 ? "s" : ""} fit the open valence slots`;
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

function geigerReading(level: IsotopeActivityLevel) {
  if (level === "extreme") return { dose: "28 µSv/h", cpm: "5200 CPM", needleRest: "28deg", needlePeak: "74deg" };
  if (level === "high") return { dose: "4.5 µSv/h", cpm: "1200 CPM", needleRest: "4deg", needlePeak: "54deg" };
  if (level === "medium") return { dose: "0.8 µSv/h", cpm: "260 CPM", needleRest: "-24deg", needlePeak: "22deg" };
  return { dose: "0.08 µSv/h", cpm: "24 CPM", needleRest: "-48deg", needlePeak: "-24deg" };
}

type GeigerAudio = {
  start: () => void;
  stop: () => void;
};

function createGeigerAudio(level: IsotopeActivityLevel): GeigerAudio {
  let context: AudioContext | null = null;
  let timer: number | null = null;
  let master: GainNode | null = null;
  let hiss: AudioBufferSourceNode | null = null;
  let stopped = false;
  const profile = geigerProfile(level);

  const click = (offset = 0) => {
    if (!context || !master || stopped) return;
    const now = context.currentTime + offset;
    const duration = 0.018 + profile.grit * 0.012;
    const noise = context.createBufferSource();
    const buffer = context.createBuffer(1, Math.max(1, Math.floor(context.sampleRate * duration)), context.sampleRate);
    const channel = buffer.getChannelData(0);
    for (let i = 0; i < channel.length; i += 1) {
      const t = i / channel.length;
      const attack = Math.min(1, t / 0.08);
      const decay = Math.pow(1 - t, 4.2);
      channel[i] = (Math.random() * 2 - 1) * attack * decay;
    }
    noise.buffer = buffer;

    const highpass = context.createBiquadFilter();
    highpass.type = "highpass";
    highpass.frequency.value = 180 + profile.grit * 140;

    const bandpass = context.createBiquadFilter();
    bandpass.type = "bandpass";
    bandpass.frequency.value = 650 + profile.grit * 520 + Math.random() * 160;
    bandpass.Q.value = 5 + profile.grit * 5;

    const shaper = context.createWaveShaper();
    shaper.curve = distortionCurve(16 + profile.grit * 95);
    shaper.oversample = "2x";

    const gain = context.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(profile.volume, now + 0.0016);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    const snap = context.createOscillator();
    const snapGain = context.createGain();
    snap.type = "triangle";
    snap.frequency.setValueAtTime(520 + profile.grit * 260 + Math.random() * 120, now);
    snapGain.gain.setValueAtTime(0.0001, now);
    snapGain.gain.exponentialRampToValueAtTime(profile.volume * 0.72, now + 0.002);
    snapGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.024);

    const body = context.createOscillator();
    const bodyGain = context.createGain();
    body.type = "sine";
    body.frequency.setValueAtTime(170 + Math.random() * 36 + profile.grit * 70, now);
    body.frequency.exponentialRampToValueAtTime(88 + Math.random() * 18, now + 0.052);
    bodyGain.gain.setValueAtTime(0.0001, now);
    bodyGain.gain.exponentialRampToValueAtTime(profile.volume * 0.58, now + 0.003);
    bodyGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.062);

    const edge = context.createOscillator();
    const edgeGain = context.createGain();
    edge.type = "square";
    edge.frequency.setValueAtTime(1900 + profile.grit * 900 + Math.random() * 300, now);
    edgeGain.gain.setValueAtTime(0.0001, now);
    edgeGain.gain.exponentialRampToValueAtTime(profile.volume * 0.12, now + 0.0008);
    edgeGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.006);

    const staticBurst = context.createBufferSource();
    const staticDuration = 0.026 + profile.grit * 0.014;
    const staticBuffer = context.createBuffer(1, Math.max(1, Math.floor(context.sampleRate * staticDuration)), context.sampleRate);
    const staticData = staticBuffer.getChannelData(0);
    for (let i = 0; i < staticData.length; i += 1) {
      const t = i / staticData.length;
      const crackle = Math.random() * 2 - 1;
      const pepper = Math.random() > 0.86 ? (Math.random() * 2 - 1) * 0.9 : 0;
      staticData[i] = (crackle * 0.45 + pepper) * Math.pow(1 - t, 2.7);
    }
    staticBurst.buffer = staticBuffer;
    const staticFilter = context.createBiquadFilter();
    staticFilter.type = "bandpass";
    staticFilter.frequency.value = 950 + profile.grit * 950 + Math.random() * 240;
    staticFilter.Q.value = 2.4 + profile.grit * 2.6;
    const staticGain = context.createGain();
    staticGain.gain.setValueAtTime(0.0001, now);
    staticGain.gain.exponentialRampToValueAtTime(profile.volume * 0.28, now + 0.001);
    staticGain.gain.exponentialRampToValueAtTime(0.0001, now + staticDuration);

    noise.connect(highpass);
    highpass.connect(bandpass);
    bandpass.connect(shaper);
    shaper.connect(gain);
    gain.connect(master);
    snap.connect(snapGain);
    snapGain.connect(master);
    body.connect(bodyGain);
    bodyGain.connect(master);
    edge.connect(edgeGain);
    edgeGain.connect(master);
    staticBurst.connect(staticFilter);
    staticFilter.connect(staticGain);
    staticGain.connect(master);
    noise.start(now);
    noise.stop(now + duration + 0.01);
    snap.start(now);
    snap.stop(now + 0.014);
    body.start(now);
    body.stop(now + 0.07);
    edge.start(now);
    edge.stop(now + 0.008);
    staticBurst.start(now);
    staticBurst.stop(now + staticDuration + 0.006);
  };

  const scheduleNext = () => {
    if (stopped) return;
    click();
    if (Math.random() < profile.doubleChance) click(0.028 + Math.random() * 0.04);
    const jitter = -Math.log(Math.max(0.04, Math.random()));
    timer = window.setTimeout(scheduleNext, Math.max(profile.deadTimeMs, profile.intervalMs * jitter));
  };

  return {
    start: () => {
      try {
        context = new window.AudioContext();
        master = context.createGain();
        master.gain.value = 0.72;
        master.connect(context.destination);
        hiss = createCounterHiss(context, profile);
        hiss.connect(master);
        hiss.start();
        void context.resume().then(() => scheduleNext()).catch(() => undefined);
      } catch {
        stopped = true;
      }
    },
    stop: () => {
      stopped = true;
      if (timer !== null) window.clearTimeout(timer);
      timer = null;
      try {
        hiss?.stop();
      } catch {
        // Hiss may already be stopped by context close.
      }
      hiss = null;
      if (context) void context.close().catch(() => undefined);
      context = null;
      master = null;
    }
  };
}

function geigerProfile(level: IsotopeActivityLevel) {
  if (level === "extreme") return { intervalMs: 72, deadTimeMs: 32, doubleChance: 0.34, grit: 1, volume: 0.064, hiss: 0.008 };
  if (level === "high") return { intervalMs: 135, deadTimeMs: 42, doubleChance: 0.2, grit: 0.72, volume: 0.052, hiss: 0.005 };
  if (level === "medium") return { intervalMs: 310, deadTimeMs: 70, doubleChance: 0.08, grit: 0.38, volume: 0.04, hiss: 0.003 };
  if (level === "none") return { intervalMs: 2000, deadTimeMs: 500, doubleChance: 0, grit: 0, volume: 0, hiss: 0 };
  return { intervalMs: 760, deadTimeMs: 110, doubleChance: 0.02, grit: 0.14, volume: 0.03, hiss: 0.0015 };
}

function createCounterHiss(context: AudioContext, profile: ReturnType<typeof geigerProfile>) {
  const source = context.createBufferSource();
  const seconds = 1.2;
  const buffer = context.createBuffer(1, Math.floor(context.sampleRate * seconds), context.sampleRate);
  const data = buffer.getChannelData(0);
  let last = 0;
  for (let i = 0; i < data.length; i += 1) {
    const white = Math.random() * 2 - 1;
    last = last * 0.92 + white * 0.08;
    data[i] = last * profile.hiss;
  }
  source.buffer = buffer;
  source.loop = true;
  return source;
}

function distortionCurve(amount: number) {
  const samples = 256;
  const curve = new Float32Array(samples);
  const deg = Math.PI / 180;
  for (let i = 0; i < samples; i += 1) {
    const x = i * 2 / samples - 1;
    curve[i] = (3 + amount) * x * 20 * deg / (Math.PI + amount * Math.abs(x));
  }
  return curve;
}
