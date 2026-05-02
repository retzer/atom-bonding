import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { BookOpen, CheckCircle2, ChevronRight, Circle, FlaskConical, Lock, Search, Volume2, WandSparkles } from "lucide-react";
import { guidedLessons } from "../data/lessons";
import { moleculePresets } from "../data/presets";
import { fetchPubChemMolecule, fetchPubChemSuggestions } from "../data/pubchem";
import type { AppMode, AtomSymbol, GuidedLesson, LessonAnimationPart, LessonStep, LessonStepAnimation, MoleculePreset, QuizQuestion, ViewportAnnotation } from "../types";

type GlucoseAnomer = "alpha" | "beta";
type GlucoseStage = "idle" | "aldehyde" | "hemiacetal" | "ring";

type Props = {
  mode: AppMode;
  activePresetId?: string;
  canFormGlucoseRing: boolean;
  canSelectGlucoseAnomer: boolean;
  glucoseAnomer: GlucoseAnomer;
  glucoseStage: GlucoseStage;
  onFormGlucoseRing: (anomer?: GlucoseAnomer) => void;
  onGlucoseAnomer: (anomer: GlucoseAnomer) => void;
  onPreset: (id: string) => void;
  onMoleculePreset: (preset: MoleculePreset) => void;
  onSetLessonAnnotations?: (annotations: ViewportAnnotation[], highlightAtoms: string[], highlightBonds: string[], stepIdx: number, stepTxt?: string, total?: number, parts?: LessonAnimationPart[], reveal?: number) => void;
  onClearLesson?: () => void;
  addLessonAtom?: (symbol: AtomSymbol, x: number, y: number) => void;
  moveLessonAtom?: (index: number, x: number, y: number) => void;
  bondLessonAtoms?: (a: number, b: number) => void;
  addLessonParticles?: (from: number, to: number, count: number, color: string) => void;
  clearLessonAtoms?: () => void;
  onActiveLessonChange?: (lessonId: string | null) => void;
};

type PresetCategory = MoleculePreset["category"];

const presetFolders: Array<{ category: PresetCategory; title: string; description: string }> = [
  { category: "covalent", title: "Covalent molecules", description: "Shared electron pairs, polarity, geometry" },
  { category: "ionic", title: "Ionic compounds", description: "Electron transfer and ion attraction" },
  { category: "metallic", title: "Metallic lattices", description: "Positive ions with mobile electrons" },
  { category: "advanced", title: "Organic and resonance", description: "Functional groups, rings, mixed bonds" }
];

const STORAGE_KEY = "atom-bonding-progress-v2";

function loadProgress(): string[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]"); } catch { return []; }
}

function saveProgress(ids: string[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(ids)); } catch {}
}

