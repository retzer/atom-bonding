export type BondKind =
  | "nonpolar-covalent"
  | "polar-covalent"
  | "ionic"
  | "metallic"
  | "coordinate"
  | "hydrogen"
  | "dispersion";

export type AppMode = "free" | "guided" | "presets" | "composition";
export type ThemeMode = "dark" | "light";
export type VisualStyle = "detailed" | "simple-neutral" | "simple-colored";
export type ProjectionMode = "orthographic" | "soft-perspective" | "deep-perspective";
export type CameraPreset = "free" | "top" | "side" | "isometric";
export type StructureDisplayMode = "full" | "simplified" | "skeleton";
export type RenderStyle3D = "ball-stick" | "stick" | "wireframe";
export type AnalysisMode = "structure" | "chemistry";
export type GeometryMode = "rigid" | "flexible";
export type GraphicsQuality = "low" | "medium" | "high" | "very-high";
export type TimeDisplayMode = "clock" | "labeled" | "seconds" | "milliseconds" | "scientific";
export type DecayMode =
  | "stable"
  | "alpha"
  | "beta-minus"
  | "beta-plus"
  | "electron-capture"
  | "neutron-emission"
  | "proton-emission"
  | "gamma"
  | "spontaneous-fission";
export type IsotopeStability = "stable" | "radioactive" | "estimated" | "unknown";
export type IsotopeSource = "NIST" | "IAEA LiveChart/ENSDF" | "curated reference" | "local estimate";
export type IsotopeActivityLevel = "none" | "low" | "medium" | "high" | "extreme";
export type ElectronRenderMode2D = "particles" | "trails";
export type AtomicModel2D = "bohr" | "probability-cloud" | "rutherford" | "spdf" | "compact";
export type ChemistryDepth = "bridge" | "college" | "pro";
export type ReactionToolMode = "beginner" | "advanced";
export type ElectronSourceKind = "lone-pair" | "sigma-bond" | "pi-bond" | "radical" | "formal-charge" | "conjugated-region";
export type ElectronTargetKind = "atom" | "bond" | "antibond" | "proton" | "region";
export type MechanismGestureMode = "click" | "drag" | "shortcut" | "toolbar";

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
  protonCount?: number;
  neutronCount?: number;
  massNumber?: number;
  isotopeId?: string;
  isotopeCreatedAt?: number;
  isotopeChangedAt?: number;
  decayedFromIsotopeId?: string;
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

export type DecayProduct = {
  atomicNumber: number;
  symbol: AtomSymbol;
  massNumber: number;
  neutronCount: number;
};

export type DecayBranch = {
  mode: DecayMode;
  probability?: number;
  daughter?: DecayProduct;
  energyMeV?: number;
  description: string;
};

export type IsotopeRecord = {
  id: string;
  symbol: AtomSymbol;
  atomicNumber: number;
  massNumber: number;
  neutronCount: number;
  label: string;
  stable: boolean;
  stability: IsotopeStability;
  naturalAbundance?: number;
  halfLifeSeconds?: number | null;
  halfLifeLabel?: string;
  decayBranches: DecayBranch[];
  source: IsotopeSource;
  reference?: boolean;
  notes?: string;
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
  donorAtomId?: string;
};

export type ReactionActionType =
  | "form-bond"
  | "break-bond"
  | "increase-bond-order"
  | "decrease-bond-order"
  | "protonate"
  | "deprotonate"
  | "nucleophile-attack";

export type ReactionAction = {
  type: ReactionActionType;
  atomIds?: string[];
  bondId?: string;
};

export type ElectronSource = {
  id: string;
  kind: ElectronSourceKind;
  label: string;
  description: string;
  atomIds: string[];
  ownerAtomId?: string;
  bondId?: string;
  electronCount: number;
  x: number;
  y: number;
  z?: number;
  selectable: boolean;
  strength: number;
};

export type ElectronTarget = {
  id: string;
  kind: ElectronTargetKind;
  label: string;
  description: string;
  atomId?: string;
  bondId?: string;
  x: number;
  y: number;
  z?: number;
  acceptsElectrons: boolean;
  priority: number;
};

export type MechanismGesture = {
  id: string;
  sourceId: string;
  targetId: string;
  mode: MechanismGestureMode;
  actionHint?: ReactionActionType;
};

