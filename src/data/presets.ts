import type { MoleculePreset } from "../types";

export const moleculePresets: MoleculePreset[] = [
  {
    id: "h2",
    name: "Hydrogen gas",
    formula: "H2",
    category: "covalent",
    atoms: [
      { symbol: "H", x: -34, y: 0 },
      { symbol: "H", x: 34, y: 0 }
    ],
    description: "Two hydrogen atoms share one pair of electrons so each reaches a filled first shell.",
    science: "A covalent single bond forms as the two 1s orbitals overlap and a shared electron pair lowers the energy."
  },
  {
    id: "o2",
    name: "Oxygen gas",
    formula: "O2",
    category: "covalent",
    atoms: [
      { symbol: "O", x: -45, y: 0 },
      { symbol: "O", x: 45, y: 0 }
    ],
    description: "Oxygen atoms share two electron pairs, giving a double bond.",
    science: "Each oxygen has six valence electrons. Sharing two pairs completes both octets in this simplified model."
  },
  {
    id: "n2",
    name: "Nitrogen gas",
    formula: "N2",
    category: "covalent",
    atoms: [
      { symbol: "N", x: -45, y: 0 },
      { symbol: "N", x: 45, y: 0 }
    ],
    description: "Nitrogen atoms share three electron pairs, forming a strong triple bond.",
    science: "A triple bond gives each nitrogen an octet while leaving one lone pair on each atom."
  },
  {
    id: "h2o",
    name: "Water",
    formula: "H2O",
    category: "covalent",
    geometry: "Bent polar molecule",
    atoms: [
      { symbol: "O", x: 0, y: 0 },
      { symbol: "H", x: -58, y: 52 },
      { symbol: "H", x: 58, y: 52 }
    ],
    description: "Oxygen shares electrons with two hydrogens, but pulls the shared electrons closer.",
    science: "The O-H bonds are polar covalent because oxygen is much more electronegative than hydrogen. The bent geometry gives water a molecular dipole."
  },
  {
    id: "co2",
    name: "Carbon dioxide",
    formula: "CO2",
    category: "covalent",
    geometry: "Linear molecule",
    atoms: [
      { symbol: "O", x: -82, y: 0 },
      { symbol: "C", x: 0, y: 0 },
      { symbol: "O", x: 82, y: 0 }
    ],
    description: "Carbon shares two electron pairs with each oxygen, making two double bonds.",
    science: "The C=O bonds are polar, but the linear arrangement cancels the bond dipoles in the overall molecule."
  },
  {
    id: "ch4",
    name: "Methane",
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
    description: "Carbon shares one electron pair with each hydrogen, giving four single covalent bonds.",
    science: "Carbon reaches an octet by forming four sigma bonds. The real geometry is tetrahedral, represented here as a readable 2D layout."
  },
  {
    id: "nh3",
    name: "Ammonia",
    formula: "NH3",
    category: "covalent",
    geometry: "Trigonal pyramidal arrangement shown in 2D",
    atoms: [
      { symbol: "N", x: 0, y: 0 },
      { symbol: "H", x: -70, y: 44 },
      { symbol: "H", x: 0, y: -76 },
      { symbol: "H", x: 70, y: 44 }
    ],
    description: "Nitrogen shares electrons with three hydrogens and keeps one lone pair.",
    science: "Three N-H polar covalent bonds plus one lone pair make ammonia a polar molecule."
  },
  {
    id: "nacl",
    name: "Sodium chloride",
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
    id: "metallic-na",
    name: "Metallic sodium",
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
