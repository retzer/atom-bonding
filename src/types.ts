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

export type AtomSymbol =
  | "H"
  | "He"
  | "Li"
  | "Be"
  | "B"
  | "C"
  | "N"
  | "O"
  | "F"
  | "Ne"
  | "Na"
  | "Mg"
  | "Al"
  | "Si"
  | "P"
  | "S"
  | "Cl"
  | "Ar"
  | "K"
  | "Ca"
  | "Sc"
  | "Ti"
  | "V"
  | "Cr"
  | "Mn"
  | "Zn"
  | "Ga"
  | "Ge"
  | "As"
  | "Se"
  | "Fe"
  | "Co"
  | "Ni"
  | "Cu"
  | "Ag"
  | "Br"
  | "Kr"
  | "Rb"
  | "Sr"
  | "Y"
  | "Zr"
  | "Mo"
  | "Pd"
  | "Cd"
  | "Sn"
  | "Sb"
  | "Te"
  | "I"
  | "Xe"
  | "Cs"
  | "Ba"
  | "W"
  | "Pt"
  | "Au"
  | "Hg"
  | "Pb"
  | "Bi";

export type ElementGroup =
  | "core-nonmetals"
  | "halogens"
  | "alkali-metals"
  | "alkaline-earth-metals"
  | "metalloids"
  | "transition-metals"
  | "noble-gases";

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

export type GuidedLesson = {
  id: string;
  title: string;
  presetId: string;
  steps: string[];
  focus: string;
};
