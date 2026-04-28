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

export type AtomSymbol =
  | "H"
  | "C"
  | "N"
  | "O"
  | "F"
  | "Ne"
  | "Na"
  | "Mg"
  | "Si"
  | "S"
  | "Cl"
  | "Ar"
  | "K"
  | "Ca"
  | "Fe"
  | "Cu"
  | "Br"
  | "I";

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
  vx: number;
  vy: number;
  radius: number;
  charge: number;
  bonds: string[];
  targetX?: number;
  targetY?: number;
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
  showShells: boolean;
  showLabels: boolean;
  advanced: boolean;
  selectedElements: AtomSymbol[];
};

export type MoleculePreset = {
  id: string;
  name: string;
  formula: string;
  category: "covalent" | "ionic" | "metallic" | "advanced";
  atoms: Array<{ symbol: AtomSymbol; x: number; y: number }>;
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
