import { useEffect, useRef } from "react";
import { BadgeInfo, Orbit, Zap } from "lucide-react";
import type { CSSProperties } from "react";
import { atomData } from "../data/atoms";
import { elementDetails } from "../data/elementDetails";
import { radioactivityInfo, radioactiveLike, type RadioactivityInfo } from "../data/radioactivity";
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
  const audioRef = useRef<GeigerAudio | null>(null);
  const selectedAtom = atom ? atomData[atom.symbol] : null;
  const elementDetail = atom ? elementDetails[atom.symbol] : null;
  const radioactive = atom && selectedAtom && radioactiveLike(atom.symbol, selectedAtom.atomicNumber) ? radioactivityInfo[atom.symbol] ?? null : null;
  const latest = events[0];
  const valence = atom ? valenceStatus(atom, bonds) : null;
  const stretch = bond ? bondStretchStatus(bond, atoms) : atom ? strongestStretchForAtom(atom, bonds, atoms) : null;
  const why = bond ? bondReason(bond, atoms) : latest?.science;
  const geometry = atom ? analyzeAtomGeometry(atom, atoms, bonds) : null;
  const resonance = resonanceHint(molecule.length ? molecule : atoms, bonds);
  const geiger = radioactive ? geigerReading(radioactive.activityLevel) : null;
  const moleculeFormula = molecule.length
    ? formulaFromAtoms(molecule)
    : activePreset?.formula ?? "No molecule selected";

  useEffect(() => {
    if (!radioactive) {
      audioRef.current?.stop();
      audioRef.current = null;
      return;
    }
    audioRef.current?.stop();
    const geigerAudio = createGeigerAudio(radioactive.activityLevel);
    audioRef.current = geigerAudio;
    geigerAudio.start();
    return () => {
      geigerAudio.stop();
      if (audioRef.current === geigerAudio) audioRef.current = null;
    };
  }, [radioactive?.activityLevel, atom?.id]);

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
            {elementDetail && (
              <div className="explanation mini-lesson atom-summary">
                <strong>{selectedAtom.name} summary</strong>
                <p>{elementDetail.description} {elementDetail.discoveryYear === "Ancient" ? "It has been known since antiquity." : `It was found in ${elementDetail.discoveryYear}.`}</p>
              </div>
            )}
            {radioactive && (
              <div className={`geiger-card ${radioactive.activityLevel}`}>
                <div className="geiger-head">
                  <strong>Geiger counter</strong>
                  <span>{radioactive.activityLevel}</span>
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
                  <dt>Reference isotope</dt><dd>{radioactive.isotope}</dd>
                  <dt>Half-life</dt><dd>{radioactive.halfLife}</dd>
                </dl>
                <p>{radioactive.note}</p>
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

function geigerReading(level: RadioactivityInfo["activityLevel"]) {
  if (level === "extreme") return { dose: "28 µSv/h", cpm: "5200 CPM", needleRest: "28deg", needlePeak: "74deg" };
  if (level === "high") return { dose: "4.5 µSv/h", cpm: "1200 CPM", needleRest: "4deg", needlePeak: "54deg" };
  if (level === "medium") return { dose: "0.8 µSv/h", cpm: "260 CPM", needleRest: "-24deg", needlePeak: "22deg" };
  return { dose: "0.08 µSv/h", cpm: "24 CPM", needleRest: "-48deg", needlePeak: "-24deg" };
}

type GeigerAudio = {
  start: () => void;
  stop: () => void;
};

function createGeigerAudio(level: RadioactivityInfo["activityLevel"]): GeigerAudio {
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

function geigerProfile(level: "low" | "medium" | "high" | "extreme") {
  if (level === "extreme") return { intervalMs: 72, deadTimeMs: 32, doubleChance: 0.34, grit: 1, volume: 0.064, hiss: 0.008 };
  if (level === "high") return { intervalMs: 135, deadTimeMs: 42, doubleChance: 0.2, grit: 0.72, volume: 0.052, hiss: 0.005 };
  if (level === "medium") return { intervalMs: 310, deadTimeMs: 70, doubleChance: 0.08, grit: 0.38, volume: 0.04, hiss: 0.003 };
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