export function LearningPanel({
  mode, activePresetId, canFormGlucoseRing, canSelectGlucoseAnomer, glucoseAnomer, glucoseStage,
  onFormGlucoseRing, onGlucoseAnomer, onPreset, onMoleculePreset, onSetLessonAnnotations, onClearLesson,
  addLessonAtom, moveLessonAtom, bondLessonAtoms, addLessonParticles, clearLessonAtoms, onActiveLessonChange
}: Props) {
  const [query, setQuery] = useState("");
  const [builderStatus, setBuilderStatus] = useState<"idle" | "loading" | "imported" | "missing">("idle");
  const [builderMessage, setBuilderMessage] = useState("");
  const [pubChemSuggestions, setPubChemSuggestions] = useState<string[]>([]);
  const [suggestionStatus, setSuggestionStatus] = useState<"idle" | "loading">("idle");
  const moleculeMatches = useMemo(() => findMoleculeMatches(query), [query]);
  const groupedPresets = useMemo(
    () => presetFolders.map((folder) => ({ ...folder, presets: moleculePresets.filter((p) => p.category === folder.category) })),
    []
  );
  const showSuggestions = query.trim().length > 0;
  const showGlucoseTools = canFormGlucoseRing || canSelectGlucoseAnomer;
  const displayGlucoseStage = glucoseStage === "idle"
    ? activePresetId === "glucose-linear" ? "aldehyde" : canSelectGlucoseAnomer ? "ring" : "idle"
    : glucoseStage;
  const glucoseStageIndex = (["aldehyde", "hemiacetal", "ring"] as const).indexOf(displayGlucoseStage as Exclude<GlucoseStage, "idle">);

  useEffect(() => {
    if (mode !== "guided") onActiveLessonChange?.(null);
  }, [mode, onActiveLessonChange]);

  useEffect(() => {
    const term = query.trim();
    if (term.length < 3) { setPubChemSuggestions([]); setSuggestionStatus("idle"); return; }
    const controller = new AbortController();
    setSuggestionStatus("loading");
    const timer = window.setTimeout(() => {
      fetchPubChemSuggestions(term, controller.signal)
        .then((s) => setPubChemSuggestions(s.filter((sug) => !moleculeMatches.some((p) => normalize(p.name) === normalize(sug)))))
        .catch(() => setPubChemSuggestions([]))
        .finally(() => { if (!controller.signal.aborted) setSuggestionStatus("idle"); });
    }, 320);
    return () => { controller.abort(); window.clearTimeout(timer); };
  }, [moleculeMatches, query]);

  const buildPubChemMolecule = async (searchTerm = query) => {
    const term = searchTerm.trim();
    if (!term) { setBuilderStatus("missing"); setBuilderMessage("Type a molecule name first."); return; }
    setBuilderStatus("loading"); setBuilderMessage("Searching PubChem...");
    try {
      setQuery(term);
      const p = await fetchPubChemMolecule(term);
      onMoleculePreset(p);
      setBuilderStatus("imported"); setBuilderMessage(`Imported ${p.name}.`);
    } catch (e) {
      setBuilderStatus("missing"); setBuilderMessage(e instanceof Error ? e.message : "Could not build.");
    }
  };

  const buildMolecule = async () => {
    const t = moleculeMatches[0]?.id;
    if (t) { setBuilderStatus("idle"); setBuilderMessage(""); onPreset(t); return; }
    await buildPubChemMolecule();
  };

  if (mode === "guided") {
    return (
      <GuidedView
        activePresetId={activePresetId ?? ""}
        onPreset={onPreset}
        onSetAnnotations={onSetLessonAnnotations}
        onClearAnnotations={onClearLesson}
        addLessonAtom={addLessonAtom}
        moveLessonAtom={moveLessonAtom}
        bondLessonAtoms={bondLessonAtoms}
        addLessonParticles={addLessonParticles}
        clearLessonAtoms={clearLessonAtoms}
        onActiveLessonChange={onActiveLessonChange}
      />
    );
  }

  return (
    <section className="learning-panel">
      <div className="section-heading"><FlaskConical size={18} /><h2>Preset Molecules</h2></div>
      <form className="molecule-builder" onSubmit={(e) => { e.preventDefault(); buildMolecule(); }}>
        <label className="builder-search"><Search size={16} /><input value={query} onChange={(e) => { setQuery(e.target.value); setBuilderStatus("idle"); setBuilderMessage(""); }} placeholder="benzene, aspirin, glucose..." /></label>
        <button type="submit" className="builder-button" disabled={builderStatus === "loading"}><WandSparkles size={16} />{builderStatus === "loading" ? "Searching" : "Build"}</button>
        {builderMessage && <p className={builderStatus === "imported" ? "builder-message success" : "builder-message"}>{builderMessage}</p>}
      </form>
      {showGlucoseTools && (
        <div className="preset-action glucose-action">
          <div className="anomer-selector">
            {(["alpha", "beta"] as const).map((a) => <button key={a} className={glucoseAnomer === a ? "active" : ""} onClick={() => onGlucoseAnomer(a)}>{a === "alpha" ? "\u03b1-glucose" : "\u03b2-glucose"}</button>)}
          </div>
          {canFormGlucoseRing && <button className="form-ring-button" onClick={() => onFormGlucoseRing(glucoseAnomer)}><WandSparkles size={16} />Form ring</button>}
          <div className="reaction-steps">
            {[{ id: "aldehyde", label: "aldehyde + OH" }, { id: "hemiacetal", label: "hemiacetal" }, { id: "ring", label: "ring closure" }].map((s, i) => <span key={s.id} className={i < glucoseStageIndex ? "done" : i === glucoseStageIndex ? "active" : ""}>{s.label}</span>)}
          </div>
          <span>{canFormGlucoseRing ? "Choose an anomer, then fold linear glucose." : "Flip the anomeric OH at C1."}</span>
        </div>
      )}
      {showSuggestions && (
        <div className="builder-results">
          {moleculeMatches.map((p) => <button key={p.id} className={activePresetId === p.id ? "builder-result active" : "builder-result"} onClick={() => { setBuilderStatus("idle"); setBuilderMessage(""); onPreset(p.id); }}><strong>{p.formula}</strong><span>{p.name} - curated</span></button>)}
          {pubChemSuggestions.map((s) => <button key={s} className="builder-result pubchem" onClick={() => buildPubChemMolecule(s)}><strong>{s}</strong><span>PubChem</span></button>)}
          {!moleculeMatches.length && !pubChemSuggestions.length && query.trim().length < 3 && <p className="builder-hint">Keep typing for PubChem suggestions.</p>}
          {suggestionStatus === "loading" && <p className="builder-hint">Checking PubChem...</p>}
        </div>
      )}
      <div className="preset-folders">
        {groupedPresets.map((f) => (
          <details key={f.category} className={`preset-folder preset-folder-${f.category}`} open={f.presets.some((p) => p.id === activePresetId)}>
            <summary><span><strong>{f.title}</strong><small>{f.description}</small></span><em>{f.presets.length}</em></summary>
            <div className="preset-grid">{f.presets.map((p) => <button key={p.id} className={activePresetId === p.id ? "preset active" : "preset"} onClick={() => onPreset(p.id)}><strong>{p.formula}</strong><span>{p.name}</span></button>)}</div>
          </details>
        ))}
      </div>
    </section>
  );
}

