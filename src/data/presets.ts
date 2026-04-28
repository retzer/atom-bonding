import type { MoleculePreset } from "../types";

export const moleculePresets: MoleculePreset[] = [
  {
    id: "h2",
    name: "Hydrogen gas",
    aliases: ["hydrogen", "hydrogen molecule"],
    formula: "H2",
    category: "covalent",
    atoms: [
      { symbol: "H", x: -34, y: 0 },
      { symbol: "H", x: 34, y: 0 }
    ],
    bonds: [
      { a: 0, b: 1, order: 1 }
    ],
    description: "Two hydrogen atoms share one pair of electrons so each reaches a filled first shell.",
    science: "A covalent single bond forms as the two 1s orbitals overlap and a shared electron pair lowers the energy."
  },
  {
    id: "o2",
    name: "Oxygen gas",
    aliases: ["oxygen", "oxygen molecule"],
    formula: "O2",
    category: "covalent",
    atoms: [
      { symbol: "O", x: -45, y: 0 },
      { symbol: "O", x: 45, y: 0 }
    ],
    bonds: [
      { a: 0, b: 1, order: 2 }
    ],
    description: "Oxygen atoms share two electron pairs, giving a double bond.",
    science: "Each oxygen has six valence electrons. Sharing two pairs completes both octets in this simplified model."
  },
  {
    id: "n2",
    name: "Nitrogen gas",
    aliases: ["nitrogen", "nitrogen molecule"],
    formula: "N2",
    category: "covalent",
    atoms: [
      { symbol: "N", x: -45, y: 0 },
      { symbol: "N", x: 45, y: 0 }
    ],
    bonds: [
      { a: 0, b: 1, order: 3 }
    ],
    description: "Nitrogen atoms share three electron pairs, forming a strong triple bond.",
    science: "A triple bond gives each nitrogen an octet while leaving one lone pair on each atom."
  },
  {
    id: "h2o",
    name: "Water",
    aliases: ["water", "dihydrogen monoxide"],
    formula: "H2O",
    category: "covalent",
    geometry: "Bent polar molecule",
    atoms: [
      { symbol: "O", x: 0, y: 0 },
      { symbol: "H", x: -58, y: 52 },
      { symbol: "H", x: 58, y: 52 }
    ],
    bonds: [
      { a: 0, b: 1, order: 1 },
      { a: 0, b: 2, order: 1 }
    ],
    description: "Oxygen shares electrons with two hydrogens, but pulls the shared electrons closer.",
    science: "The O-H bonds are polar covalent because oxygen is much more electronegative than hydrogen. The bent geometry gives water a molecular dipole."
  },
  {
    id: "co2",
    name: "Carbon dioxide",
    aliases: ["carbon dioxide", "co2"],
    formula: "CO2",
    category: "covalent",
    geometry: "Linear molecule",
    atoms: [
      { symbol: "O", x: -82, y: 0 },
      { symbol: "C", x: 0, y: 0 },
      { symbol: "O", x: 82, y: 0 }
    ],
    bonds: [
      { a: 0, b: 1, order: 2 },
      { a: 1, b: 2, order: 2 }
    ],
    description: "Carbon shares two electron pairs with each oxygen, making two double bonds.",
    science: "The C=O bonds are polar, but the linear arrangement cancels the bond dipoles in the overall molecule."
  },
  {
    id: "ch4",
    name: "Methane",
    aliases: ["methane", "natural gas"],
    formula: "CH4",
    category: "covalent",
    geometry: "Tetrahedral arrangement shown in 2D",
    atoms: [
      { symbol: "C", x: 0, y: 0 },
      { symbol: "H", x: -70, y: -52 },
      { symbol: "H", x: 70, y: -52 },
      { symbol: "H", x: -70, y: 55 },
      { symbol: "H", x: 70, y: 55 }
    ],
    bonds: [
      { a: 0, b: 1, order: 1 },
      { a: 0, b: 2, order: 1 },
      { a: 0, b: 3, order: 1 },
      { a: 0, b: 4, order: 1 }
    ],
    description: "Carbon shares one electron pair with each hydrogen, giving four single covalent bonds.",
    science: "Carbon reaches an octet by forming four sigma bonds. The real geometry is tetrahedral, represented here as a readable 2D layout."
  },
  {
    id: "nh3",
    name: "Ammonia",
    aliases: ["ammonia"],
    formula: "NH3",
    category: "covalent",
    geometry: "Trigonal pyramidal arrangement shown in 2D",
    atoms: [
      { symbol: "N", x: 0, y: 0 },
      { symbol: "H", x: -70, y: 44 },
      { symbol: "H", x: 0, y: -76 },
      { symbol: "H", x: 70, y: 44 }
    ],
    bonds: [
      { a: 0, b: 1, order: 1 },
      { a: 0, b: 2, order: 1 },
      { a: 0, b: 3, order: 1 }
    ],
    description: "Nitrogen shares electrons with three hydrogens and keeps one lone pair.",
    science: "Three N-H polar covalent bonds plus one lone pair make ammonia a polar molecule."
  },
  {
    id: "so2",
    name: "Sulfur dioxide",
    aliases: ["sulfur dioxide", "so2", "sulphur dioxide"],
    formula: "SO2",
    category: "covalent",
    geometry: "Bent molecule with one lone pair on sulfur",
    atoms: [
      { symbol: "S", x: 0, y: 0 },
      { symbol: "O", x: -72, y: 48 },
      { symbol: "O", x: 72, y: 48 }
    ],
    bonds: [
      { a: 0, b: 1, order: 2 },
      { a: 0, b: 2, order: 2 }
    ],
    description: "Sulfur bonds to two oxygens and keeps a lone pair, bending the molecule.",
    science: "SO2 is modeled as two polar S-O bonds and one lone pair on sulfur. The electron domains make the molecule bent rather than linear."
  },
  {
    id: "nacl",
    name: "Sodium chloride",
    aliases: ["sodium chloride", "salt", "table salt"],
    formula: "NaCl",
    category: "ionic",
    atoms: [
      { symbol: "Na", x: -58, y: 0 },
      { symbol: "Cl", x: 58, y: 0 }
    ],
    description: "Sodium transfers an electron to chlorine, forming Na+ and Cl- ions that attract.",
    science: "The large electronegativity difference favors electron transfer. Electrostatic attraction holds the ions together."
  },
  {
    id: "mgo",
    name: "Magnesium oxide",
    aliases: ["magnesium oxide"],
    formula: "MgO",
    category: "ionic",
    atoms: [
      { symbol: "Mg", x: -58, y: 0 },
      { symbol: "O", x: 58, y: 0 }
    ],
    description: "Magnesium transfers valence electrons to oxygen, producing Mg2+ and O2- in the simplified view.",
    science: "Magnesium has low electronegativity and oxygen has high electronegativity, so ionic bonding is favored."
  },
  {
    id: "benzene",
    name: "Benzene",
    aliases: ["benzene", "c6h6", "aromatic ring"],
    formula: "C6H6",
    category: "advanced",
    geometry: "Flat aromatic ring shown with alternating bonds",
    atoms: [
      { symbol: "C", x: 0, y: -118 },
      { symbol: "C", x: 102, y: -59 },
      { symbol: "C", x: 102, y: 59 },
      { symbol: "C", x: 0, y: 118 },
      { symbol: "C", x: -102, y: 59 },
      { symbol: "C", x: -102, y: -59 },
      { symbol: "H", x: 0, y: -210 },
      { symbol: "H", x: 182, y: -105 },
      { symbol: "H", x: 182, y: 105 },
      { symbol: "H", x: 0, y: 210 },
      { symbol: "H", x: -182, y: 105 },
      { symbol: "H", x: -182, y: -105 }
    ],
    bonds: [
      { a: 0, b: 1, order: 2 },
      { a: 1, b: 2, order: 1 },
      { a: 2, b: 3, order: 2 },
      { a: 3, b: 4, order: 1 },
      { a: 4, b: 5, order: 2 },
      { a: 5, b: 0, order: 1 },
      { a: 0, b: 6, order: 1 },
      { a: 1, b: 7, order: 1 },
      { a: 2, b: 8, order: 1 },
      { a: 3, b: 9, order: 1 },
      { a: 4, b: 10, order: 1 },
      { a: 5, b: 11, order: 1 }
    ],
    description: "Six carbon atoms form a flat ring, each bonded to one hydrogen. The alternating lines are a readable 2D stand-in for benzene's aromatic electron cloud.",
    science: "Real benzene has delocalized pi electrons shared across the ring rather than fixed single and double bonds. This phase-one model uses alternating bond orders so the simulator can show a recognizable aromatic structure."
  },
  {
    id: "ethanol",
    name: "Ethanol",
    aliases: ["ethanol", "ethyl alcohol", "c2h6o"],
    formula: "C2H6O",
    category: "advanced",
    geometry: "Carbon chain with polar hydroxyl group",
    atoms: [
      { symbol: "C", x: -142, y: 0 },
      { symbol: "C", x: -12, y: 0 },
      { symbol: "O", x: 112, y: 0 },
      { symbol: "H", x: 198, y: 20 },
      { symbol: "H", x: -214, y: -76 },
      { symbol: "H", x: -230, y: 42 },
      { symbol: "H", x: -138, y: 102 },
      { symbol: "H", x: -10, y: -98 },
      { symbol: "H", x: 14, y: 96 }
    ],
    bonds: [
      { a: 0, b: 1, order: 1 },
      { a: 1, b: 2, order: 1 },
      { a: 2, b: 3, order: 1 },
      { a: 0, b: 4, order: 1 },
      { a: 0, b: 5, order: 1 },
      { a: 0, b: 6, order: 1 },
      { a: 1, b: 7, order: 1 },
      { a: 1, b: 8, order: 1 }
    ],
    description: "Ethanol has a two-carbon chain and an O-H group that makes one end polar.",
    science: "The C-C and C-H bonds are mostly nonpolar covalent. The C-O and O-H bonds are polar, which is why ethanol can hydrogen-bond with water."
  },
  {
    id: "metallic-na",
    name: "Metallic sodium",
    aliases: ["metallic sodium", "sodium metal", "sodium lattice"],
    formula: "Na lattice",
    category: "metallic",
    metallic: true,
    atoms: [
      { symbol: "Na", x: -160, y: -110 },
      { symbol: "Na", x: 0, y: -110 },
      { symbol: "Na", x: 160, y: -110 },
      { symbol: "Na", x: -160, y: 30 },
      { symbol: "Na", x: 0, y: 30 },
      { symbol: "Na", x: 160, y: 30 },
      { symbol: "Na", x: -80, y: 170 },
      { symbol: "Na", x: 80, y: 170 }
    ],
    description: "Metal atoms form a lattice of positive ions with mobile, delocalized electrons moving through it.",
    science: "Metallic bonding is modeled as attraction between metal cations and a shared sea of electrons, explaining conductivity and malleability."
  }
];

export const presetById = Object.fromEntries(moleculePresets.map((preset) => [preset.id, preset])) as Record<string, MoleculePreset>;