export type ReactionAtomDelta = {
  atomId: string;
  before: number | string;
  after: number | string;
  label: string;
};

export type ReactionBondDelta = {
  bondId: string;
  before: number | string;
  after: number | string;
  label: string;
};

export type ReactionScore = {
  valenceStress: number;
  angleStrain: number;
  chargeSeparation: number;
  polarityShift: number;
  relativeStability: number;
  notes: string[];
};

export type ReactionGhostBond = {
  a: string;
  b: string;
  order: 1 | 2 | 3;
  label: string;
};

export type ReactionFlowArrow = {
  fromAtomId: string;
  toAtomId: string;
  label: string;
  tone: "form" | "break" | "charge";
};

export type ReactionPreview = {
  id: string;
  action: ReactionAction;
  mechanism?: MechanismGesture;
  allowed: boolean;
  message: string;
  explanation: string;
  affectedAtomIds: string[];
  affectedBondIds: string[];
  ghostBonds: ReactionGhostBond[];
  breakingBondIds: string[];
  flowArrows: ReactionFlowArrow[];
  warnings: string[];
  scoreBefore: ReactionScore;
  scoreAfter?: ReactionScore;
  electronSources?: ElectronSource[];
  electronTargets?: ElectronTarget[];
  formalChargeDeltas?: ReactionAtomDelta[];
  bondOrderDeltas?: ReactionBondDelta[];
  hybridizationDeltas?: ReactionAtomDelta[];
  stabilityReasons?: string[];
  confirmRequired?: boolean;
};

