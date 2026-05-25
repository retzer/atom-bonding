import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { BookOpen, CheckCircle2, ChevronRight, Circle, FlaskConical, Lock, Search, Volume2, WandSparkles } from "lucide-react";
import { guidedLessons } from "../data/lessons";
import {
  buildCumulativeReviewQuestions,
  buildLessonQuizQuestions,
  buildModuleAssessmentQuestions as buildFrameworkModuleAssessmentQuestions,
  conceptRegistry,
  conceptsForStep,
  curriculumForLesson,
  moduleSummaries,
  objectivesForStep,
  recallCandidatesForLesson,
  updateConceptProgress
} from "../data/learningFramework";
import { moleculePresets } from "../data/presets";
import { fetchPubChemMolecule, fetchPubChemSuggestions } from "../data/pubchem";
import type { AppMode, AtomSymbol, ConceptProgress, GuidedLesson, LessonAnimationPart, LessonStep, LessonStepAnimation, MoleculePreset, QuizQuestion, ViewportAnnotation } from "../types";

type GlucoseAnomer = "alpha" | "beta";
type GlucoseStage = "idle" | "aldehyde" | "hemiacetal" | "ring";
type QuizFeedbackKind = "perfect" | "zero";
type GuidedModule = { id: string; title: string; lessons: GuidedLesson[] };
type ModuleAssessment = { moduleId: string; moduleTitle: string; questions: QuizQuestion[]; kind: "module" | "cumulative" };

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
const CONCEPT_PROGRESS_KEY = "atom-bonding-concept-progress-v1";

function loadProgress(): string[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]"); } catch { return []; }
}

function saveProgress(ids: string[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(ids)); } catch {}
}

function loadConceptProgress(): Record<string, ConceptProgress> {
  try { return JSON.parse(localStorage.getItem(CONCEPT_PROGRESS_KEY) ?? "{}"); } catch { return {}; }
}

