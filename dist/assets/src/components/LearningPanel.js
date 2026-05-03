import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo, useRef, useState } from "react";
import { BookOpen, CheckCircle2, ChevronRight, Circle, FlaskConical, Lock, Search, Volume2, WandSparkles } from "lucide-react";
import { guidedLessons } from "../data/lessons.js";
import { moleculePresets } from "../data/presets.js";
import { fetchPubChemMolecule, fetchPubChemSuggestions } from "../data/pubchem.js";
const presetFolders = [
    { category: "covalent", title: "Covalent molecules", description: "Shared electron pairs, polarity, geometry" },
    { category: "ionic", title: "Ionic compounds", description: "Electron transfer and ion attraction" },
    { category: "metallic", title: "Metallic lattices", description: "Positive ions with mobile electrons" },
    { category: "advanced", title: "Organic and resonance", description: "Functional groups, rings, mixed bonds" }
];
const STORAGE_KEY = "atom-bonding-progress-v2";
function loadProgress() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    }
    catch {
        return [];
    }
}
function saveProgress(ids) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    }
    catch { }
}
export function LearningPanel({ mode, activePresetId, canFormGlucoseRing, canSelectGlucoseAnomer, glucoseAnomer, glucoseStage, onFormGlucoseRing, onGlucoseAnomer, onPreset, onMoleculePreset, onSetLessonAnnotations, onClearLesson, addLessonAtom, moveLessonAtom, bondLessonAtoms, addLessonParticles, clearLessonAtoms, onActiveLessonChange }) {
    const [query, setQuery] = useState("");
    const [builderStatus, setBuilderStatus] = useState("idle");
    const [builderMessage, setBuilderMessage] = useState("");
    const [pubChemSuggestions, setPubChemSuggestions] = useState([]);
    const [suggestionStatus, setSuggestionStatus] = useState("idle");
    const moleculeMatches = useMemo(() => findMoleculeMatches(query), [query]);
    const groupedPresets = useMemo(() => presetFolders.map((folder) => ({ ...folder, presets: moleculePresets.filter((p) => p.category === folder.category) })), []);
    const showSuggestions = query.trim().length > 0;
    const showGlucoseTools = canFormGlucoseRing || canSelectGlucoseAnomer;
    const displayGlucoseStage = glucoseStage === "idle"
        ? activePresetId === "glucose-linear" ? "aldehyde" : canSelectGlucoseAnomer ? "ring" : "idle"
        : glucoseStage;
    const glucoseStageIndex = ["aldehyde", "hemiacetal", "ring"].indexOf(displayGlucoseStage);
    useEffect(() => {
        if (mode !== "guided")
            onActiveLessonChange?.(null);
    }, [mode, onActiveLessonChange]);
    useEffect(() => {
        const term = query.trim();
        if (term.length < 3) {
            setPubChemSuggestions([]);
            setSuggestionStatus("idle");
            return;
        }
        const controller = new AbortController();
        setSuggestionStatus("loading");
        const timer = window.setTimeout(() => {
            fetchPubChemSuggestions(term, controller.signal)
                .then((s) => setPubChemSuggestions(s.filter((sug) => !moleculeMatches.some((p) => normalize(p.name) === normalize(sug)))))
                .catch(() => setPubChemSuggestions([]))
                .finally(() => { if (!controller.signal.aborted)
                setSuggestionStatus("idle"); });
        }, 320);
        return () => { controller.abort(); window.clearTimeout(timer); };
    }, [moleculeMatches, query]);
    const buildPubChemMolecule = async (searchTerm = query) => {
        const term = searchTerm.trim();
        if (!term) {
            setBuilderStatus("missing");
            setBuilderMessage("Type a molecule name first.");
            return;
        }
        setBuilderStatus("loading");
        setBuilderMessage("Searching PubChem...");
        try {
            setQuery(term);
            const p = await fetchPubChemMolecule(term);
            onMoleculePreset(p);
            setBuilderStatus("imported");
            setBuilderMessage(`Imported ${p.name}.`);
        }
        catch (e) {
            setBuilderStatus("missing");
            setBuilderMessage(e instanceof Error ? e.message : "Could not build.");
        }
    };
    const buildMolecule = async () => {
        const t = moleculeMatches[0]?.id;
        if (t) {
            setBuilderStatus("idle");
            setBuilderMessage("");
            onPreset(t);
            return;
        }
        await buildPubChemMolecule();
    };
    if (mode === "guided") {
        return (_jsx(GuidedView, { activePresetId: activePresetId ?? "", onPreset: onPreset, onSetAnnotations: onSetLessonAnnotations, onClearAnnotations: onClearLesson, addLessonAtom: addLessonAtom, moveLessonAtom: moveLessonAtom, bondLessonAtoms: bondLessonAtoms, addLessonParticles: addLessonParticles, clearLessonAtoms: clearLessonAtoms, onActiveLessonChange: onActiveLessonChange }));
    }
    return (_jsxs("section", { className: "learning-panel", children: [_jsxs("div", { className: "section-heading", children: [_jsx(FlaskConical, { size: 18 }), _jsx("h2", { children: "Preset Molecules" })] }), _jsxs("form", { className: "molecule-builder", onSubmit: (e) => { e.preventDefault(); buildMolecule(); }, children: [_jsxs("label", { className: "builder-search", children: [_jsx(Search, { size: 16 }), _jsx("input", { value: query, onChange: (e) => { setQuery(e.target.value); setBuilderStatus("idle"); setBuilderMessage(""); }, placeholder: "benzene, aspirin, glucose..." })] }), _jsxs("button", { type: "submit", className: "builder-button", disabled: builderStatus === "loading", children: [_jsx(WandSparkles, { size: 16 }), builderStatus === "loading" ? "Searching" : "Build"] }), builderMessage && _jsx("p", { className: builderStatus === "imported" ? "builder-message success" : "builder-message", children: builderMessage })] }), showGlucoseTools && (_jsxs("div", { className: "preset-action glucose-action", children: [_jsx("div", { className: "anomer-selector", children: ["alpha", "beta"].map((a) => _jsx("button", { className: glucoseAnomer === a ? "active" : "", onClick: () => onGlucoseAnomer(a), children: a === "alpha" ? "\u03b1-glucose" : "\u03b2-glucose" }, a)) }), canFormGlucoseRing && _jsxs("button", { className: "form-ring-button", onClick: () => onFormGlucoseRing(glucoseAnomer), children: [_jsx(WandSparkles, { size: 16 }), "Form ring"] }), _jsx("div", { className: "reaction-steps", children: [{ id: "aldehyde", label: "aldehyde + OH" }, { id: "hemiacetal", label: "hemiacetal" }, { id: "ring", label: "ring closure" }].map((s, i) => _jsx("span", { className: i < glucoseStageIndex ? "done" : i === glucoseStageIndex ? "active" : "", children: s.label }, s.id)) }), _jsx("span", { children: canFormGlucoseRing ? "Choose an anomer, then fold linear glucose." : "Flip the anomeric OH at C1." })] })), showSuggestions && (_jsxs("div", { className: "builder-results", children: [moleculeMatches.map((p) => _jsxs("button", { className: activePresetId === p.id ? "builder-result active" : "builder-result", onClick: () => { setBuilderStatus("idle"); setBuilderMessage(""); onPreset(p.id); }, children: [_jsx("strong", { children: p.formula }), _jsxs("span", { children: [p.name, " - curated"] })] }, p.id)), pubChemSuggestions.map((s) => _jsxs("button", { className: "builder-result pubchem", onClick: () => buildPubChemMolecule(s), children: [_jsx("strong", { children: s }), _jsx("span", { children: "PubChem" })] }, s)), !moleculeMatches.length && !pubChemSuggestions.length && query.trim().length < 3 && _jsx("p", { className: "builder-hint", children: "Keep typing for PubChem suggestions." }), suggestionStatus === "loading" && _jsx("p", { className: "builder-hint", children: "Checking PubChem..." })] })), _jsx("div", { className: "preset-folders", children: groupedPresets.map((f) => (_jsxs("details", { className: `preset-folder preset-folder-${f.category}`, open: f.presets.some((p) => p.id === activePresetId), children: [_jsxs("summary", { children: [_jsxs("span", { children: [_jsx("strong", { children: f.title }), _jsx("small", { children: f.description })] }), _jsx("em", { children: f.presets.length })] }), _jsx("div", { className: "preset-grid", children: f.presets.map((p) => _jsxs("button", { className: activePresetId === p.id ? "preset active" : "preset", onClick: () => onPreset(p.id), children: [_jsx("strong", { children: p.formula }), _jsx("span", { children: p.name })] }, p.id)) })] }, f.category))) })] }));
}
function GuidedView({ activePresetId, onPreset, onSetAnnotations, onClearAnnotations, addLessonAtom, moveLessonAtom, bondLessonAtoms, addLessonParticles, clearLessonAtoms, onActiveLessonChange }) {
    const [completed, setCompleted] = useState(loadProgress);
    const [stepIndex, setStepIndex] = useState(0);
    const [showQuiz, setShowQuiz] = useState(false);
    const [quizAnswers, setQuizAnswers] = useState({});
    const [quizSubmitted, setQuizSubmitted] = useState(false);
    const [quizPassed, setQuizPassed] = useState(false);
    const [quizFeedback, setQuizFeedback] = useState(null);
    const [introAccepted, setIntroAccepted] = useState(false);
    const [activeLessonId, setActiveLessonId] = useState("");
    const [animationRevision, setAnimationRevision] = useState(0);
    const prevLessonId = useRef(activeLessonId);
    const completedAnimationKeys = useRef(new Set());
    const quizAdvanceTimer = useRef(0);
    const modules = useMemo(() => {
        const map = new Map();
        for (const l of guidedLessons) {
            if (!map.has(l.moduleId))
                map.set(l.moduleId, { title: l.moduleTitle, lessons: [] });
            map.get(l.moduleId).lessons.push(l);
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
            if (onClearAnnotations)
                onClearAnnotations();
            if (clearLessonAtoms)
                clearLessonAtoms();
        }
    }, [introAccepted]);
    const lessonStep = activeLesson?.steps?.[stepIndex];
    useEffect(() => {
        if (!introAccepted)
            return;
        completedAnimationKeys.current.clear();
        if (activeLesson && onClearAnnotations)
            onClearAnnotations();
    }, [activeLessonId, introAccepted]);
    useEffect(() => {
        if (onSetAnnotations) {
            if (!introAccepted) {
                onSetAnnotations([], [], [], 0, undefined, 0, [], 0);
                return;
            }
            const lessonChanged = activeLessonId !== prevLessonId.current;
            prevLessonId.current = activeLessonId;
            if (lessonChanged && clearLessonAtoms)
                clearLessonAtoms();
            if (activeLesson && stepIndex < activeLesson.steps.length) {
                const step = activeLesson.steps[stepIndex];
                onSetAnnotations(step.annotations ?? [], step.highlightAtomIds ?? [], step.highlightBondIds ?? [], stepIndex, step.text, activeLesson.steps.length, step.animation?.parts ?? [], (step.animation?.parts ?? []).length);
            }
            else {
                onSetAnnotations([], [], [], 0, undefined, 0, [], 0);
            }
        }
    }, [activeLessonId, introAccepted, stepIndex]);
    const markComplete = (id) => {
        const next = [...new Set([...completed, id])];
        setCompleted(next);
        saveProgress(next);
        return next;
    };
    const advanceToNextLesson = () => {
        const lesson = guidedLessons.find((l) => l.id === activeLessonId);
        if (!lesson)
            return;
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
        setQuizFeedback(null);
        window.clearTimeout(quizAdvanceTimer.current);
        quizAdvanceTimer.current = 0;
        if (activeLesson && quizPassed) {
            markComplete(activeLesson.id);
            advanceToNextLesson();
        }
    };
    const isUnlocked = (lesson) => {
        if (!lesson.prerequisites?.length)
            return true;
        return lesson.prerequisites.every((r) => completed.includes(r));
    };
    const handleSelectLesson = (lessonId) => {
        setIntroAccepted(true);
        completedAnimationKeys.current.clear();
        if (clearLessonAtoms)
            clearLessonAtoms();
        setStepIndex(0);
        setShowQuiz(false);
        setQuizAnswers({});
        setQuizSubmitted(false);
        setQuizPassed(false);
        setQuizFeedback(null);
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
        if (firstLesson)
            handleSelectLesson(firstLesson.id);
    };
    const runAnimation = (animation, animationKey) => {
        if (!animation?.parts.length)
            return;
        if (!addLessonAtom || !moveLessonAtom || !bondLessonAtoms || !addLessonParticles)
            return;
        const simTypes = new Set(["clear", "spawn", "move", "bond", "particle"]);
        if (!animation.parts.some((part) => simTypes.has(part.type)))
            return;
        if (!animation.loop && completedAnimationKeys.current.has(animationKey))
            return;
        let completed = false;
        const timers = [];
        const runCycle = () => {
            let delay = 0;
            for (const part of animation.parts) {
                if (part.type === "wait") {
                    delay += part.ms;
                    continue;
                }
                if (!simTypes.has(part.type))
                    continue;
                const timer = window.setTimeout(() => {
                    if (part.type === "clear")
                        clearLessonAtoms?.();
                    else if (part.type === "spawn" && "symbol" in part)
                        addLessonAtom(part.symbol, part.x, part.y);
                    else if (part.type === "move" && "atomIndex" in part)
                        moveLessonAtom(part.atomIndex, part.targetX, part.targetY);
                    else if (part.type === "bond" && "atomA" in part)
                        bondLessonAtoms(part.atomA, part.atomB);
                    else if (part.type === "particle" && "fromAtom" in part)
                        addLessonParticles(part.fromAtom, part.toAtom, part.count, part.color);
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
        }
        else {
            const completionTimer = window.setTimeout(() => {
                completed = true;
                completedAnimationKeys.current.add(animationKey);
            }, delay + 20);
            timers.push(completionTimer);
        }
        return () => {
            timers.forEach(clearTimeout);
            timers.forEach(clearInterval);
            if (!completed)
                completedAnimationKeys.current.delete(animationKey);
        };
    };
    useEffect(() => {
        if (!introAccepted)
            return;
        const cleanup = runAnimation(lessonStep?.animation, `${activeLessonId}:${stepIndex}:${animationRevision}`);
        return cleanup;
    }, [activeLessonId, animationRevision, introAccepted, stepIndex]);
    const handlePrevStep = () => {
        if (stepIndex > 0)
            setStepIndex((p) => p - 1);
    };
    const handleNextStep = () => {
        if (!activeLesson)
            return;
        if (stepIndex < activeLesson.steps.length - 1) {
            setStepIndex((p) => p + 1);
        }
        else if (activeLesson.quizzes?.length) {
            setShowQuiz(true);
            setQuizAnswers({});
            setQuizSubmitted(false);
            setQuizPassed(false);
            setQuizFeedback(null);
        }
        else {
            markComplete(activeLesson.id);
            setStepIndex(0);
            advanceToNextLesson();
        }
    };
    useEffect(() => {
        if (!introAccepted || !activeLesson || showQuiz)
            return;
        const handleKeyDown = (event) => {
            const target = event.target;
            const tag = target?.tagName;
            if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target?.isContentEditable)
                return;
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
        if (!activeLesson || !window.speechSynthesis)
            return;
        window.speechSynthesis.cancel();
        const text = activeLesson.steps[stepIndex]?.text ?? "";
        if (!text)
            return;
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
        if (!activeLesson?.quizzes?.length)
            return;
        setQuizSubmitted(true);
        const correctCount = activeLesson.quizzes.reduce((score, quiz, i) => score + (quizAnswers[i] === quiz.correctIndex ? 1 : 0), 0);
        const allCorrect = correctCount === activeLesson.quizzes.length;
        const allWrong = correctCount === 0;
        if (allCorrect) {
            setQuizPassed(true);
            setQuizFeedback("perfect");
            playQuizSuccessSound();
            if (activeLesson)
                markComplete(activeLesson.id);
            window.clearTimeout(quizAdvanceTimer.current);
            quizAdvanceTimer.current = window.setTimeout(() => {
                quizAdvanceTimer.current = 0;
                advanceToNextLesson();
            }, 2400);
        }
        else {
            setQuizPassed(false);
            setQuizFeedback(allWrong ? "zero" : null);
            if (allWrong)
                playQuizFailureSound();
        }
    };
    return (_jsxs("section", { className: "learning-panel", children: [_jsxs("div", { className: "section-heading", children: [_jsx(BookOpen, { size: 18 }), _jsx("h2", { children: "Guided Learning" })] }), !introAccepted && (_jsxs("div", { className: "guided-intro", children: [_jsx("h3", { children: "Start with guided lessons?" }), _jsx("p", { children: "Guided Learning walks through atoms, periodic trends, bonding, VSEPR shapes, intermolecular forces, reactions, organic chemistry, and real-world examples with short animations and quick checks." }), _jsxs("div", { className: "guided-intro-actions", children: [_jsxs("button", { className: "lesson-nav-btn primary", onClick: handleStartGuided, children: ["Start Guided Learning ", _jsx(ChevronRight, { size: 15 })] }), _jsx("button", { className: "lesson-nav-btn", onClick: () => setIntroAccepted(true), children: "Browse modules" })] })] })), introAccepted && activeLesson && !showQuiz && (_jsxs("div", { className: "lesson-content", children: [_jsxs("div", { className: "lesson-progress", children: [_jsx("div", { className: "lesson-progress-bar", children: _jsx("i", { style: { width: `${((stepIndex + 1) / activeLesson.steps.length) * 100}%` } }) }), _jsxs("span", { children: [stepIndex + 1, " / ", activeLesson.steps.length] })] }), _jsx("ol", { className: "lesson-steps", children: activeLesson.steps.slice(stepIndex, stepIndex + 1).map((step, i) => (_jsx("li", { className: "current-step", children: step.text }, stepIndex))) }), _jsx(LessonStudyNote, { lesson: activeLesson, stepIndex: stepIndex }), _jsxs("div", { className: "lesson-buttons", children: [_jsxs("button", { className: "lesson-nav-btn", onClick: handlePrevStep, disabled: stepIndex <= 0, children: [_jsx(ChevronRight, { size: 15, style: { transform: "rotate(180deg)" } }), " Back"] }), window.speechSynthesis && (_jsx("button", { className: "lesson-speak-btn", onClick: handleSpeakStep, title: "Read step aloud", children: _jsx(Volume2, { size: 15 }) })), _jsxs("button", { className: "lesson-nav-btn primary", onClick: handleNextStep, children: [stepIndex < activeLesson.steps.length - 1 ? "Next" : activeLesson.quizzes?.length ? "Quiz" : "Complete", " ", _jsx(ChevronRight, { size: 15 })] })] })] })), introAccepted && showQuiz && activeLesson?.quizzes && (_jsxs("div", { className: "lesson-quiz", children: [quizFeedback && _jsx(QuizFeedbackOverlay, { kind: quizFeedback }), _jsx("h3", { style: { margin: 0, fontSize: "1rem", color: "#ffffff" }, children: "Check your understanding" }), activeLesson.quizzes.map((q, qi) => (_jsx(QuizCard, { question: q, index: qi, selected: quizAnswers[qi], submitted: quizSubmitted, onSelect: (a) => setQuizAnswers((p) => ({ ...p, [qi]: a })) }, qi))), _jsx("div", { className: "quiz-actions", style: { display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center" }, children: !quizSubmitted ? (_jsx("button", { className: "quiz-submit", onClick: handleQuizSubmit, disabled: Object.keys(quizAnswers).length < activeLesson.quizzes.length, style: { display: "inline-flex", alignItems: "center", justifyContent: "center", minHeight: "42px", padding: "0 20px", border: "1px solid transparent", borderRadius: "8px", color: "#071412", background: "#5eead4", fontSize: "0.88rem", fontWeight: 900, cursor: "pointer" }, children: "Submit" })) : (_jsxs("div", { className: "quiz-result", style: { display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center", width: "100%" }, children: [quizPassed ? (_jsxs("p", { className: "quiz-pass", children: [_jsx(CheckCircle2, { size: 18 }), " All correct!"] })) : (_jsx("p", { className: "quiz-fail", children: "Review incorrect answers above." })), !quizPassed ? (_jsx("button", { className: "quiz-retry", onClick: () => { setQuizAnswers({}); setQuizSubmitted(false); setQuizPassed(false); setQuizFeedback(null); }, style: { display: "inline-flex", alignItems: "center", justifyContent: "center", minHeight: "42px", padding: "0 16px", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "8px", color: "#eef5f1", background: "transparent", fontSize: "0.85rem", fontWeight: 900, cursor: "pointer" }, children: "Retry" })) : (_jsx("button", { className: "quiz-continue", onClick: handleCloseQuiz, style: { display: "inline-flex", alignItems: "center", justifyContent: "center", minHeight: "42px", padding: "0 16px", border: "1px solid transparent", borderRadius: "8px", color: "#071412", background: "#a7f3d0", fontSize: "0.85rem", fontWeight: 900, cursor: "pointer" }, children: "Continue" }))] })) })] })), introAccepted && _jsx("div", { className: "guided-modules", children: modules.map((mod, mi) => {
                    const moduleDone = mod.lessons.every((l) => completed.includes(l.id));
                    const moduleProgress = mod.lessons.filter((l) => completed.includes(l.id)).length;
                    return (_jsxs("div", { className: "guided-module", children: [_jsxs("div", { className: "guided-module-title", children: [mod.title, _jsxs("span", { className: "guided-module-count", children: [moduleProgress, "/", mod.lessons.length, moduleDone ? _jsx(CheckCircle2, { size: 12 }) : ""] })] }), _jsx("div", { className: "lesson-list", children: mod.lessons.map((lesson) => {
                                    const isActive = lesson.id === activeLessonId;
                                    const isDone = completed.includes(lesson.id);
                                    const unlocked = isUnlocked(lesson);
                                    return (_jsxs("button", { className: `lesson${isActive ? " active" : ""}${isDone ? " completed" : ""}${!unlocked ? " locked" : ""}`, onClick: () => unlocked && handleSelectLesson(lesson.id), disabled: !unlocked, children: [_jsxs("span", { children: [isDone ? _jsx(CheckCircle2, { size: 13, className: "lesson-check" }) : !unlocked ? _jsx(Lock, { size: 13, className: "lesson-check" }) : _jsx(Circle, { size: 13, className: "lesson-check" }), lesson.title] }), _jsx("strong", { children: lesson.focus }), _jsx(ChevronRight, { size: 17 })] }, lesson.id));
                                }) })] }, mi));
                }) })] }));
}
const lessonStudyNotes = {
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
    ],
    "m01-models": [
        { idea: "The Bohr model is a simplified picture: electrons are drawn on circular energy shells.", check: "Use it when you want to count shells and valence electrons quickly." },
        { idea: "Modern atomic theory uses orbitals and probability clouds. Electrons do not travel on exact planet-like paths.", check: "A denser cloud means a higher chance of finding an electron in that region." },
        { idea: "Models are tools. A simple model can teach one idea well, while a more realistic model explains deeper behavior.", check: "Ask what question the model is trying to answer." }
    ]
};
const moduleStudyNotes = {
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
function LessonStudyNote({ lesson, stepIndex }) {
    const note = lessonStudyNotes[lesson.id]?.[stepIndex]
        ?? lessonStudyNotes[lesson.id]?.[0]
        ?? moduleStudyNotes[lesson.moduleId]
        ?? { idea: lesson.focus, check: "Connect the visual model to the bonding rule being shown." };
    return (_jsxs("div", { className: "lesson-study-note", children: [_jsxs("div", { children: [_jsx("strong", { children: "Key idea" }), _jsx("p", { children: note.idea })] }), _jsxs("div", { children: [_jsx("strong", { children: "Check yourself" }), _jsx("p", { children: note.check })] })] }));
}
function QuizFeedbackOverlay({ kind }) {
    const colors = ["#5eead4", "#facc15", "#fb7185", "#60a5fa", "#a78bfa", "#34d399"];
    const confetti = Array.from({ length: 44 }, (_, i) => {
        const style = {
            left: `${6 + ((i * 19) % 88)}%`,
            animationDelay: `${(i % 11) * 38}ms`,
            background: colors[i % colors.length],
            transform: `rotate(${(i * 37) % 180}deg)`,
            "--quiz-confetti-drift": `${((i % 9) - 4) * 14}px`
        };
        return _jsx("i", { style: style }, i);
    });
    return (_jsxs("div", { className: `quiz-feedback-overlay ${kind}`, "aria-live": "polite", children: [kind === "perfect" && _jsx("div", { className: "quiz-confetti", children: confetti }), _jsx("div", { className: `quiz-feedback-card ${kind}`, children: kind === "perfect" ? (_jsxs(_Fragment, { children: [_jsx(CheckCircle2, { size: 58 }), _jsx("strong", { children: "Excellent work!" }), _jsx("span", { children: "All answers correct." })] })) : (_jsxs(_Fragment, { children: [_jsx("strong", { className: "quiz-feedback-x", children: "X" }), _jsx("span", { children: "Try again!" })] })) })] }));
}
function QuizCard({ question, index, selected, submitted, onSelect }) {
    const correct = submitted && selected === question.correctIndex;
    const wrong = submitted && selected !== undefined && !correct;
    return (_jsxs("div", { className: `quiz-card${submitted ? (correct ? " correct" : wrong ? " wrong" : "") : ""}`, style: { padding: "14px", border: "1px solid rgba(255,255,255,0.09)", borderRadius: "8px", background: "rgba(255,255,255,0.035)" }, children: [_jsx("p", { className: "quiz-question", children: highlightElements(question.question) }), _jsx("div", { className: "quiz-options", style: { display: "grid", gap: "12px" }, children: question.options.map((opt, oi) => {
                    const isCorrect = oi === question.correctIndex;
                    let cls = "";
                    if (submitted) {
                        if (isCorrect)
                            cls = " correct";
                        else if (selected === oi)
                            cls = " wrong";
                    }
                    else if (selected === oi)
                        cls = " selected";
                    return _jsxs("button", { className: `quiz-option${cls}`, style: { display: "flex", alignItems: "center", gap: "10px", minHeight: "46px", padding: "0 16px", borderRadius: "8px", fontSize: "0.9rem", fontWeight: 800, textAlign: "left", width: "100%", cursor: "pointer" }, onClick: () => !submitted && onSelect(oi), disabled: submitted, children: [opt, submitted && isCorrect && _jsx(CheckCircle2, { size: 14, className: "quiz-mark" })] }, oi);
                }) }), submitted && wrong && _jsx("p", { className: "quiz-explanation", children: question.explanation })] }));
}
function normalize(v) { return v.toLowerCase().replace(/[^a-z0-9]+/g, ""); }
const elemPattern = /\b(H|He|Li|Be|B|C|N|O|F|Ne|Na|Mg|Al|Si|P|S|Cl|Ar|K|Ca|Fe|Cu|Zn|Br|I|Au|Hg|Pb)\b/g;
function highlightElements(text) {
    const parts = text.split(elemPattern);
    return parts.map((part, i) => {
        if (i % 2 === 1)
            return _jsx("span", { style: { color: "#2563eb", fontWeight: 900 }, children: part }, i);
        return part;
    });
}
function findMoleculeMatches(q) {
    const n = normalize(q);
    if (!n)
        return moleculePresets.slice(0, 4);
    return moleculePresets.filter((p) => [p.name, p.formula, p.id, ...(p.aliases ?? [])].some((t) => normalize(t).includes(n))).slice(0, 5);
}
function createLessonAudioContext() {
    const AudioContextCtor = window.AudioContext ?? window.webkitAudioContext;
    return AudioContextCtor ? new AudioContextCtor() : null;
}
function playQuizSuccessSound() {
    try {
        const audio = createLessonAudioContext();
        if (!audio)
            return;
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
    }
    catch {
        // Browser audio can be blocked by device settings; the visual feedback still runs.
    }
}
function playQuizFailureSound() {
    try {
        const audio = createLessonAudioContext();
        if (!audio)
            return;
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
    }
    catch {
        // Browser audio can be blocked by device settings; the visual feedback still runs.
    }
}