export type ReactionStep = {
  id: string;
  action: ReactionAction;
  mechanism?: MechanismGesture;
  beforeFormula: string;
  afterFormula: string;
  affectedAtomIds: string[];
  affectedBondIds: string[];
  explanation: string;
  scoreDelta: number;
  simTime: number;
  timestamp: number;
  formalChargeDeltas?: ReactionAtomDelta[];
  bondOrderDeltas?: ReactionBondDelta[];
  hybridizationDeltas?: ReactionAtomDelta[];
  stabilityReasons?: string[];
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

export type NuclearEvent = {
  id: string;
  time: number;
  atomId: string;
  fromIsotopeId: string;
  toIsotopeId: string;
  fromLabel: string;
  toLabel: string;
  decayMode: DecayMode;
  x: number;
  y: number;
  z?: number;
  title: string;
  plain: string;
  science: string;
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
  nuclearEvents: NuclearEvent[];
  selectedAtomId: string | null;
  selectedBondId: string | null;
  time: number;
  metallicLattice: boolean;
};

export type ReactionHistoryEntry = {
  id: string;
  step: ReactionStep;
  before: SimulationState;
  after: SimulationState;
};

export type SimulationSettings = {
  temperature: number;
  atomCount: number;
  speed: number;
  timeMultiplier: number;
  timeDisplayMode: TimeDisplayMode;
  decayEnabled: boolean;
  showDecayEffects: boolean;
  showIsotopeLabels: boolean;
  geigerAudioEnabled: boolean;
  decayTeachingAcceleration: number;
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
  shellOpacity2D: number;
  shellSpacing2D: number;
  spdfLabelScale2D: number;
  valenceShellOnly2D: boolean;
  atomicModel2D: AtomicModel2D;
  electronColor2D: string;
  electronOpacity2D: number;
  electronRenderMode2D: ElectronRenderMode2D;
  lonePairColor2D: string;
  expansionScale2D: number;
  showLabels: boolean;
  showElementNames2D: boolean;
  displayMode: StructureDisplayMode;
  renderStyle3D: RenderStyle3D;
  analysisMode: AnalysisMode;
  chemistryDepth: ChemistryDepth;
  showElectronRegions: boolean;
  showBondTypes: boolean;
  showBondDipoles: boolean;
  showNetDipole: boolean;
  showCharges: boolean;
  showFunctionalGroups: boolean;
  focusMode: boolean;
  showOffscreenLabels: boolean;
  showElectronFlow: boolean;
  highlightLonePairs: boolean;
  reactionToolMode: ReactionToolMode;
  directReactionMode: boolean;
  showMechanismHandles: boolean;
  geometryAssist: boolean;
  geometry3D: boolean;
  geometryMode: GeometryMode;
  relaxationStrength: number;
  advanced: boolean;
  selectedElements: AtomSymbol[];
};

export type PubChemCompoundInfo = {
  cid: number;
  title?: string;
  iupacName?: string;
  synonyms: string[];
  molecularFormula?: string;
  molecularWeight?: number | string;
  exactMass?: number | string;
  canonicalSmiles?: string;
  isomericSmiles?: string;
  inchi?: string;
  inchiKey?: string;
  xlogp?: number | string;
  tpsa?: number | string;
  hBondDonorCount?: number;
  hBondAcceptorCount?: number;
  rotatableBondCount?: number;
  formalCharge?: number;
  complexity?: number | string;
  sourceUrl: string;
};

export type MoleculeAnalysis = {
  formula: string;
  atomCount: number;
  molarMass: number;
  atomCounts: Array<{ symbol: AtomSymbol; name: string; count: number; atomicMass: number | null }>;
  percentComposition: Array<{ symbol: AtomSymbol; percent: number; mass: number }>;
  bondCount: number;
  bondCounts: Array<{ kind: BondKind; label: string; count: number }>;
  bondOrderCounts: Array<{ order: 1 | 2 | 3; count: number }>;
  functionalGroups: Array<{ label: string; count: number }>;
  heteroAtoms: Array<{ symbol: AtomSymbol; count: number }>;
  ringCount: number;
  hydrogenBondCount: number;
  lonePairSummary: Array<{ symbol: AtomSymbol; atomCount: number; totalLonePairs: number }>;
  geometryHighlights: Array<{ atomId: string; symbol: AtomSymbol; axe: string; shape: string; lonePairs: number; bondedAtoms: number }>;
  polarity: {
    summary: string;
    averageBondPolarity: number;
    maxBondPolarity: number;
    estimatedDipole: number;
    polarBondCount: number;
    ionicBondCount: number;
  };
  warnings: string[];
};

export type ChemistryInspectTarget = {
  atomIds?: string[];
  bondIds?: string[];
  selectAtomId?: string | null;
  selectBondId?: string | null;
};

export type ChemAiInsight = {
  summary: string;
  takeaways: string[];
  caveats: string[];
  model?: string;
  generatedAt: number;
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
  pubChem?: PubChemCompoundInfo;
};

export type QuizQuestion = {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  conceptId?: ConceptId;
  difficulty?: "foundation" | "standard" | "challenge";
  variantOf?: string;
  reviewKind?: "lesson" | "module" | "cumulative" | "inline";
};

export type ConceptId =
  | "matter-atoms"
  | "subatomic-particles"
  | "proton-identity"
  | "charge-balance"
  | "isotopes"
  | "electron-shells"
  | "valence-electrons"
  | "atomic-models"
  | "periodic-patterns"
  | "metals-nonmetals"
  | "octet-duet"
  | "lewis-dots"
  | "electron-configuration"
  | "bond-type"
  | "covalent-sharing"
  | "ionic-transfer"
  | "metallic-bonding"
  | "electronegativity"
  | "dipoles"
  | "vsepr-regions"
  | "lone-pairs"
  | "imfs"
  | "reaction-energy"
  | "organic-structure"
  | "real-world-chemistry";

export type LearningObjective = {
  id: string;
  conceptId: ConceptId;
  text: string;
};

export type RecallPrompt = QuizQuestion & {
  id: string;
  conceptId: ConceptId;
  promptKind: "inline" | "quiz" | "assessment";
};

export type LessonBridge = {
  before: string[];
  today: string;
  keyIdea: string;
  commonMistake?: string;
};

export type ConceptProgress = {
  conceptId: ConceptId;
  seen: number;
  correct: number;
  lastSeenAt: number;
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
  | { type: "cloud-at"; x: number; y: number; radius: number; count?: number; color?: string; label?: string }
  | { type: "lewis"; x: number; y: number; symbol: string; dots: number; label?: string; color?: string }
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
  conceptIds?: ConceptId[];
  objectiveIds?: string[];
  bridge?: LessonBridge;
  recallPromptIds?: string[];
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
  conceptIds?: ConceptId[];
  objectiveIds?: string[];
  bridge?: LessonBridge;
  recallPromptIds?: string[];
};
import type { PeriodicElementCategory, PeriodicElementSymbol } from "./data/periodicTable";
