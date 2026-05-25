import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Activity, AlertTriangle, ArrowRightLeft, CheckCircle2, FlaskConical, History, Minus, MousePointer2, Plus, RotateCcw, RotateCw, Scissors, XCircle, Zap } from "lucide-react";
import { atomData } from "../data/atoms";
import { structuralBonds } from "../simulation/graph";
import { implementedReactionFamilies, reactionFamilies } from "../simulation/reactionRegistry";
import type { AtomParticle, Bond, ChemistryInspectTarget, ElectronSource, ElectronTarget, MechanismGesture, ReactionAction, ReactionActionType, ReactionHistoryEntry, ReactionPreview, ReactionStep, SimulationSettings, SimulationState, TimeDisplayMode } from "../types";
import { formatSimulationTime } from "../utils/timeFormat";

type BuilderProps = {
  state: SimulationState;
  preview: ReactionPreview | null;
  steps: ReactionStep[];
  settings: SimulationSettings;
  electronSources: ElectronSource[];
  electronTargets: ElectronTarget[];
  selectedElectronSourceId: string | null;
  selectedElectronTargetId: string | null;
  onPreview: (action: ReactionAction) => void;
  onCommit: (action: ReactionAction) => void;
  onPreviewMechanism: (gesture: MechanismGesture) => void;
  onCommitMechanism: (gesture: MechanismGesture) => void;
  onClear: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onSetting: <K extends keyof SimulationSettings>(key: K, value: SimulationSettings[K]) => void;
  onSourceSelect: (id: string | null) => void;
  onTargetSelect: (id: string | null) => void;
  onInspectTarget: (target: ChemistryInspectTarget) => void;
  canUndo: boolean;
  canRedo: boolean;
};

type TimelineProps = {
  pastEntries: ReactionHistoryEntry[];
  futureEntries: ReactionHistoryEntry[];
  timeDisplayMode: TimeDisplayMode;
  onInspectTarget: (target: ChemistryInspectTarget) => void;
  onJumpToTime: (targetId: string | "start") => void;
};

const actionMeta: Array<{ type: ReactionActionType; label: string; short: string; icon: ReactNode }> = [
  { type: "form-bond", label: "Form bond", short: "Form", icon: <Plus size={15} /> },
  { type: "break-bond", label: "Break bond", short: "Break", icon: <Scissors size={15} /> },
  { type: "increase-bond-order", label: "Increase order", short: "+ order", icon: <Plus size={15} /> },
  { type: "decrease-bond-order", label: "Decrease order", short: "- order", icon: <Minus size={15} /> },
  { type: "protonate", label: "Protonate", short: "H+", icon: <Zap size={15} /> },
  { type: "deprotonate", label: "Deprotonate", short: "H-", icon: <Minus size={15} /> },
  { type: "nucleophile-attack", label: "Nucleophile attack", short: "Attack", icon: <ArrowRightLeft size={15} /> }
];

const atomPairActions = new Set<ReactionActionType>(["form-bond", "nucleophile-attack"]);
const bondActions = new Set<ReactionActionType>(["break-bond", "increase-bond-order", "decrease-bond-order"]);