function saveConceptProgress(progress: Record<string, ConceptProgress>) {
  try { localStorage.setItem(CONCEPT_PROGRESS_KEY, JSON.stringify(progress)); } catch {}
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
  const [conceptProgress, setConceptProgress] = useState<Record<string, ConceptProgress>>(loadConceptProgress);
  const [stepIndex, setStepIndex] = useState(0);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizPassed, setQuizPassed] = useState(false);
  const [quizFeedback, setQuizFeedback] = useState<QuizFeedbackKind | null>(null);
  const [moduleAssessment, setModuleAssessment] = useState<ModuleAssessment | null>(null);
  const [pendingModuleSummaryId, setPendingModuleSummaryId] = useState<string | null>(null);
  const [introAccepted, setIntroAccepted] = useState(false);
  const [activeLessonId, setActiveLessonId] = useState<string>("");
  const [animationRevision, setAnimationRevision] = useState(0);
  const prevLessonId = useRef(activeLessonId);
  const completedAnimationKeys = useRef<Set<string>>(new Set());
  const quizAdvanceTimer = useRef<number>(0);

  const modules = useMemo(() => {
    const map = new Map<string, GuidedModule>();
    for (const l of guidedLessons) {
      if (!map.has(l.moduleId)) map.set(l.moduleId, { id: l.moduleId, title: l.moduleTitle, lessons: [] });
      map.get(l.moduleId)!.lessons.push(l);
    }
    return [...map.values()];
  }, []);

  const activeLesson = guidedLessons.find((l) => l.id === activeLessonId);
  const activeCurriculum = activeLesson ? curriculumForLesson(activeLesson) : null;
  const currentQuizQuestions = moduleAssessment?.questions ?? quizQuestions;

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

  const recordConceptProgress = (questions: QuizQuestion[], answers: Record<number, number>) => {
    const next = updateConceptProgress(conceptProgress, questions, answers);
    setConceptProgress(next);
    saveConceptProgress(next);
    return next;
  };

  function isUnlocked(lesson: GuidedLesson, progress = completed) {
    if (!lesson.prerequisites?.length) return true;
    return lesson.prerequisites.every((r) => progress.includes(r));
  }

  const startModuleAssessment = (mod: GuidedModule) => {
    const questions = buildFrameworkModuleAssessmentQuestions(mod.id, mod.lessons, completed, conceptProgress);
    if (!questions.length) {
      const next = markComplete(moduleAssessmentKey(mod.id));
      advanceToNextLesson(next);
      return;
    }
    setModuleAssessment({ moduleId: mod.id, moduleTitle: mod.title, questions, kind: "module" });
    setPendingModuleSummaryId(null);
    setShowQuiz(true);
    setQuizQuestions([]);
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizPassed(false);
    setQuizFeedback(null);
    window.clearTimeout(quizAdvanceTimer.current);
    quizAdvanceTimer.current = 0;
  };

  const shouldAssessModule = (lesson: GuidedLesson, progress: string[]) => {
    const mod = modules.find((item) => item.id === lesson.moduleId);
    if (!mod) return false;
    const isLastLesson = mod.lessons[mod.lessons.length - 1]?.id === lesson.id;
    const allLessonsDone = mod.lessons.every((item) => progress.includes(item.id));
    return isLastLesson && allLessonsDone && !progress.includes(moduleAssessmentKey(mod.id));
  };

  const completeActiveLesson = () => {
    if (!activeLesson) return;
    const next = markComplete(activeLesson.id);
    const mod = modules.find((item) => item.id === activeLesson.moduleId);
    if (mod && shouldAssessModule(activeLesson, next)) {
      setPendingModuleSummaryId(mod.id);
      setShowQuiz(false);
      setModuleAssessment(null);
      return;
    }
    const cumulativeQuestions = buildCumulativeReviewQuestions(activeLesson, next, conceptProgress);
    if (cumulativeQuestions.length) {
      setModuleAssessment({ moduleId: `cumulative-${activeLesson.id}`, moduleTitle: "Cumulative review", questions: cumulativeQuestions, kind: "cumulative" });
      setShowQuiz(true);
      setQuizQuestions([]);
      setQuizAnswers({});
      setQuizSubmitted(false);
      setQuizPassed(false);
      setQuizFeedback(null);
      return;
    }
    setShowQuiz(false);
    setModuleAssessment(null);
    advanceToNextLesson(next);
  };

  const completeModuleAssessment = () => {
    if (!moduleAssessment) return;
    const next = moduleAssessment.kind === "module"
      ? markComplete(moduleAssessmentKey(moduleAssessment.moduleId))
      : completed;
    setShowQuiz(false);
    setModuleAssessment(null);
    advanceToNextLesson(next);
  };

  const advanceToNextLesson = (progress = completed) => {
    const lesson = guidedLessons.find((l) => l.id === activeLessonId);
    if (!lesson) return;
    const orderedLessons = modules.flatMap((mod) => mod.lessons);
    const idx = orderedLessons.findIndex((item) => item.id === lesson.id);
    for (const nextLesson of orderedLessons.slice(idx + 1)) {
      if (isUnlocked(nextLesson, progress)) {
        handleSelectLesson(nextLesson.id);
        return;
      }
    }
  };

  const handleCloseQuiz = () => {
    window.clearTimeout(quizAdvanceTimer.current);
    quizAdvanceTimer.current = 0;
    if (!quizPassed) {
      setShowQuiz(false);
      setQuizFeedback(null);
      setModuleAssessment(null);
      return;
    }
    if (moduleAssessment) completeModuleAssessment();
    else completeActiveLesson();
  };

  const handleSelectLesson = (lessonId: string) => {
    setIntroAccepted(true);
    completedAnimationKeys.current.clear();
    if (clearLessonAtoms) clearLessonAtoms();
    setStepIndex(0);
    setShowQuiz(false);
    setQuizQuestions([]);
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizPassed(false);
    setQuizFeedback(null);
    setModuleAssessment(null);
    setPendingModuleSummaryId(null);
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
    const shouldClearBeforeCycle = animation.parts.some((part) => part.type === "spawn") && !animation.parts.some((part) => part.type === "clear");

    let completed = false;
    const timers: number[] = [];
    const runCycle = () => {
      let delay = 0;
      if (shouldClearBeforeCycle) clearLessonAtoms?.();
      for (const part of animation.parts) {
        if (part.type === "wait") { delay += part.ms; continue; }
        if (!simTypes.has(part.type)) continue;
        if (part.type === "bond") delay += 480;
        const timer = window.setTimeout(() => {
          if (part.type === "clear") clearLessonAtoms?.();
          else if (part.type === "spawn" && "symbol" in part) addLessonAtom(part.symbol, part.x, part.y);
          else if (part.type === "move" && "atomIndex" in part) moveLessonAtom(part.atomIndex, part.targetX, part.targetY);
          else if (part.type === "bond" && "atomA" in part) bondLessonAtoms(part.atomA, part.atomB);
          else if (part.type === "particle" && "fromAtom" in part) addLessonParticles(part.fromAtom, part.toAtom, part.count, part.color);
        }, delay);
        timers.push(timer);
        delay += part.type === "bond" ? 240 : 80;
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
    } else {
      const questions = buildLessonQuizQuestions(activeLesson, completed, conceptProgress);
      if (questions.length) {
        setQuizQuestions(questions);
        setShowQuiz(true);
        setQuizAnswers({});
        setQuizSubmitted(false);
        setQuizPassed(false);
        setQuizFeedback(null);
        setModuleAssessment(null);
        return;
      }
      setStepIndex(0);
      completeActiveLesson();
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
    if (!currentQuizQuestions.length) return;
    setQuizSubmitted(true);
    recordConceptProgress(currentQuizQuestions, quizAnswers);
    const correctCount = currentQuizQuestions.reduce(
      (score, quiz, i) => score + (quizAnswers[i] === quiz.correctIndex ? 1 : 0),
      0
    );
    const allCorrect = correctCount === currentQuizQuestions.length;
    const allWrong = correctCount === 0;
    if (allCorrect) {
      setQuizPassed(true);
      setQuizFeedback("perfect");
      playQuizSuccessSound();
      window.clearTimeout(quizAdvanceTimer.current);
      quizAdvanceTimer.current = window.setTimeout(() => {
        quizAdvanceTimer.current = 0;
        if (moduleAssessment) completeModuleAssessment();
        else completeActiveLesson();
      }, 2400);
    } else {
      setQuizPassed(false);
      setQuizFeedback(allWrong ? "zero" : null);
      if (allWrong) playQuizFailureSound();
    }
  };

  const startPendingModuleAssessment = () => {
    if (!pendingModuleSummaryId) return;
    const mod = modules.find((item) => item.id === pendingModuleSummaryId);
    if (mod) startModuleAssessment(mod);
  };

  const continueAfterCumulativeReview = () => {
    setShowQuiz(false);
    setModuleAssessment(null);
    setQuizFeedback(null);
    advanceToNextLesson(completed);
  };

  const retryCurrentQuiz = () => {
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizPassed(false);
    setQuizFeedback(null);
    if (moduleAssessment?.kind === "module") {
      const mod = modules.find((item) => item.id === moduleAssessment.moduleId);
      if (mod) {
        setModuleAssessment({
          moduleId: mod.id,
          moduleTitle: mod.title,
          kind: "module",
          questions: buildFrameworkModuleAssessmentQuestions(mod.id, mod.lessons, completed, conceptProgress)
        });
      }
      return;
    }
    if (moduleAssessment?.kind === "cumulative" && activeLesson) {
      setModuleAssessment({
        ...moduleAssessment,
        questions: buildCumulativeReviewQuestions(activeLesson, completed, conceptProgress)
      });
      return;
    }
    if (activeLesson) setQuizQuestions(buildLessonQuizQuestions(activeLesson, completed, conceptProgress));
  };

  const handleInlineRecallAnswer = (question: QuizQuestion, selected: number) => {
    recordConceptProgress([question], { 0: selected });
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

      {introAccepted && pendingModuleSummaryId && !showQuiz && (
        <ModuleSummaryCard moduleId={pendingModuleSummaryId} onStart={startPendingModuleAssessment} />
      )}

      {introAccepted && activeLesson && !showQuiz && !pendingModuleSummaryId && (
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
          <LearningSurfaces lesson={activeLesson} stepIndex={stepIndex} completed={completed} progress={conceptProgress} onRecallAnswer={handleInlineRecallAnswer} />
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
              {stepIndex < activeLesson.steps.length - 1 ? "Next" : "Quiz"} <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}

      {introAccepted && showQuiz && currentQuizQuestions.length > 0 && (
        <div className="lesson-quiz">
          {quizFeedback && <QuizFeedbackOverlay kind={quizFeedback} />}
          <h3 style={{ margin: 0, fontSize: "1rem", color: "#ffffff" }}>{moduleAssessment ? moduleAssessment.kind === "module" ? `${moduleAssessment.moduleTitle} assessment` : moduleAssessment.moduleTitle : "Check your understanding"}</h3>
          {moduleAssessment && <p className="module-assessment-note">{moduleAssessment.kind === "module" ? "A short mixed review for the whole module. Question order is shuffled each time." : "A gentle spaced review from earlier lessons. You can continue after checking it."}</p>}
          {currentQuizQuestions.map((q, qi) => (
            <QuizCard key={qi} question={q} index={qi} selected={quizAnswers[qi]} submitted={quizSubmitted} onSelect={(a) => setQuizAnswers((p) => ({ ...p, [qi]: a }))} />
          ))}
          <div className="quiz-actions" style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center" }}>
            {!quizSubmitted ? (
              <button className="quiz-submit" onClick={handleQuizSubmit} disabled={Object.keys(quizAnswers).length < currentQuizQuestions.length} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", minHeight: "42px", padding: "0 20px", border: "1px solid transparent", borderRadius: "8px", color: "#071412", background: "#5eead4", fontSize: "0.88rem", fontWeight: 900, cursor: "pointer" }}>Submit</button>
            ) : (
              <div className="quiz-result" style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center", width: "100%" }}>
                {quizPassed ? (
                  <p className="quiz-pass"><CheckCircle2 size={18} /> All correct!</p>
                ) : (
                  <p className="quiz-fail">Review incorrect answers above.</p>
                )}
                {!quizPassed ? (
                  <>
                    <button className="quiz-retry" onClick={retryCurrentQuiz} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", minHeight: "42px", padding: "0 16px", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "8px", color: "#eef5f1", background: "transparent", fontSize: "0.85rem", fontWeight: 900, cursor: "pointer" }}>Retry</button>
                    {moduleAssessment?.kind === "cumulative" && (
                      <button className="quiz-continue" onClick={continueAfterCumulativeReview} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", minHeight: "42px", padding: "0 16px", border: "1px solid transparent", borderRadius: "8px", color: "#071412", background: "#a7f3d0", fontSize: "0.85rem", fontWeight: 900, cursor: "pointer" }}>Continue</button>
                    )}
                  </>
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
          const assessmentDone = completed.includes(moduleAssessmentKey(mod.id));
          return (
            <div key={mi} className="guided-module">
              <div className="guided-module-title">
                {mod.title}
                <span className="guided-module-count">{moduleProgress}/{mod.lessons.length}{moduleDone ? assessmentDone ? " + assessment" : " + review" : ""}{moduleDone && assessmentDone ? <CheckCircle2 size={12} /> : ""}</span>
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

const MODULE_ASSESSMENT_PREFIX = "module-assessment:";

function moduleAssessmentKey(moduleId: string) {
  return `${MODULE_ASSESSMENT_PREFIX}${moduleId}`;
}

function ModuleSummaryCard({ moduleId, onStart }: { moduleId: string; onStart: () => void }) {
  const summary = moduleSummaries[moduleId];
  if (!summary) return null;
  return (
    <div className="module-summary-card">
      <span className="learning-surface-label">Module summary</span>
      <h3>{summary.title}</h3>
      <p>{summary.overview}</p>
      <ul>
        {summary.takeaways.map((takeaway) => <li key={takeaway}>{takeaway}</li>)}
      </ul>
      <p className="module-summary-next">{summary.next}</p>
      <button className="lesson-nav-btn primary" onClick={onStart}>Start module assessment <ChevronRight size={15} /></button>
    </div>
  );
}

function LearningSurfaces({ lesson, stepIndex, completed, progress, onRecallAnswer }: {
  lesson: GuidedLesson;
  stepIndex: number;
  completed: string[];
  progress: Record<string, ConceptProgress>;
  onRecallAnswer: (question: QuizQuestion, selected: number) => void;
}) {
  const curriculum = curriculumForLesson(lesson);
  const objectives = objectivesForStep(lesson, stepIndex);
  const concepts = conceptsForStep(lesson, stepIndex);
  const completedKey = completed.join("|");
  const recall = useMemo(
    () => recallCandidatesForLesson(lesson, stepIndex, completed, progress)[0],
    [lesson.id, stepIndex, completedKey]
  );

  return (
    <div className="learning-surfaces">
      <div className="lesson-bridge-grid">
        <article className="learning-surface-card">
          <span className="learning-surface-label">Before this lesson</span>
          {curriculum.bridge.before.map((item) => <p key={item}>{item}</p>)}
        </article>
        <article className="learning-surface-card">
          <span className="learning-surface-label">Today's goal</span>
          <p>{curriculum.bridge.today}</p>
        </article>
      </div>
      <article className="learning-surface-card key">
        <span className="learning-surface-label">Key idea</span>
        <p>{curriculum.bridge.keyIdea}</p>
        {objectives.length > 0 && (
          <ul className="learning-objectives">
            {objectives.map((objective) => <li key={objective.id}>{objective.text}</li>)}
          </ul>
        )}
      </article>
      {curriculum.bridge.commonMistake && (
        <article className="learning-surface-card mistake">
          <span className="learning-surface-label">Common mistake</span>
          <p>{curriculum.bridge.commonMistake}</p>
        </article>
      )}
      <div className="concept-chip-row">
        {concepts.map((conceptId) => <span key={conceptId}>{conceptRegistry[conceptId]?.title ?? conceptId}</span>)}
      </div>
      {recall && <InlineRecallCard question={recall} onAnswer={onRecallAnswer} />}
    </div>
  );
}

function InlineRecallCard({ question, onAnswer }: { question: QuizQuestion; onAnswer: (question: QuizQuestion, selected: number) => void }) {
  const [selected, setSelected] = useState<number | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [canReset, setCanReset] = useState(false);
  const answerTimer = useRef<number>(0);
  const isAnswered = selected !== null;
  const isCorrect = selected === question.correctIndex;

  useEffect(() => {
    window.clearTimeout(answerTimer.current);
    answerTimer.current = 0;
    setSelected(null);
    setAttempt(0);
    setCanReset(false);
    return () => {
      window.clearTimeout(answerTimer.current);
    };
  }, [question.question]);

  useEffect(() => {
    if (!isAnswered) {
      setCanReset(false);
      return;
    }
    const timer = window.setTimeout(() => setCanReset(true), 1300);
    return () => window.clearTimeout(timer);
  }, [isAnswered, isCorrect, attempt]);

  return (
    <article className={`inline-recall-card${isAnswered ? isCorrect ? " correct" : " wrong" : ""}`} data-attempt={attempt}>
      <span className="learning-surface-label">Try recalling</span>
      <p>{question.question}</p>
      <div className="inline-recall-options">
        {question.options.map((option, index) => (
          <button
            key={`${option}-${index}`}
            className={isAnswered ? index === question.correctIndex ? "correct" : selected === index ? "wrong" : "" : ""}
            disabled={isAnswered}
            onClick={() => {
              setSelected(index);
              setAttempt((value) => value + 1);
              playInlineRecallSound(index === question.correctIndex);
              window.clearTimeout(answerTimer.current);
              answerTimer.current = window.setTimeout(() => {
                answerTimer.current = 0;
                onAnswer(question, index);
              }, 1100);
            }}
          >
            {option}
          </button>
        ))}
      </div>
      {isAnswered && (
        <div className="inline-recall-feedback">
          <strong className={`inline-recall-result${isCorrect ? " correct" : " wrong"}`}>{isCorrect ? "Correct!" : "Try again."}</strong>
          <small>{isCorrect ? "Nice recall. Lock that idea in, then reset when you're ready." : question.explanation}</small>
          <button type="button" className="inline-recall-reset" disabled={!canReset} onClick={() => setSelected(null)}>Reset</button>
        </div>
      )}
    </article>
  );
}

function QuizFeedbackOverlay({ kind }: { kind: QuizFeedbackKind }) {
  const colors = ["#5eead4", "#facc15", "#fb7185", "#60a5fa", "#a78bfa", "#34d399"];
  const confetti = Array.from({ length: 44 }, (_, i) => {
    const style = {
      left: `${6 + ((i * 19) % 88)}%`,
      animationDelay: `${(i % 11) * 38}ms`,
      background: colors[i % colors.length],
      transform: `rotate(${(i * 37) % 180}deg)`,
      "--quiz-confetti-drift": `${((i % 9) - 4) * 14}px`
    } as CSSProperties;
    return <i key={i} style={style} />;
  });

  return (
    <div className={`quiz-feedback-overlay ${kind}`} aria-live="polite">
      {kind === "perfect" && <div className="quiz-confetti">{confetti}</div>}
      <div className={`quiz-feedback-card ${kind}`}>
        {kind === "perfect" ? (
          <>
            <CheckCircle2 size={58} />
            <strong>Excellent work!</strong>
            <span>All answers correct.</span>
          </>
        ) : (
          <>
            <strong className="quiz-feedback-x">X</strong>
            <span>Try again!</span>
          </>
        )}
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

function createLessonAudioContext() {
  const AudioContextCtor = window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  return AudioContextCtor ? new AudioContextCtor() : null;
}

function playInlineRecallSound(correct: boolean) {
  try {
    const audio = createLessonAudioContext();
    if (!audio) return;
    const master = audio.createGain();
    master.gain.setValueAtTime(correct ? 0.08 : 0.07, audio.currentTime);
    master.connect(audio.destination);
    const now = audio.currentTime;
    const notes = correct ? [523.25, 659.25] : [196, 146.83];

    notes.forEach((frequency, index) => {
      const start = now + index * 0.075;
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();
      oscillator.type = correct ? "sine" : "triangle";
      oscillator.frequency.setValueAtTime(frequency, start);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(correct ? 0.32 : 0.24, start + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.18);
      oscillator.connect(gain);
      gain.connect(master);
      oscillator.start(start);
      oscillator.stop(start + 0.2);
    });

    window.setTimeout(() => void audio.close(), 420);
  } catch {
    // Keep the recall interaction usable even when the browser blocks audio.
  }
}

function playQuizSuccessSound() {
  try {
    const audio = createLessonAudioContext();
    if (!audio) return;
    const master = audio.createGain();
    master.gain.setValueAtTime(0.18, audio.currentTime);
    master.connect(audio.destination);
    const now = audio.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51];

    notes.forEach((frequency, i) => {
      const start = now + i * 0.085;
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();
      oscillator.type = i % 2 === 0 ? "triangle" : "sine";
      oscillator.frequency.setValueAtTime(frequency, start);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.42, start + 0.018);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.35);
      oscillator.connect(gain);
      gain.connect(master);
      oscillator.start(start);
      oscillator.stop(start + 0.38);
    });

    const shimmer = audio.createBufferSource();
    const shimmerGain = audio.createGain();
    const buffer = audio.createBuffer(1, audio.sampleRate * 0.42, audio.sampleRate);
    const samples = buffer.getChannelData(0);
    for (let i = 0; i < samples.length; i += 1) {
      samples[i] = (Math.random() * 2 - 1) * (1 - i / samples.length);
    }
    shimmer.buffer = buffer;
    const highpass = audio.createBiquadFilter();
    highpass.type = "highpass";
    highpass.frequency.setValueAtTime(4200, now);
    shimmerGain.gain.setValueAtTime(0.035, now + 0.08);
    shimmerGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.48);
    shimmer.connect(highpass);
    highpass.connect(shimmerGain);
    shimmerGain.connect(master);
    shimmer.start(now + 0.08);
    shimmer.stop(now + 0.52);

    window.setTimeout(() => void audio.close(), 900);
  } catch {
    // Browser audio can be blocked by device settings; the visual feedback still runs.
  }
}

function playQuizFailureSound() {
  try {
    const audio = createLessonAudioContext();
    if (!audio) return;
    const master = audio.createGain();
    master.gain.setValueAtTime(0.22, audio.currentTime);
    master.connect(audio.destination);
    const now = audio.currentTime;

    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = "sawtooth";
    oscillator.frequency.setValueAtTime(220, now);
    oscillator.frequency.exponentialRampToValueAtTime(78, now + 0.34);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.32, now + 0.018);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.38);
    oscillator.connect(gain);
    gain.connect(master);
    oscillator.start(now);
    oscillator.stop(now + 0.4);

    const thud = audio.createBufferSource();
    const thudGain = audio.createGain();
    const buffer = audio.createBuffer(1, audio.sampleRate * 0.18, audio.sampleRate);
    const samples = buffer.getChannelData(0);
    for (let i = 0; i < samples.length; i += 1) {
      samples[i] = (Math.random() * 2 - 1) * Math.exp(-i / (audio.sampleRate * 0.045));
    }
    const lowpass = audio.createBiquadFilter();
    lowpass.type = "lowpass";
    lowpass.frequency.setValueAtTime(620, now);
    thudGain.gain.setValueAtTime(0.12, now);
    thudGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
    thud.buffer = buffer;
    thud.connect(lowpass);
    lowpass.connect(thudGain);
    thudGain.connect(master);
    thud.start(now);
    thud.stop(now + 0.2);

    window.setTimeout(() => void audio.close(), 700);
  } catch {
    // Browser audio can be blocked by device settings; the visual feedback still runs.
  }
}
