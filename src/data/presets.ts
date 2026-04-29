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
    id: "hcl",
    name: "Hydrogen chloride",
    aliases: ["hydrogen chloride", "hcl", "hydrochloric acid gas"],
    formula: "HCl",
    category: "covalent",
    geometry: "Linear polar diatomic molecule",
    atoms: [
      { symbol: "H", x: -56, y: 0 },
      { symbol: "Cl", x: 56, y: 0 }
    ],
    bonds: [
      { a: 0, b: 1, order: 1 }
    ],
    description: "Hydrogen and chlorine share one electron pair, but chlorine pulls the pair more strongly.",
    science: "H-Cl is a polar covalent bond. The electronegativity difference points the bond dipole toward chlorine."
  },
  {
    id: "hf",
    name: "Hydrogen fluoride",
    aliases: ["hydrogen fluoride", "hf"],
    formula: "HF",
    category: "covalent",
    geometry: "Linear strongly polar diatomic molecule",
    atoms: [
      { symbol: "H", x: -54, y: 0 },
      { symbol: "F", x: 54, y: 0 }
    ],
    bonds: [
      { a: 0, b: 1, order: 1 }
    ],
    description: "Fluorine shares a pair with hydrogen while pulling electron density strongly toward itself.",
    science: "HF is a useful extreme polar-covalent example because fluorine has the highest electronegativity in this model."
  },
  {
    id: "h2s",
    name: "Hydrogen sulfide",
    aliases: ["hydrogen sulfide", "hydrogen sulphide", "h2s"],
    formula: "H2S",
    category: "covalent",
    geometry: "Bent molecule with two lone pairs on sulfur",
    atoms: [
      { symbol: "S", x: 0, y: 0 },
      { symbol: "H", x: -68, y: 56 },
      { symbol: "H", x: 68, y: 56 }
    ],
    bonds: [
      { a: 0, b: 1, order: 1 },
      { a: 0, b: 2, order: 1 }
    ],
    description: "Sulfur shares electrons with two hydrogens and keeps two lone pairs.",
    science: "The two lone pairs compress the H-S-H angle, making hydrogen sulfide bent and weakly polar."
  },
  {
    id: "pcl3",
    name: "Phosphorus trichloride",
    aliases: ["phosphorus trichloride", "pcl3"],
    formula: "PCl3",
    category: "covalent",
    geometry: "Trigonal pyramidal molecule",
    atoms: [
      { symbol: "P", x: 0, y: 0 },
      { symbol: "Cl", x: -82, y: 54 },
      { symbol: "Cl", x: 0, y: -88 },
      { symbol: "Cl", x: 82, y: 54 }
    ],
    bonds: [
      { a: 0, b: 1, order: 1 },
      { a: 0, b: 2, order: 1 },
      { a: 0, b: 3, order: 1 }
    ],
    description: "Phosphorus shares one electron pair with each chlorine and keeps a lone pair.",
    science: "Three bonding regions and one lone pair give PCl3 a trigonal pyramidal VSEPR shape."
  },
  {
    id: "bcl3",
    name: "Boron trichloride",
    aliases: ["boron trichloride", "bcl3"],
    formula: "BCl3",
    category: "covalent",
    geometry: "Trigonal planar electron-deficient molecule",
    atoms: [
      { symbol: "B", x: 0, y: 0 },
      { symbol: "Cl", x: -86, y: 52 },
      { symbol: "Cl", x: 0, y: -96 },
      { symbol: "Cl", x: 86, y: 52 }
    ],
    bonds: [
      { a: 0, b: 1, order: 1 },
      { a: 0, b: 2, order: 1 },
      { a: 0, b: 3, order: 1 }
    ],
    description: "Boron forms three covalent bonds and remains electron deficient in this simplified octet view.",
    science: "With three bonding regions and no lone pairs on boron, BCl3 is trigonal planar."
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
    id: "lif",
    name: "Lithium fluoride",
    aliases: ["lithium fluoride", "lif"],
    formula: "LiF",
    category: "ionic",
    atoms: [
      { symbol: "Li", x: -58, y: 0 },
      { symbol: "F", x: 58, y: 0 }
    ],
    description: "Lithium tends to lose one electron while fluorine tends to gain one.",
    science: "LiF is a classic one-electron ionic transfer example with a large electronegativity difference."
  },
  {
    id: "kbr",
    name: "Potassium bromide",
    aliases: ["potassium bromide", "kbr"],
    formula: "KBr",
    category: "ionic",
    atoms: [
      { symbol: "K", x: -62, y: 0 },
      { symbol: "Br", x: 62, y: 0 }
    ],
    description: "Potassium transfers an electron to bromine, creating oppositely charged ions.",
    science: "KBr illustrates an alkali metal plus halogen ionic compound."
  },
  {
    id: "cao",
    name: "Calcium oxide",
    aliases: ["calcium oxide", "quicklime", "cao"],
    formula: "CaO",
    category: "ionic",
    atoms: [
      { symbol: "Ca", x: -66, y: 0 },
      { symbol: "O", x: 66, y: 0 }
    ],
    description: "Calcium can lose two valence electrons while oxygen accepts electron density.",
    science: "CaO is an alkaline earth metal oxide, modeled as strong ionic attraction between Ca and O."
  },
  {
    id: "cscl",
    name: "Cesium chloride",
    aliases: ["cesium chloride", "caesium chloride", "cscl"],
    formula: "CsCl",
    category: "ionic",
    atoms: [
      { symbol: "Cs", x: -70, y: 0 },
      { symbol: "Cl", x: 70, y: 0 }
    ],
    description: "Cesium readily gives up one valence electron to chlorine.",
    science: "CsCl is another alkali metal halide, useful for comparing ion size and electrostatic attraction."
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
    id: "methanol",
    name: "Methanol",
    aliases: ["methanol", "methyl alcohol", "ch4o"],
    formula: "CH4O",
    category: "advanced",
    geometry: "Tetrahedral carbon with a polar hydroxyl group",
    atoms: [
      { symbol: "C", x: -64, y: 0 },
      { symbol: "O", x: 58, y: 0 },
      { symbol: "H", x: 138, y: 34 },
      { symbol: "H", x: -130, y: -72 },
      { symbol: "H", x: -142, y: 44 },
      { symbol: "H", x: -54, y: 94 }
    ],
    bonds: [
      { a: 0, b: 1, order: 1 },
      { a: 1, b: 2, order: 1 },
      { a: 0, b: 3, order: 1 },
      { a: 0, b: 4, order: 1 },
      { a: 0, b: 5, order: 1 }
    ],
    description: "Methanol is the smallest alcohol, with one carbon attached to an O-H group.",
    science: "The hydroxyl group creates polar C-O and O-H bonds, while the carbon center remains tetrahedral."
  },
  {
    id: "formaldehyde",
    name: "Formaldehyde",
    aliases: ["formaldehyde", "methanal", "ch2o"],
    formula: "CH2O",
    category: "advanced",
    geometry: "Trigonal planar carbonyl molecule",
    atoms: [
      { symbol: "C", x: 0, y: 0 },
      { symbol: "O", x: 92, y: 0 },
      { symbol: "H", x: -66, y: -62 },
      { symbol: "H", x: -66, y: 62 }
    ],
    bonds: [
      { a: 0, b: 1, order: 2 },
      { a: 0, b: 2, order: 1 },
      { a: 0, b: 3, order: 1 }
    ],
    description: "Formaldehyde shows a compact carbonyl group: a carbon double-bonded to oxygen.",
    science: "The C=O bond is strongly polar and the carbonyl carbon is trigonal planar in the simplified VSEPR picture."
  },
  {
    id: "acetic-acid",
    name: "Acetic acid",
    aliases: ["acetic acid", "ethanoic acid", "vinegar", "c2h4o2"],
    formula: "C2H4O2",
    category: "advanced",
    geometry: "Methyl group attached to a carboxylic acid",
    atoms: [
      { symbol: "C", x: -116, y: 0 },
      { symbol: "C", x: 18, y: 0 },
      { symbol: "O", x: 124, y: -42 },
      { symbol: "O", x: 116, y: 66 },
      { symbol: "H", x: 196, y: 90 },
      { symbol: "H", x: -186, y: -76 },
      { symbol: "H", x: -204, y: 42 },
      { symbol: "H", x: -112, y: 102 }
    ],
    bonds: [
      { a: 0, b: 1, order: 1 },
      { a: 1, b: 2, order: 2 },
      { a: 1, b: 3, order: 1 },
      { a: 3, b: 4, order: 1 },
      { a: 0, b: 5, order: 1 },
      { a: 0, b: 6, order: 1 },
      { a: 0, b: 7, order: 1 }
    ],
    description: "Acetic acid combines a methyl group with a carboxylic acid group.",
    science: "The carboxyl group contains both a carbonyl bond and an O-H bond, making it a strong functional-group example."
  },
  {
    id: "acetone",
    name: "Acetone",
    aliases: ["acetone", "propanone", "c3h6o"],
    formula: "C3H6O",
    category: "advanced",
    geometry: "Central carbonyl with two methyl groups",
    atoms: [
      { symbol: "C", x: -118, y: 0 },
      { symbol: "C", x: 0, y: 0 },
      { symbol: "C", x: 118, y: 0 },
      { symbol: "O", x: 0, y: -104 },
      { symbol: "H", x: -192, y: -70 },
      { symbol: "H", x: -202, y: 48 },
      { symbol: "H", x: -118, y: 102 },
      { symbol: "H", x: 192, y: -70 },
      { symbol: "H", x: 202, y: 48 },
      { symbol: "H", x: 118, y: 102 }
    ],
    bonds: [
      { a: 0, b: 1, order: 1 },
      { a: 1, b: 2, order: 1 },
      { a: 1, b: 3, order: 2 },
      { a: 0, b: 4, order: 1 },
      { a: 0, b: 5, order: 1 },
      { a: 0, b: 6, order: 1 },
      { a: 2, b: 7, order: 1 },
      { a: 2, b: 8, order: 1 },
      { a: 2, b: 9, order: 1 }
    ],
    description: "Acetone places a carbonyl group between two methyl groups.",
    science: "The central C=O group dominates polarity, while the methyl groups form a nonpolar hydrocarbon frame."
  },
  {
    id: "glucose-linear",
    name: "Linear glucose",
    aliases: ["glucose", "linear glucose", "d-glucose", "dextrose", "c6h12o6"],
    formula: "C6H12O6",
    category: "advanced",
    geometry: "Open-chain glucose with an aldehyde carbonyl",
    atoms: [
      { symbol: "C", x: -270, y: 0 },
      { symbol: "C", x: -170, y: 0 },
      { symbol: "C", x: -70, y: 0 },
      { symbol: "C", x: 30, y: 0 },
      { symbol: "C", x: 130, y: 0 },
      { symbol: "C", x: 230, y: 0 },
      { symbol: "O", x: -270, y: -92 },
      { symbol: "O", x: -170, y: -82 },
      { symbol: "O", x: -70, y: 82 },
      { symbol: "O", x: 30, y: -82 },
      { symbol: "O", x: 130, y: 82 },
      { symbol: "O", x: 230, y: -82 },
      { symbol: "H", x: -322, y: 62 },
      { symbol: "H", x: -170, y: 82 },
      { symbol: "H", x: -70, y: -82 },
      { symbol: "H", x: 30, y: 82 },
      { symbol: "H", x: 130, y: -82 },
      { symbol: "H", x: 280, y: 52 },
      { symbol: "H", x: 244, y: 94 },
      { symbol: "H", x: -222, y: -126 },
      { symbol: "H", x: -18, y: 126 },
      { symbol: "H", x: 82, y: -126 },
      { symbol: "H", x: 178, y: 126 },
      { symbol: "H", x: 282, y: -126 }
    ],
    bonds: [
      { a: 0, b: 1, order: 1 },
      { a: 1, b: 2, order: 1 },
      { a: 2, b: 3, order: 1 },
      { a: 3, b: 4, order: 1 },
      { a: 4, b: 5, order: 1 },
      { a: 0, b: 6, order: 2 },
      { a: 1, b: 7, order: 1 },
      { a: 2, b: 8, order: 1 },
      { a: 3, b: 9, order: 1 },
      { a: 4, b: 10, order: 1 },
      { a: 5, b: 11, order: 1 },
      { a: 0, b: 12, order: 1 },
      { a: 1, b: 13, order: 1 },
      { a: 2, b: 14, order: 1 },
      { a: 3, b: 15, order: 1 },
      { a: 4, b: 16, order: 1 },
      { a: 5, b: 17, order: 1 },
      { a: 5, b: 18, order: 1 },
      { a: 7, b: 19, order: 1 },
      { a: 8, b: 20, order: 1 },
      { a: 9, b: 21, order: 1 },
      { a: 10, b: 22, order: 1 },
      { a: 11, b: 23, order: 1 }
    ],
    description: "Open-chain glucose has an aldehyde group at C1 and several hydroxyl groups along the carbon chain.",
    science: "In water, glucose often cyclizes when the C5 hydroxyl oxygen attacks the C1 carbonyl carbon, forming a six-membered glucopyranose ring."
  },
  {
    id: "glucose-ring",
    name: "Cyclic glucose",
    aliases: ["cyclic glucose", "glucopyranose", "alpha glucose", "beta glucose", "glucose ring"],
    formula: "C6H12O6",
    category: "advanced",
    geometry: "Six-membered glucopyranose ring",
    atoms: [
      { symbol: "C", x: 94, y: -58 },
      { symbol: "C", x: 104, y: 56 },
      { symbol: "C", x: 0, y: 112 },
      { symbol: "C", x: -104, y: 56 },
      { symbol: "C", x: -94, y: -58 },
      { symbol: "C", x: -188, y: -112 },
      { symbol: "O", x: 188, y: -92 },
      { symbol: "O", x: 196, y: 92 },
      { symbol: "O", x: 0, y: 208 },
      { symbol: "O", x: -194, y: 92 },
      { symbol: "O", x: 0, y: -118 },
      { symbol: "O", x: -268, y: -92 },
      { symbol: "H", x: 150, y: -6 },
      { symbol: "H", x: 72, y: 140 },
      { symbol: "H", x: -64, y: 146 },
      { symbol: "H", x: -146, y: 0 },
      { symbol: "H", x: -150, y: -96 },
      { symbol: "H", x: -214, y: -184 },
      { symbol: "H", x: -220, y: -38 },
      { symbol: "H", x: 260, y: 120 },
      { symbol: "H", x: 62, y: 252 },
      { symbol: "H", x: -258, y: 122 },
      { symbol: "H", x: 262, y: -116 },
      { symbol: "H", x: -334, y: -108 }
    ],
    bonds: [
      { a: 10, b: 0, order: 1 },
      { a: 0, b: 1, order: 1 },
      { a: 1, b: 2, order: 1 },
      { a: 2, b: 3, order: 1 },
      { a: 3, b: 4, order: 1 },
      { a: 4, b: 10, order: 1 },
      { a: 4, b: 5, order: 1 },
      { a: 5, b: 11, order: 1 },
      { a: 0, b: 6, order: 1 },
      { a: 1, b: 7, order: 1 },
      { a: 2, b: 8, order: 1 },
      { a: 3, b: 9, order: 1 },
      { a: 0, b: 12, order: 1 },
      { a: 1, b: 13, order: 1 },
      { a: 2, b: 14, order: 1 },
      { a: 3, b: 15, order: 1 },
      { a: 4, b: 16, order: 1 },
      { a: 5, b: 17, order: 1 },
      { a: 5, b: 18, order: 1 },
      { a: 7, b: 19, order: 1 },
      { a: 8, b: 20, order: 1 },
      { a: 9, b: 21, order: 1 },
      { a: 6, b: 22, order: 1 },
      { a: 11, b: 23, order: 1 }
    ],
    description: "Cyclic glucose forms when the open chain folds and the C5 oxygen becomes part of a six-membered ring.",
    science: "The new C1-O5 bond converts the aldehyde into a hemiacetal. The ring form is the dominant simplified structure shown for glucose in water."
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
  },
  {
    id: "metallic-mg",
    name: "Metallic magnesium",
    aliases: ["metallic magnesium", "magnesium metal", "magnesium lattice"],
    formula: "Mg lattice",
    category: "metallic",
    metallic: true,
    atoms: [
      { symbol: "Mg", x: -160, y: -110 },
      { symbol: "Mg", x: 0, y: -110 },
      { symbol: "Mg", x: 160, y: -110 },
      { symbol: "Mg", x: -160, y: 30 },
      { symbol: "Mg", x: 0, y: 30 },
      { symbol: "Mg", x: 160, y: 30 },
      { symbol: "Mg", x: -80, y: 170 },
      { symbol: "Mg", x: 80, y: 170 }
    ],
    description: "Magnesium atoms pack into a metallic lattice with mobile valence electrons.",
    science: "Magnesium contributes two valence electrons per atom in the simplified metallic bonding picture."
  },
  {
    id: "metallic-fe",
    name: "Metallic iron",
    aliases: ["metallic iron", "iron metal", "iron lattice"],
    formula: "Fe lattice",
    category: "metallic",
    metallic: true,
    atoms: [
      { symbol: "Fe", x: -160, y: -110 },
      { symbol: "Fe", x: 0, y: -110 },
      { symbol: "Fe", x: 160, y: -110 },
      { symbol: "Fe", x: -160, y: 30 },
      { symbol: "Fe", x: 0, y: 30 },
      { symbol: "Fe", x: 160, y: 30 },
      { symbol: "Fe", x: -80, y: 170 },
      { symbol: "Fe", x: 80, y: 170 }
    ],
    description: "Iron is shown as a compact metallic lattice with delocalized electrons.",
    science: "Transition metals have metallic bonding with delocalized electrons; this simplified view emphasizes the shared electron sea."
  },
  {
    id: "metallic-cu",
    name: "Metallic copper",
    aliases: ["metallic copper", "copper metal", "copper lattice"],
    formula: "Cu lattice",
    category: "metallic",
    metallic: true,
    atoms: [
      { symbol: "Cu", x: -160, y: -110 },
      { symbol: "Cu", x: 0, y: -110 },
      { symbol: "Cu", x: 160, y: -110 },
      { symbol: "Cu", x: -160, y: 30 },
      { symbol: "Cu", x: 0, y: 30 },
      { symbol: "Cu", x: 160, y: 30 },
      { symbol: "Cu", x: -80, y: 170 },
      { symbol: "Cu", x: 80, y: 170 }
    ],
    description: "Copper shows metallic bonding through a lattice of atoms and mobile electrons.",
    science: "The mobile electron model helps explain copper's excellent electrical conductivity."
  }
];

export const presetById = Object.fromEntries(moleculePresets.map((preset) => [preset.id, preset])) as Record<string, MoleculePreset>;