function GuidedView({ activePresetId, onPreset, onSetAnnotations, onClearAnnotations, addLessonAtom, moveLessonAtom, bondLessonAtoms, addLessonParticles, clearLessonAtoms, onActiveLessonChange }: {
  activePresetId: string;
  onPreset: (id: string) => void;
  onSetAnnotations?: Props["onSetLessonAnnotations"];
  onClearAnnotations?: Props["onClearLesson"];
  addLessonAtom?: Props["addLessonAtom"];
  moveLessonAtom?: Props["moveLessonAtom"];
  bondLessonAtoms?: Props["bondLessonAtoms"];
  addLessonParticles?: Props["addLessonParticles"];
  clearLessonAtoms?: Props["clearLessonAtoms"];
  onActiveLessonChange?: Props["onActiveLessonChange"];
}) {
  const [completed, setCompleted] = useState<string[]>(loadProgress);
  const [stepIndex, setStepIndex] = useState(0);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizPassed, setQuizPassed] = useState(false);
  const [introAccepted, setIntroAccepted] = useState(false);
  const [activeLessonId, setActiveLessonId] = useState<string>("");
  const [animationRevision, setAnimationRevision] = useState(0);
  const prevLessonId = useRef(activeLessonId);
  const completedAnimationKeys = useRef<Set<string>>(new Set());
  const quizAdvanceTimer = useRef<number>(0);

  const modules = useMemo(() => {
    const map = new Map<string, { title: string; lessons: GuidedLesson[] }>();
    for (const l of guidedLessons) {
      if (!map.has(l.moduleId)) map.set(l.moduleId, { title: l.moduleTitle, lessons: [] });
      map.get(l.moduleId)!.lessons.push(l);
    }
    return [...map.values()];
  }, []);

  const activeLesson = guidedLessons.find((l) => l.id === activeLessonId);

  useEffect(() => {
    onActiveLessonChange?.(introAccepted ? activeLessonId || null : null);
    return () => onActiveLessonChange?.(null);
  }, [activeLessonId, introAccepted, onActiveLessonChange]);

  useEffect(() => {
    if (!introAccepted) {
      if (onClearAnnotations) onClearAnnotations();
      if (clearLessonAtoms) clearLessonAtoms();
    }
  }, [introAccepted]);
  const lessonStep = activeLesson?.steps?.[stepIndex];

  useEffect(() => {
    if (!introAccepted) return;
    completedAnimationKeys.current.clear();
    if (activeLesson && onClearAnnotations) onClearAnnotations();
  }, [activeLessonId, introAccepted]);

  useEffect(() => {
    if (onSetAnnotations) {
      if (!introAccepted) {
        onSetAnnotations([], [], [], 0, undefined, 0, [], 0);
        return;
      }
      const lessonChanged = activeLessonId !== prevLessonId.current;
      prevLessonId.current = activeLessonId;
      if (lessonChanged && clearLessonAtoms) clearLessonAtoms();
      if (activeLesson && stepIndex < activeLesson.steps.length) {
        const step = activeLesson.steps[stepIndex];
        onSetAnnotations(step.annotations ?? [], step.highlightAtomIds ?? [], step.highlightBondIds ?? [], stepIndex, step.text, activeLesson.steps.length, step.animation?.parts ?? [], (step.animation?.parts ?? []).length);
      } else {
        onSetAnnotations([], [], [], 0, undefined, 0, [], 0);
      }
    }
  }, [activeLessonId, introAccepted, stepIndex]);

  const markComplete = (id: string) => {
    const next = [...new Set([...completed, id])];
    setCompleted(next);
    saveProgress(next);
    return next;
  };

  const advanceToNextLesson = () => {
    const lesson = guidedLessons.find((l) => l.id === activeLessonId);
    if (!lesson) return;
    for (const mod of modules) {
      const idx = mod.lessons.findIndex((l) => l.id === lesson.id);
      if (idx >= 0 && idx < mod.lessons.length - 1) {
        const nextLesson = mod.lessons[idx + 1];
        handleSelectLesson(nextLesson.id);
        return;
      }
    }
  };

  const handleCloseQuiz = () => {
    setShowQuiz(false);
    window.clearTimeout(quizAdvanceTimer.current);
    quizAdvanceTimer.current = 0;
    if (activeLesson && quizPassed) {
      markComplete(activeLesson.id);
      advanceToNextLesson();
    }
  };

  const isUnlocked = (lesson: GuidedLesson) => {
    if (!lesson.prerequisites?.length) return true;
    return lesson.prerequisites.every((r) => completed.includes(r));
  };

  const handleSelectLesson = (lessonId: string) => {
    setIntroAccepted(true);
    completedAnimationKeys.current.clear();
    if (clearLessonAtoms) clearLessonAtoms();
    setStepIndex(0);
    setShowQuiz(false);
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizPassed(false);
    setAnimationRevision((value) => value + 1);
    window.clearTimeout(quizAdvanceTimer.current);
    quizAdvanceTimer.current = 0;
    setActiveLessonId(lessonId);
    const lesson = guidedLessons.find((l) => l.id === lessonId);
    if (lesson) {
      onPreset(lesson.presetId);
    }
  };

  const handleStartGuided = () => {
    setIntroAccepted(true);
    const firstLesson = guidedLessons.find((lesson) => isUnlocked(lesson) && !completed.includes(lesson.id))
      ?? guidedLessons.find((lesson) => isUnlocked(lesson))
      ?? guidedLessons[0];
    if (firstLesson) handleSelectLesson(firstLesson.id);
  };

  const runAnimation = (animation: LessonStepAnimation | undefined, animationKey: string) => {
    if (!animation?.parts.length) return;
    if (!addLessonAtom || !moveLessonAtom || !bondLessonAtoms || !addLessonParticles) return;
    const simTypes = new Set<LessonAnimationPart["type"]>(["clear", "spawn", "move", "bond", "particle"]);
    if (!animation.parts.some((part) => simTypes.has(part.type))) return;
    if (!animation.loop && completedAnimationKeys.current.has(animationKey)) return;

    let completed = false;
    const timers: number[] = [];
    const runCycle = () => {
      let delay = 0;
      for (const part of animation.parts) {
        if (part.type === "wait") { delay += part.ms; continue; }
        if (!simTypes.has(part.type)) continue;
        const timer = window.setTimeout(() => {
          if (part.type === "clear") clearLessonAtoms?.();
          else if (part.type === "spawn" && "symbol" in part) addLessonAtom(part.symbol, part.x, part.y);
          else if (part.type === "move" && "atomIndex" in part) moveLessonAtom(part.atomIndex, part.targetX, part.targetY);
          else if (part.type === "bond" && "atomA" in part) bondLessonAtoms(part.atomA, part.atomB);
          else if (part.type === "particle" && "fromAtom" in part) addLessonParticles(part.fromAtom, part.toAtom, part.count, part.color);
        }, delay);
        timers.push(timer);
        delay += 80;
      }
      return delay;
    };

    const delay = runCycle();
    if (animation.loop) {
      const loopMs = Math.max(animation.loopMs ?? 5200, delay + 700);
      const loopTimer = window.setInterval(runCycle, loopMs);
      timers.push(loopTimer);
    } else {
      const completionTimer = window.setTimeout(() => {
        completed = true;
        completedAnimationKeys.current.add(animationKey);
      }, delay + 20);
      timers.push(completionTimer);
    }
    return () => {
      timers.forEach(clearTimeout);
      timers.forEach(clearInterval);
      if (!completed) completedAnimationKeys.current.delete(animationKey);
    };
  };

  useEffect(() => {
    if (!introAccepted) return;
    const cleanup = runAnimation(lessonStep?.animation, `${activeLessonId}:${stepIndex}:${animationRevision}`);
    return cleanup;
  }, [activeLessonId, animationRevision, introAccepted, stepIndex]);

  const handlePrevStep = () => {
    if (stepIndex > 0) setStepIndex((p) => p - 1);
  };

  const handleNextStep = () => {
    if (!activeLesson) return;
    if (stepIndex < activeLesson.steps.length - 1) {
      setStepIndex((p) => p + 1);
    } else if (activeLesson.quizzes?.length) {
      setShowQuiz(true);
      setQuizAnswers({});
      setQuizSubmitted(false);
    } else {
      markComplete(activeLesson.id);
      setStepIndex(0);
      advanceToNextLesson();
    }
  };

  useEffect(() => {
    if (!introAccepted || !activeLesson || showQuiz) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target?.isContentEditable) return;
      if (event.code === "Space" || event.key === "ArrowRight") {
        event.preventDefault();
        handleNextStep();
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        handlePrevStep();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeLesson, introAccepted, showQuiz, stepIndex]);

  const handleSpeakStep = () => {
    if (!activeLesson || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const text = activeLesson.steps[stepIndex]?.text ?? "";
    if (!text) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;
    window.speechSynthesis.speak(utterance);
  };

  const handleStopSpeech = () => {
    window.speechSynthesis.cancel();
  };

  const handleQuizSubmit = () => {
    setQuizSubmitted(true);
    const allCorrect = activeLesson?.quizzes?.every((_, i) => quizAnswers[i] === activeLesson.quizzes![i].correctIndex);
    if (allCorrect) {
      setQuizPassed(true);
      if (activeLesson) markComplete(activeLesson.id);
      window.clearTimeout(quizAdvanceTimer.current);
      quizAdvanceTimer.current = window.setTimeout(() => {
        quizAdvanceTimer.current = 0;
        advanceToNextLesson();
      }, 1200);
    }
  };

  return (
    <section className="learning-panel">
      <div className="section-heading"><BookOpen size={18} /><h2>Guided Learning</h2></div>

      {!introAccepted && (
        <div className="guided-intro">
          <h3>Start with guided lessons?</h3>
          <p>Guided Learning walks through atoms, periodic trends, bonding, VSEPR shapes, intermolecular forces, reactions, organic chemistry, and real-world examples with short animations and quick checks.</p>
          <div className="guided-intro-actions">
            <button className="lesson-nav-btn primary" onClick={handleStartGuided}>
              Start Guided Learning <ChevronRight size={15} />
            </button>
            <button className="lesson-nav-btn" onClick={() => setIntroAccepted(true)}>
              Browse modules
            </button>
          </div>
        </div>
      )}

      {introAccepted && activeLesson && !showQuiz && (
        <div className="lesson-content">
          <div className="lesson-progress">
            <div className="lesson-progress-bar"><i style={{ width: `${((stepIndex + 1) / activeLesson.steps.length) * 100}%` }} /></div>
            <span>{stepIndex + 1} / {activeLesson.steps.length}</span>
          </div>
          <ol className="lesson-steps">
            {activeLesson.steps.slice(stepIndex, stepIndex + 1).map((step, i) => (
              <li key={stepIndex} className="current-step">{step.text}</li>
            ))}
          </ol>
          <LessonStudyNote lesson={activeLesson} stepIndex={stepIndex} />
          <div className="lesson-buttons">
            <button className="lesson-nav-btn" onClick={handlePrevStep} disabled={stepIndex <= 0}>
              <ChevronRight size={15} style={{ transform: "rotate(180deg)" }} /> Back
            </button>
            {window.speechSynthesis && (
              <button className="lesson-speak-btn" onClick={handleSpeakStep} title="Read step aloud">
                <Volume2 size={15} />
              </button>
            )}
            <button className="lesson-nav-btn primary" onClick={handleNextStep}>
              {stepIndex < activeLesson.steps.length - 1 ? "Next" : activeLesson.quizzes?.length ? "Quiz" : "Complete"} <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}

      {introAccepted && showQuiz && activeLesson?.quizzes && (
        <div className="lesson-quiz">
          <h3 style={{ margin: 0, fontSize: "1rem", color: "#ffffff" }}>Check your understanding</h3>
          {activeLesson.quizzes.map((q, qi) => (
            <QuizCard key={qi} question={q} index={qi} selected={quizAnswers[qi]} submitted={quizSubmitted} onSelect={(a) => setQuizAnswers((p) => ({ ...p, [qi]: a }))} />
          ))}
          <div className="quiz-actions" style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center" }}>
            {!quizSubmitted ? (
              <button className="quiz-submit" onClick={handleQuizSubmit} disabled={Object.keys(quizAnswers).length < activeLesson.quizzes.length} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", minHeight: "42px", padding: "0 20px", border: "1px solid transparent", borderRadius: "8px", color: "#071412", background: "#5eead4", fontSize: "0.88rem", fontWeight: 900, cursor: "pointer" }}>Submit</button>
            ) : (
              <div className="quiz-result" style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center", width: "100%" }}>
                {quizPassed ? (
                  <p className="quiz-pass"><CheckCircle2 size={18} /> All correct!</p>
                ) : (
                  <p className="quiz-fail">Review incorrect answers above.</p>
                )}
                {!quizPassed ? (
                  <button className="quiz-retry" onClick={() => { setQuizAnswers({}); setQuizSubmitted(false); setQuizPassed(false); }} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", minHeight: "42px", padding: "0 16px", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "8px", color: "#eef5f1", background: "transparent", fontSize: "0.85rem", fontWeight: 900, cursor: "pointer" }}>Retry</button>
                ) : (
                  <button className="quiz-continue" onClick={handleCloseQuiz} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", minHeight: "42px", padding: "0 16px", border: "1px solid transparent", borderRadius: "8px", color: "#071412", background: "#a7f3d0", fontSize: "0.85rem", fontWeight: 900, cursor: "pointer" }}>Continue</button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {introAccepted && <div className="guided-modules">
        {modules.map((mod, mi) => {
          const moduleDone = mod.lessons.every((l) => completed.includes(l.id));
          const moduleProgress = mod.lessons.filter((l) => completed.includes(l.id)).length;
          return (
            <div key={mi} className="guided-module">
              <div className="guided-module-title">
                {mod.title}
                <span className="guided-module-count">{moduleProgress}/{mod.lessons.length}{moduleDone ? <CheckCircle2 size={12} /> : ""}</span>
              </div>
              <div className="lesson-list">
                {mod.lessons.map((lesson) => {
                  const isActive = lesson.id === activeLessonId;
                  const isDone = completed.includes(lesson.id);
                  const unlocked = isUnlocked(lesson);
                  return (
                    <button
                      key={lesson.id}
                      className={`lesson${isActive ? " active" : ""}${isDone ? " completed" : ""}${!unlocked ? " locked" : ""}`}
                      onClick={() => unlocked && handleSelectLesson(lesson.id)}
                      disabled={!unlocked}
                    >
                      <span>{isDone ? <CheckCircle2 size={13} className="lesson-check" /> : !unlocked ? <Lock size={13} className="lesson-check" /> : <Circle size={13} className="lesson-check" />}{lesson.title}</span>
                      <strong>{lesson.focus}</strong>
                      <ChevronRight size={17} />
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>}
    </section>
  );
}

type StudyNote = {
  idea: string;
  check: string;
};

const lessonStudyNotes: Record<string, StudyNote[]> = {
  "m01-welcome": [
    { idea: "Matter is made from atoms. A molecule forms when atoms are connected by chemical bonds.", check: "Hydrogen is a useful first example because it has only one proton and one electron." },
    { idea: "A proton is positive (+). An electron is negative (-). A neutral hydrogen atom has one of each, so the charges cancel.", check: "If hydrogen loses its electron, it becomes H+ because the positive proton is no longer balanced." },
    { idea: "A covalent bond means atoms share electron density. H2 forms because two hydrogen atoms can share a pair of electrons.", check: "Each hydrogen atom becomes more stable because it is now near two electrons, called a duet." }
  ],
  "m01-parts": [
    { idea: "The nucleus contains protons and neutrons. Protons are positive; neutrons are neutral and have no charge.", check: "Electrons are negative and occupy the space around the nucleus." },
    { idea: "Electron shells are energy levels. The first shell fills with 2 electrons; the second shell can hold up to 8.", check: "Carbon has 6 electrons total: 2 in the first shell and 4 in the second shell." },
    { idea: "Valence electrons are the outer-shell electrons. They are the electrons most involved in bonding.", check: "Carbon has 4 valence electrons, which is why it commonly forms 4 bonds." },
    { idea: "Atomic number equals proton count. Mass number is protons plus neutrons.", check: "A neutral atom has the same number of protons and electrons, so the total charge is 0." }
  ],
  "m01-atomic-number": [
    { idea: "Atomic number is the identity number of an element. Change the proton count and you change the element.", check: "Oxygen has atomic number 8 because every oxygen atom has 8 protons." },
    { idea: "A neutral oxygen atom has 8 protons and 8 electrons. The +8 and -8 charges cancel.", check: "Neutrons add mass but not charge, so they do not affect whether the atom is neutral." },
    { idea: "Mass number is protons plus neutrons. Oxygen-16 has 8 protons and 8 neutrons.", check: "Isotopes of oxygen still have 8 protons, but they can have different neutron counts." }
  ],
  "m01-isotopes": [
    { idea: "The number of protons identifies the element. Hydrogen has 1 proton; helium has 2.", check: "Look at proton count first when naming the element." },
    { idea: "Isotopes are versions of the same element with different neutron counts.", check: "Hydrogen-1 and hydrogen-2 are both hydrogen because both have 1 proton." }
  ],
  "m01-charge": [
    { idea: "Neutral atoms have equal numbers of protons and electrons.", check: "3 protons and 3 electrons balance to net charge 0." },
    { idea: "Ions form when electron count changes. Losing electrons makes a positive ion; gaining electrons makes a negative ion.", check: "Compare protons and electrons to decide the charge." }
  ],
  "m01-shells": [
    { idea: "Electrons fill lower-energy shells first. Filled inner shells are usually not the main bonding electrons.", check: "Oxygen has 2 inner electrons and 6 valence electrons." },
    { idea: "The valence shell controls many chemical properties because it is the outer shell that other atoms interact with.", check: "Oxygen tends to form 2 bonds because it has 6 valence electrons and is 2 short of an octet." }
  ]
};

const moduleStudyNotes: Record<string, StudyNote> = {
  m01: { idea: "Atoms are organized by protons, neutrons, electrons, charge, and electron shells.", check: "Ask: what is in the nucleus, what is outside it, and is the atom neutral?" },
  m02: { idea: "The periodic table groups elements by repeating valence-electron patterns.", check: "Ask: what column is the element in, and how many valence electrons does that suggest?" },
  m03: { idea: "Atoms become more stable when their valence shell is full or closer to full.", check: "Ask: is the atom sharing, gaining, or losing electrons to reach stability?" },
  m04: { idea: "Bond type depends on how electrons are shared, transferred, or pooled across atoms.", check: "Ask: are electrons shared equally, shared unequally, transferred, or mobile through a metal?" },
  m05: { idea: "Electronegativity measures how strongly an atom pulls bonding electrons.", check: "Ask: does the molecule have polar bonds, and do the dipoles cancel?" },
  m06: { idea: "VSEPR predicts shape by spacing electron regions as far apart as possible.", check: "Ask: how many bonding groups and lone pairs surround the central atom?" },
  m07: { idea: "Intermolecular forces are attractions between molecules, not the strong bonds inside molecules.", check: "Ask: are the molecules nonpolar, polar, or capable of hydrogen bonding?" },
  m08: { idea: "Reactions rearrange atoms by breaking old bonds and forming new ones.", check: "Ask: where does energy go when bonds break, and where is it released when bonds form?" },
  m09: { idea: "Organic chemistry is mostly carbon framework chemistry plus functional groups.", check: "Ask: what is the carbon skeleton, and what functional groups are attached?" },
  m10: { idea: "Real-world chemistry links molecular structure to observable properties and technology.", check: "Ask: how does the molecule's shape, polarity, or bonding explain the effect?" }
};

function LessonStudyNote({ lesson, stepIndex }: { lesson: GuidedLesson; stepIndex: number }) {
  const note = lessonStudyNotes[lesson.id]?.[stepIndex]
    ?? lessonStudyNotes[lesson.id]?.[0]
    ?? moduleStudyNotes[lesson.moduleId]
    ?? { idea: lesson.focus, check: "Connect the visual model to the bonding rule being shown." };

  return (
    <div className="lesson-study-note">
      <div>
        <strong>Key idea</strong>
        <p>{note.idea}</p>
      </div>
      <div>
        <strong>Check yourself</strong>
        <p>{note.check}</p>
      </div>
    </div>
  );
}

function QuizCard({ question, index, selected, submitted, onSelect }: {
  question: QuizQuestion; index: number; selected?: number; submitted: boolean; onSelect: (a: number) => void;
}) {
  const correct = submitted && selected === question.correctIndex;
  const wrong = submitted && selected !== undefined && !correct;
  return (
    <div className={`quiz-card${submitted ? (correct ? " correct" : wrong ? " wrong" : "") : ""}`} style={{ padding: "14px", border: "1px solid rgba(255,255,255,0.09)", borderRadius: "8px", background: "rgba(255,255,255,0.035)" }}>
      <p className="quiz-question">{highlightElements(question.question)}</p>
        <div className="quiz-options" style={{ display: "grid", gap: "12px" }}>
          {question.options.map((opt, oi) => {
            const isCorrect = oi === question.correctIndex;
            let cls = "";
            if (submitted) { if (isCorrect) cls = " correct"; else if (selected === oi) cls = " wrong"; }
            else if (selected === oi) cls = " selected";
            return <button key={oi} className={`quiz-option${cls}`} style={{ display: "flex", alignItems: "center", gap: "10px", minHeight: "46px", padding: "0 16px", borderRadius: "8px", fontSize: "0.9rem", fontWeight: 800, textAlign: "left", width: "100%", cursor: "pointer" }} onClick={() => !submitted && onSelect(oi)} disabled={submitted}>{opt}{submitted && isCorrect && <CheckCircle2 size={14} className="quiz-mark" />}</button>;
        })}
      </div>
      {submitted && wrong && <p className="quiz-explanation">{question.explanation}</p>}
    </div>
  );
}

function normalize(v: string) { return v.toLowerCase().replace(/[^a-z0-9]+/g, ""); }

const elemPattern = /\b(H|He|Li|Be|B|C|N|O|F|Ne|Na|Mg|Al|Si|P|S|Cl|Ar|K|Ca|Fe|Cu|Zn|Br|I|Au|Hg|Pb)\b/g;

function highlightElements(text: string): (string | ReactNode)[] {
  const parts = text.split(elemPattern);
  return parts.map((part, i) => {
    if (i % 2 === 1) return <span key={i} style={{ color: "#2563eb", fontWeight: 900 }}>{part}</span>;
    return part;
  });
}
function findMoleculeMatches(q: string) {
  const n = normalize(q);
  if (!n) return moleculePresets.slice(0, 4);
  return moleculePresets.filter((p) => [p.name, p.formula, p.id, ...(p.aliases ?? [])].some((t) => normalize(t).includes(n))).slice(0, 5);
}
