export type BondKind =
  | "nonpolar-covalent"
  | "polar-covalent"
  | "ionic"
  | "metallic"
  | "hydrogen"
  | "dispersion";

export type AppMode = "free" | "guided" | "presets";
export type ThemeMode = "dark" | "light";
export type VisualStyle = "detailed" | "simple-neutral" | "simple-colored";
export type ProjectionMode = "orthographic" | "soft-perspective" | "deep-perspective";
export type CameraPreset = "free" | "top" | "side" | "isometric";
export type StructureDisplayMode = "full" | "simplified" | "skeleton";
export type AnalysisMode = "structure" | "chemistry";
export type GeometryMode = "rigid" | "flexible";
export type GraphicsQuality = "low" | "medium" | "high" | "very-high";

export type AtomSymbol = PeriodicElementSymbol;

export type ElementGroup = PeriodicElementCategory;

export type AtomDefinition = {
  symbol: AtomSymbol;
  name: string;
  atomicNumber: number;
  valenceElectrons: number;
  electronegativity: number;
  covalentRadius: number;
  shellSummary: string;
  typicalBonds: number;
  maxBonds: number;
  color: string;
  glow: string;
  behavior: string;
  group: ElementGroup;
  metal?: boolean;
  nobleGas?: boolean;
};

export type AtomParticle = {
  id: string;
  symbol: AtomSymbol;
  x: number;
  y: number;
  z?: number;
  vx: number;
  vy: number;
  vz?: number;
  radius: number;
  charge: number;
  bonds: string[];
  targetX?: number;
  targetY?: number;
  targetZ?: number;
  guided?: boolean;
};

export type Bond = {
  id: string;
  a: string;
  b: string;
  kind: BondKind;
  order: 1 | 2 | 3;
  strength: number;
  length: number;
  formedAt: number;
  polarity: number;
  electronShift?: string;
};

export type ElectronEffect = {
  id: string;
  from: string;
  to: string;
  progress: number;
  kind: "share" | "transfer" | "delocalized";
};

export type HydrogenBond = {
  id: string;
  hydrogen: string;
  donor: string;
  acceptor: string;
  distance: number;
  strength: number;
};

export type BondEvent = {
  id: string;
  time: number;
  title: string;
  plain: string;
  science: string;
  bondId?: string;
};

export type MetallicElectron = {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
};

export type SimulationState = {
  atoms: AtomParticle[];
  bonds: Bond[];
  hydrogenBonds: HydrogenBond[];
  effects: ElectronEffect[];
  metallicElectrons: MetallicElectron[];
  events: BondEvent[];
  selectedAtomId: string | null;
  selectedBondId: string | null;
  time: number;
  metallicLattice: boolean;
};

export type SimulationSettings = {
  temperature: number;
  atomCount: number;
  speed: number;
  collisionStrength: number;
  electronegativityEmphasis: number;
  bondingDistance: number;
  zoom: number;
  theme: ThemeMode;
  visualStyle: VisualStyle;
  graphicsQuality: GraphicsQuality;
  projectionMode: ProjectionMode;
  cameraPreset: CameraPreset;
  lightYaw: number;
  lightPitch: number;
  lightIntensity: number;
  lightColor: string;
  showShells: boolean;
  showLabels: boolean;
  displayMode: StructureDisplayMode;
  analysisMode: AnalysisMode;
  showElectronRegions: boolean;
  showBondDipoles: boolean;
  showNetDipole: boolean;
  showCharges: boolean;
  showFunctionalGroups: boolean;
  focusMode: boolean;
  showElectronFlow: boolean;
  highlightLonePairs: boolean;
  geometryAssist: boolean;
  geometry3D: boolean;
  geometryMode: GeometryMode;
  relaxationStrength: number;
  advanced: boolean;
  selectedElements: AtomSymbol[];
};

export type MoleculePreset = {
  id: string;
  name: string;
  aliases?: string[];
  formula: string;
  category: "covalent" | "ionic" | "metallic" | "advanced";
  atoms: Array<{ symbol: AtomSymbol; x: number; y: number }>;
  bonds?: Array<{ a: number; b: number; order?: 1 | 2 | 3; kind?: BondKind }>;
  description: string;
  science: string;
  geometry?: string;
  metallic?: boolean;
};

export type QuizQuestion = {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
};

export type ViewportAnnotation = {
  type: "label" | "arrow" | "highlight" | "pulse";
  message: string;
  atomId?: string;
  bondId?: string;
  delay: number;
  duration: number;
};

export type LessonAnimationPart =
  | { type: "spawn"; symbol: AtomSymbol; x: number; y: number }
  | { type: "move"; atomIndex: number; targetX: number; targetY: number; duration?: number }
  | { type: "bond"; atomA: number; atomB: number }
  | { type: "ring"; atomIndex: number; color: string; radius: number }
  | { type: "text"; message: string; position: "center" | "top" | "bottom"; duration: number }
  | { type: "highlight"; atomIndex: number; color?: string; duration: number }
  | { type: "pulse"; atomIndex: number; duration: number }
  | { type: "arrow"; fromIndex: number; toIndex: number; color?: string; duration: number }
  | { type: "label"; atomIndex: number; text: string; position: "top" | "bottom" | "left" | "right"; duration: number }
  | { type: "particle"; fromAtom: number; toAtom: number; count: number; color: string; duration: number }
  | { type: "wait"; ms: number }
  | { type: "clear" }
  | { type: "nucleus"; x: number; y: number; protons: number; neutrons: number; radius?: number }
  | { type: "electrons"; atomIndex: number; shells: Array<{ radius: number; count: number; color?: string; orbit?: boolean }> }
  | { type: "electrons-at"; x: number; y: number; shells: Array<{ radius: number; count: number; color?: string; orbit?: boolean }> }
  | { type: "orbital"; atomIndex: number; count: number; radius: number; color?: string }
  | { type: "orbital-at"; x: number; y: number; count: number; radius: number; color?: string }
  | { type: "text-at"; x: number; y: number; message: string; anchor?: "top" | "bottom" | "left" | "right" }
  | { type: "grid"; x: number; y: number; cols: number; rows: number; cellW: number; cellH: number; cells: Array<{ label: string; sub?: string; bgColor?: string; textColor?: string; active?: boolean; ringColor?: string }> }
  | { type: "bar"; x: number; y: number; width: number; totalWidth: number; color: string; label?: string; sub?: string }
  | { type: "bar-group"; x: number; y: number; items: Array<{ width: number; color: string; label: string }> };

export type LessonStepAnimation = {
  parts: LessonAnimationPart[];
  autoAdvanceMs?: number;
  loop?: boolean;
  loopMs?: number;
};

export type LessonStep = {
  text: string;
  animation?: LessonStepAnimation;
  annotations?: ViewportAnnotation[];
  highlightAtomIds?: string[];
  highlightBondIds?: string[];
  autoAdvanceMs?: number;
};

export type GuidedLesson = {
  id: string;
  title: string;
  moduleId: string;
  moduleTitle: string;
  presetId: string;
  forceView?: "2d" | "3d";
  prerequisites?: string[];
  steps: LessonStep[];
  focus: string;
  quizzes?: QuizQuestion[];
};
import type { PeriodicElementCategory, PeriodicElementSymbol } from "./data/periodicTable";