export function ReactionBuilder({
  state,
  preview,
  steps,
  settings,
  electronSources,
  electronTargets,
  selectedElectronSourceId,
  selectedElectronTargetId,
  onPreview,
  onCommit,
  onPreviewMechanism,
  onCommitMechanism,
  onClear,
  onUndo,
  onRedo,
  onSetting,
  onSourceSelect,
  onTargetSelect,
  onInspectTarget,
  canUndo,
  canRedo
}: BuilderProps) {
  const atomOptions = useMemo(() => state.atoms.map((atom, index) => ({ atom, label: atomLabel(atom, index) })), [state.atoms]);
  const bondOptions = useMemo(() => structuralBonds(state.bonds), [state.bonds]);
  const [actionType, setActionType] = useState<ReactionActionType>("form-bond");
  const [atomAId, setAtomAId] = useState("");
  const [atomBId, setAtomBId] = useState("");
  const [bondId, setBondId] = useState("");

  const currentGesture = useMemo<MechanismGesture | null>(() => {
    if (!selectedElectronSourceId || !selectedElectronTargetId) return null;
    return {
      id: `gesture-${selectedElectronSourceId}-${selectedElectronTargetId}`,
      sourceId: selectedElectronSourceId,
      targetId: selectedElectronTargetId,
      mode: "click"
    };
  }, [selectedElectronSourceId, selectedElectronTargetId]);

  useEffect(() => {
    if (state.selectedAtomId) setAtomAId(state.selectedAtomId);
    if (state.selectedBondId) setBondId(state.selectedBondId);
  }, [state.selectedAtomId, state.selectedBondId]);

  useEffect(() => {
    if (!atomAId && atomOptions[0]) setAtomAId(atomOptions[0].atom.id);
    if ((!atomBId || atomBId === atomAId) && atomOptions[1]) setAtomBId(atomOptions[1].atom.id);
    if (!bondId && bondOptions[0]) setBondId(bondOptions[0].id);
  }, [atomAId, atomBId, atomOptions, bondId, bondOptions]);

  const currentAction = useMemo(() => {
    if (atomPairActions.has(actionType)) {
      if (!atomAId || !atomBId || atomAId === atomBId) return null;
      return { type: actionType, atomIds: [atomAId, atomBId] };
    }
    if (bondActions.has(actionType)) {
      if (!bondId) return null;
      return { type: actionType, bondId };
    }
    if (actionType === "protonate") {
      if (!atomAId) return null;
      return { type: actionType, atomIds: [atomAId] };
    }
    if (actionType === "deprotonate") {
      if (bondId) return { type: actionType, bondId, atomIds: atomAId ? [atomAId] : undefined };
      if (!atomAId) return null;
      return { type: actionType, atomIds: [atomAId] };
    }
    return null;
  }, [actionType, atomAId, atomBId, bondId]);

  useEffect(() => {
    if (currentGesture) {
      onPreviewMechanism(currentGesture);
      return;
    }
    if (!currentAction) {
      onClear();
      return;
    }
    onPreview(currentAction);
  }, [currentAction, currentGesture, onClear, onPreview, onPreviewMechanism]);

  const selectedBond = bondOptions.find((bond) => bond.id === bondId);
  const scoreDelta = preview?.scoreAfter ? preview.scoreAfter.relativeStability - preview.scoreBefore.relativeStability : null;
  const canCommit = Boolean((currentGesture || currentAction) && preview?.allowed);

  return (
    <section className="reaction-builder chem-lab-card">
      <div className="chem-card-header">
        <h3><FlaskConical size={16} /> Reaction Builder</h3>
        <span>{implementedReactionFamilies.length}/{reactionFamilies.length} families live</span>
      </div>

      <div className="reaction-mode-row" aria-label="Reaction interaction mode">
        <button
          type="button"
          className={settings.reactionToolMode === "beginner" ? "active" : ""}
          title="Beginner mode shows fewer handles and keeps confirmation explicit."
          onClick={() => onSetting("reactionToolMode", "beginner")}
        >
          <MousePointer2 size={14} />
          <span>Beginner</span>
        </button>
        <button
          type="button"
          className={settings.reactionToolMode === "advanced" ? "active" : ""}
          title="Advanced mode keeps more electron handles and shortcuts visible."
          onClick={() => onSetting("reactionToolMode", "advanced")}
        >
          <Zap size={14} />
          <span>Advanced</span>
        </button>
        <button
          type="button"
          className={settings.directReactionMode ? "active" : ""}
          title="Direct editing previews bond forming, breaking, and order changes from the viewport."
          onClick={() => onSetting("directReactionMode", !settings.directReactionMode)}
        >
          <Activity size={14} />
          <span>Direct edit</span>
        </button>
        <button
          type="button"
          className={settings.showMechanismHandles ? "active" : ""}
          title="Show or hide electron handles in the viewport."
          onClick={() => onSetting("showMechanismHandles", !settings.showMechanismHandles)}
        >
          <MousePointer2 size={14} />
          <span>Handles</span>
        </button>
      </div>

      <div className="electron-route-grid">
        <SelectField
          label="Electron source"
          value={selectedElectronSourceId ?? ""}
          onChange={(id) => onSourceSelect(id || null)}
          options={[{ value: "", label: "Choose source" }, ...electronSources.map((source) => ({ value: source.id, label: `${source.label} - ${source.kind}` }))]}
        />
        <SelectField
          label="Electron target"
          value={selectedElectronTargetId ?? ""}
          onChange={(id) => onTargetSelect(id || null)}
          options={[{ value: "", label: "Choose target" }, ...electronTargets.map((target) => ({ value: target.id, label: `${target.label} - ${target.kind}` }))]}
        />
      </div>

      <div className="reaction-action-grid" aria-label="Reaction shortcuts">
        {actionMeta.map((action) => (
          <button
            key={action.type}
            type="button"
            className={actionType === action.type && !currentGesture ? "active" : ""}
            title={shortcutTitle(action.type)}
            onClick={() => {
              onSourceSelect(null);
              onTargetSelect(null);
              setActionType(action.type);
            }}
          >
            {action.icon}
            <span>{action.short}</span>
          </button>
        ))}
      </div>

      <div className="reaction-target-grid">
        {atomPairActions.has(actionType) && (
          <>
            <SelectField label={actionType === "nucleophile-attack" ? "Source atom" : "Atom A"} value={atomAId} onChange={setAtomAId} options={atomOptions.map(({ atom, label }) => ({ value: atom.id, label }))} />
            <SelectField label={actionType === "nucleophile-attack" ? "Target atom" : "Atom B"} value={atomBId} onChange={setAtomBId} options={atomOptions.map(({ atom, label }) => ({ value: atom.id, label }))} />
          </>
        )}
        {bondActions.has(actionType) && (
          <SelectField label="Bond" value={bondId} onChange={setBondId} options={bondOptions.map((bond) => ({ value: bond.id, label: bondLabel(bond, state.atoms) }))} />
        )}
        {actionType === "protonate" && (
          <SelectField label="Target atom" value={atomAId} onChange={setAtomAId} options={atomOptions.map(({ atom, label }) => ({ value: atom.id, label }))} />
        )}
        {actionType === "deprotonate" && (
          <>
            <SelectField label="X-H bond" value={bondId} onChange={setBondId} options={[{ value: "", label: "Auto from atom" }, ...bondOptions.map((bond) => ({ value: bond.id, label: bondLabel(bond, state.atoms) }))]} />
            <SelectField label="Heavy atom" value={atomAId} onChange={setAtomAId} options={atomOptions.map(({ atom, label }) => ({ value: atom.id, label }))} />
          </>
        )}
      </div>

      <div className={`reaction-preview-card ${preview?.allowed ? "allowed" : "blocked"}`}>
        <div className="reaction-preview-status">
          {preview?.allowed ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
          <strong>{preview?.message || "Choose an electron source and target to preview movement."}</strong>
        </div>
        <p>{preview?.explanation || "Drag or select a lone pair, pi bond, sigma bond, or charged site, then choose where those electrons should move."}</p>
        {preview?.warnings.length ? (
          <ul>
            {preview.warnings.map((warning) => <li key={warning}>{warning}</li>)}
          </ul>
        ) : null}
        {preview && (
          <div className="reaction-score-strip">
            <button type="button" onClick={() => onInspectTarget({ atomIds: preview.affectedAtomIds, bondIds: preview.affectedBondIds, selectBondId: preview.affectedBondIds[0] ?? selectedBond?.id ?? null, selectAtomId: preview.affectedAtomIds[0] ?? null })}>
              <Activity size={14} />
              <span>Highlight center</span>
            </button>
            <span>Stability {preview.scoreAfter ? `${preview.scoreAfter.relativeStability.toFixed(0)}%` : `${preview.scoreBefore.relativeStability.toFixed(0)}%`}</span>
            <span className={scoreDelta === null ? "" : scoreDelta >= 0 ? "positive" : "negative"}>{scoreDelta === null ? "Delta -" : `${scoreDelta >= 0 ? "+" : ""}${scoreDelta.toFixed(1)}`}</span>
          </div>
        )}
        {preview?.formalChargeDeltas?.length || preview?.bondOrderDeltas?.length || preview?.hybridizationDeltas?.length ? (
          <div className="reaction-delta-grid">
            {preview.formalChargeDeltas?.map((delta) => <DeltaPill key={`${delta.atomId}-${delta.label}`} label={delta.label} value={`${delta.before} -> ${delta.after}`} />)}
            {preview.bondOrderDeltas?.map((delta) => <DeltaPill key={`${delta.bondId}-${delta.label}`} label={delta.label} value={`${delta.before} -> ${delta.after}`} />)}
            {preview.hybridizationDeltas?.map((delta) => <DeltaPill key={`${delta.atomId}-${delta.label}`} label={delta.label} value={`${delta.before} -> ${delta.after}`} />)}
          </div>
        ) : null}
        {preview?.stabilityReasons?.length ? (
          <ul className="reaction-reason-list">
            {preview.stabilityReasons.slice(0, 4).map((reason) => <li key={reason}>{reason}</li>)}
          </ul>
        ) : null}
      </div>

      <div className="reaction-builder-actions">
        <button className="builder-button" type="button" disabled={!canCommit} onClick={() => currentGesture ? onCommitMechanism(currentGesture) : currentAction && onCommit(currentAction)}>
          <CheckCircle2 size={16} />
          <span>Commit step</span>
        </button>
        <button className="builder-button subtle" type="button" onClick={onClear}>
          <XCircle size={16} />
          <span>Clear preview</span>
        </button>
        <button className="builder-button subtle" type="button" disabled={!canUndo} onClick={onUndo} title="Undo the last committed reaction step.">
          <RotateCcw size={16} />
          <span>Undo</span>
        </button>
        <button className="builder-button subtle" type="button" disabled={!canRedo} onClick={onRedo} title="Redo the last undone reaction step.">
          <RotateCw size={16} />
          <span>Redo</span>
        </button>
      </div>
    </section>
  );
}

export function ReactionTimeline({ pastEntries, futureEntries, timeDisplayMode, onInspectTarget, onJumpToTime }: TimelineProps) {
  const activeEntries = [...pastEntries].reverse();
  const futureRows = [...futureEntries];
  const hasEntries = activeEntries.length + futureRows.length > 0;
  const currentEntryId = pastEntries[0]?.id ?? null;

  return (
    <section className="reaction-timeline chem-lab-card">
      <div className="chem-card-header">
        <h3><History size={16} /> Reaction Timeline</h3>
        <span>{hasEntries ? `${activeEntries.length}/${activeEntries.length + futureRows.length} active` : "empty"}</span>
      </div>
      {hasEntries ? (
        <div className="reaction-step-list">
          <div className={`reaction-step-row start ${activeEntries.length ? "" : "current"}`}>
            <button type="button" className="reaction-time-chip" onClick={() => onJumpToTime("start")}>
              T+{formatSimulationTime(activeEntries[0]?.before.time ?? futureRows[0]?.before.time ?? 0, timeDisplayMode)}
            </button>
            <div className="reaction-step-body static">
              <span>0</span>
              <div>
                <strong>Start</strong>
                <small>Initial molecule state</small>
              </div>
            </div>
          </div>
          {activeEntries.map((entry, index) => (
            <TimelineRow
              key={entry.id}
              entry={entry}
              index={index + 1}
              current={entry.id === currentEntryId}
              future={false}
              timeDisplayMode={timeDisplayMode}
              onInspectTarget={onInspectTarget}
              onJumpToTime={onJumpToTime}
            />
          ))}
          {futureRows.map((entry, index) => (
            <TimelineRow
              key={entry.id}
              entry={entry}
              index={activeEntries.length + index + 1}
              current={false}
              future
              timeDisplayMode={timeDisplayMode}
              onInspectTarget={onInspectTarget}
              onJumpToTime={onJumpToTime}
            />
          ))}
        </div>
      ) : (
        <p className="chemistry-empty"><AlertTriangle size={15} /> Commit a previewed electron move to record intermediates and before/after formulas.</p>
      )}
    </section>
  );
}

function TimelineRow({ entry, index, current, future, timeDisplayMode, onInspectTarget, onJumpToTime }: {
  entry: ReactionHistoryEntry;
  index: number;
  current: boolean;
  future: boolean;
  timeDisplayMode: TimeDisplayMode;
  onInspectTarget: (target: ChemistryInspectTarget) => void;
  onJumpToTime: (targetId: string) => void;
}) {
  const step = entry.step;
  return (
    <div className={`reaction-step-row ${future ? "future" : ""} ${current ? "current" : ""}`}>
      <button type="button" className="reaction-time-chip" onClick={() => onJumpToTime(entry.id)}>
        T+{formatSimulationTime(step.simTime, timeDisplayMode)}
      </button>
      <button
        type="button"
        className="reaction-step-body"
        onClick={() => onInspectTarget({ atomIds: step.affectedAtomIds, bondIds: step.affectedBondIds, selectAtomId: step.affectedAtomIds[0] ?? null, selectBondId: step.affectedBondIds[0] ?? null })}
      >
        <span>{index}</span>
        <div>
          <strong>{stepTitle(step.action.type)}{future ? " (redo)" : ""}</strong>
          <small>{step.beforeFormula}{" -> "}{step.afterFormula} - {step.scoreDelta >= 0 ? "+" : ""}{step.scoreDelta.toFixed(1)} stability</small>
          <p>{step.explanation}</p>
          {step.stabilityReasons?.length ? <small>{step.stabilityReasons[0]}</small> : null}
        </div>
      </button>
    </div>
  );
}

function SelectField({ label, value, options, onChange }: { label: string; value: string; options: Array<{ value: string; label: string }>; onChange: (value: string) => void }) {
  return (
    <label className="reaction-select-field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.length ? options.map((option) => <option key={`${option.value}-${option.label}`} value={option.value}>{option.label}</option>) : <option value="">No targets</option>}
      </select>
    </label>
  );
}

function DeltaPill({ label, value }: { label: string; value: string }) {
  return (
    <span>
      <strong>{label}</strong>
      {value}
    </span>
  );
}

function atomLabel(atom: AtomParticle, index: number) {
  return `${index + 1}. ${atomData[atom.symbol].name} (${atom.symbol})${atom.charge ? ` ${atom.charge > 0 ? "+" : ""}${atom.charge}` : ""}`;
}

function bondLabel(bond: Bond, atoms: AtomParticle[]) {
  const a = atoms.find((atom) => atom.id === bond.a);
  const b = atoms.find((atom) => atom.id === bond.b);
  const left = a ? atomData[a.symbol].symbol : bond.a.slice(0, 4);
  const right = b ? atomData[b.symbol].symbol : bond.b.slice(0, 4);
  return `${left}-${right} - order ${bond.order}`;
}

function stepTitle(type: ReactionActionType) {
  return actionMeta.find((action) => action.type === type)?.label ?? "Reaction step";
}

function shortcutTitle(type: ReactionActionType) {
  const titles: Record<ReactionActionType, string> = {
    "form-bond": "Shortcut: use selected atoms to preview a new bond.",
    "break-bond": "Shortcut: use the selected bond to preview sigma bond breaking.",
    "increase-bond-order": "Shortcut: add one shared electron pair to a covalent bond.",
    "decrease-bond-order": "Shortcut: remove one pi/shared pair from a covalent bond.",
    protonate: "Shortcut: route a lone pair toward H+ and add an X-H bond.",
    deprotonate: "Shortcut: remove H+ from an X-H bond and leave the pair behind.",
    "nucleophile-attack": "Shortcut: source atom donates an electron pair toward an electron-poor atom."
  };
  return titles[type];
}
