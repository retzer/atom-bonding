// Supplemental element discovery and description data. Discovery credits come from Wikidata; descriptions are generated from the app's periodic-table facts.

import type { AtomSymbol } from "../types";

export type ElementDetail = {
  discoveredBy: string;
  discoveryYear: string;
  discoveryText: string;
  description: string;
  sourceTitle: string;
  wikidataId: string;
};

export const elementDetails: Record<AtomSymbol, ElementDetail> = {
  "H": {
    "discoveredBy": "Henry Cavendish",
    "discoveryYear": "1766",
    "discoveryText": "Henry Cavendish, 1766",
    "description": "Hydrogen is a nonmetal with symbol H and atomic number 1. At room conditions, its standard state is a gas. It is placed in period 1, group 1. It has 1 valence electron, which strongly shapes its bonding behavior.",
    "sourceTitle": "Hydrogen",
    "wikidataId": "Q556"
  },
  "He": {
    "discoveredBy": "William Ramsay, Pierre Janssen, Norman Lockyer",
    "discoveryYear": "1868",
    "discoveryText": "William Ramsay, Pierre Janssen, Norman Lockyer, 1868",
    "description": "Helium is a noble gas with symbol He and atomic number 2. At room conditions, its standard state is a gas. It is placed in period 1, group 18. It has 2 valence electrons, which strongly shape its bonding behavior.",
    "sourceTitle": "Helium",
    "wikidataId": "Q560"
  },
  "Li": {
    "discoveredBy": "Johan August Arfwedson",
    "discoveryYear": "1817",
    "discoveryText": "Johan August Arfwedson, 1817",
    "description": "Lithium is an alkali metal with symbol Li and atomic number 3. At room conditions, its standard state is a solid. It is placed in period 2, group 1. It has 1 valence electron, which strongly shapes its bonding behavior.",
    "sourceTitle": "Lithium",
    "wikidataId": "Q568"
  },
  "Be": {
    "discoveredBy": "Antoine Bussy, Louis Nicolas Vauquelin, Friedrich Wöhler",
    "discoveryYear": "1798",
    "discoveryText": "Antoine Bussy, Louis Nicolas Vauquelin, Friedrich Wöhler, 1798",
    "description": "Beryllium is an alkaline earth metal with symbol Be and atomic number 4. At room conditions, its standard state is a solid. It is placed in period 2, group 2. It has 2 valence electrons, which strongly shape its bonding behavior.",
    "sourceTitle": "Beryllium",
    "wikidataId": "Q569"
  },
  "B": {
    "discoveredBy": "Humphry Davy",
    "discoveryYear": "1808",
    "discoveryText": "Humphry Davy, 1808",
    "description": "Boron is a metalloid with symbol B and atomic number 5. At room conditions, its standard state is a solid. It is placed in period 2, group 13. It has 3 valence electrons, which strongly shape its bonding behavior.",
    "sourceTitle": "Boron",
    "wikidataId": "Q618"
  },
  "C": {
    "discoveredBy": "Known since antiquity",
    "discoveryYear": "Ancient",
    "discoveryText": "Known since antiquity",
    "description": "Carbon is a nonmetal with symbol C and atomic number 6. At room conditions, its standard state is a solid. It is placed in period 2, group 14. It has 4 valence electrons, which strongly shape its bonding behavior.",
    "sourceTitle": "Carbon",
    "wikidataId": "Q623"
  },
  "N": {
    "discoveredBy": "Daniel Rutherford",
    "discoveryYear": "1772",
    "discoveryText": "Daniel Rutherford, 1772",
    "description": "Nitrogen is a nonmetal with symbol N and atomic number 7. At room conditions, its standard state is a gas. It is placed in period 2, group 15. It has 5 valence electrons, which strongly shape its bonding behavior.",
    "sourceTitle": "Nitrogen",
    "wikidataId": "Q627"
  },
  "O": {
    "discoveredBy": "Carl Wilhelm Scheele",
    "discoveryYear": "1774",
    "discoveryText": "Carl Wilhelm Scheele, 1774",
    "description": "Oxygen is a nonmetal with symbol O and atomic number 8. At room conditions, its standard state is a gas. It is placed in period 2, group 16. It has 6 valence electrons, which strongly shape its bonding behavior.",
    "sourceTitle": "Oxygen",
    "wikidataId": "Q629"
  },
  "F": {
    "discoveredBy": "Henri Moissan, André-Marie Ampère",
    "discoveryYear": "1670",
    "discoveryText": "Henri Moissan, André-Marie Ampère, 1670",
    "description": "Fluorine is a halogen with symbol F and atomic number 9. At room conditions, its standard state is a gas. It is placed in period 2, group 17. It has 7 valence electrons, which strongly shape its bonding behavior.",
    "sourceTitle": "Fluorine",
    "wikidataId": "Q650"
  },
  "Ne": {
    "discoveredBy": "William Ramsay, Morris Travers",
    "discoveryYear": "1898",
    "discoveryText": "William Ramsay, Morris Travers, 1898",
    "description": "Neon is a noble gas with symbol Ne and atomic number 10. At room conditions, its standard state is a gas. It is placed in period 2, group 18. It has 8 valence electrons, which strongly shape its bonding behavior.",
    "sourceTitle": "Neon",
    "wikidataId": "Q654"
  },
  "Na": {
    "discoveredBy": "Humphry Davy",
    "discoveryYear": "1807",
    "discoveryText": "Humphry Davy, 1807",
    "description": "Sodium is an alkali metal with symbol Na and atomic number 11. At room conditions, its standard state is a solid. It is placed in period 3, group 1. It has 1 valence electron, which strongly shapes its bonding behavior.",
    "sourceTitle": "Sodium",
    "wikidataId": "Q658"
  },
  "Mg": {
    "discoveredBy": "Joseph Black",
    "discoveryYear": "1808",
    "discoveryText": "Joseph Black, 1808",
    "description": "Magnesium is an alkaline earth metal with symbol Mg and atomic number 12. At room conditions, its standard state is a solid. It is placed in period 3, group 2. It has 2 valence electrons, which strongly shape its bonding behavior.",
    "sourceTitle": "Magnesium",
    "wikidataId": "Q660"
  },
  "Al": {
    "discoveredBy": "Known since antiquity",
    "discoveryYear": "Ancient",
    "discoveryText": "Known since antiquity",
    "description": "Aluminum is a post-transition metal with symbol Al and atomic number 13. At room conditions, its standard state is a solid. It is placed in period 3, group 13. It has 3 valence electrons, which strongly shape its bonding behavior.",
    "sourceTitle": "Aluminium",
    "wikidataId": "Q663"
  },
  "Si": {
    "discoveredBy": "Jöns Jacob Berzelius",
    "discoveryYear": "1854",
    "discoveryText": "Jöns Jacob Berzelius, 1854",
    "description": "Silicon is a metalloid with symbol Si and atomic number 14. At room conditions, its standard state is a solid. It is placed in period 3, group 14. It has 4 valence electrons, which strongly shape its bonding behavior.",
    "sourceTitle": "Silicon",
    "wikidataId": "Q670"
  },
  "P": {
    "discoveredBy": "Hennig Brand",
    "discoveryYear": "1669",
    "discoveryText": "Hennig Brand, 1669",
    "description": "Phosphorus is a nonmetal with symbol P and atomic number 15. At room conditions, its standard state is a solid. It is placed in period 3, group 15. It has 5 valence electrons, which strongly shape its bonding behavior.",
    "sourceTitle": "Phosphorus",
    "wikidataId": "Q674"
  },
  "S": {
    "discoveredBy": "Known since antiquity",
    "discoveryYear": "Ancient",
    "discoveryText": "Known since antiquity",
    "description": "Sulfur is a nonmetal with symbol S and atomic number 16. At room conditions, its standard state is a solid. It is placed in period 3, group 16. It has 6 valence electrons, which strongly shape its bonding behavior.",
    "sourceTitle": "Sulfur",
    "wikidataId": "Q682"
  },
  "Cl": {
    "discoveredBy": "Carl Wilhelm Scheele",
    "discoveryYear": "1774",
    "discoveryText": "Carl Wilhelm Scheele, 1774",
    "description": "Chlorine is a halogen with symbol Cl and atomic number 17. At room conditions, its standard state is a gas. It is placed in period 3, group 17. It has 7 valence electrons, which strongly shape its bonding behavior.",
    "sourceTitle": "Chlorine",
    "wikidataId": "Q688"
  },
  "Ar": {
    "discoveredBy": "William Ramsay, John Strutt, 3rd Baron Rayleigh",
    "discoveryYear": "1894",
    "discoveryText": "William Ramsay, John Strutt, 3rd Baron Rayleigh, 1894",
    "description": "Argon is a noble gas with symbol Ar and atomic number 18. At room conditions, its standard state is a gas. It is placed in period 3, group 18. It has 8 valence electrons, which strongly shape its bonding behavior.",
    "sourceTitle": "Argon",
    "wikidataId": "Q696"
  },
  "K": {
    "discoveredBy": "Humphry Davy",
    "discoveryYear": "1807",
    "discoveryText": "Humphry Davy, 1807",
    "description": "Potassium is an alkali metal with symbol K and atomic number 19. At room conditions, its standard state is a solid. It is placed in period 4, group 1. It has 1 valence electron, which strongly shapes its bonding behavior.",
    "sourceTitle": "Potassium",
    "wikidataId": "Q703"
  },
  "Ca": {
    "discoveredBy": "Known since antiquity",
    "discoveryYear": "Ancient",
    "discoveryText": "Known since antiquity",
    "description": "Calcium is an alkaline earth metal with symbol Ca and atomic number 20. At room conditions, its standard state is a solid. It is placed in period 4, group 2. It has 2 valence electrons, which strongly shape its bonding behavior.",
    "sourceTitle": "Calcium",
    "wikidataId": "Q706"
  },
  "Sc": {
    "discoveredBy": "Lars Fredrik Nilson",
    "discoveryYear": "1879",
    "discoveryText": "Lars Fredrik Nilson, 1879",
    "description": "Scandium is a transition metal with symbol Sc and atomic number 21. At room conditions, its standard state is a solid. It is placed in period 4, group 3. It has 2 valence electrons, which strongly shape its bonding behavior.",
    "sourceTitle": "Scandium",
    "wikidataId": "Q713"
  },
  "Ti": {
    "discoveredBy": "Friedrich Wöhler",
    "discoveryYear": "1791",
    "discoveryText": "Friedrich Wöhler, 1791",
    "description": "Titanium is a transition metal with symbol Ti and atomic number 22. At room conditions, its standard state is a solid. It is placed in period 4, group 4. It has 2 valence electrons, which strongly shape its bonding behavior.",
    "sourceTitle": "Titanium",
    "wikidataId": "Q716"
  },
  "V": {
    "discoveredBy": "Andrés Manuel del Río",
    "discoveryYear": "1801",
    "discoveryText": "Andrés Manuel del Río, 1801",
    "description": "Vanadium is a transition metal with symbol V and atomic number 23. At room conditions, its standard state is a solid. It is placed in period 4, group 5. It has 2 valence electrons, which strongly shape its bonding behavior.",
    "sourceTitle": "Vanadium",
    "wikidataId": "Q722"
  },
  "Cr": {
    "discoveredBy": "Louis Nicolas Vauquelin",
    "discoveryYear": "1797",
    "discoveryText": "Louis Nicolas Vauquelin, 1797",
    "description": "Chromium is a transition metal with symbol Cr and atomic number 24. At room conditions, its standard state is a solid. It is placed in period 4, group 6. It has 1 valence electron, which strongly shapes its bonding behavior.",
    "sourceTitle": "Chromium",
    "wikidataId": "Q725"
  },
  "Mn": {
    "discoveredBy": "Johan Gottlieb Gahn",
    "discoveryYear": "1774",
    "discoveryText": "Johan Gottlieb Gahn, 1774",
    "description": "Manganese is a transition metal with symbol Mn and atomic number 25. At room conditions, its standard state is a solid. It is placed in period 4, group 7. It has 2 valence electrons, which strongly shape its bonding behavior.",
    "sourceTitle": "Manganese",
    "wikidataId": "Q731"
  },
  "Fe": {
    "discoveredBy": "Known since antiquity",
    "discoveryYear": "Ancient",
    "discoveryText": "Known since antiquity",
    "description": "Iron is a transition metal with symbol Fe and atomic number 26. At room conditions, its standard state is a solid. It is placed in period 4, group 8. It has 2 valence electrons, which strongly shape its bonding behavior.",
    "sourceTitle": "Iron",
    "wikidataId": "Q677"
  },
  "Co": {
    "discoveredBy": "Georg Brandt",
    "discoveryYear": "1735",
    "discoveryText": "Georg Brandt, 1735",
    "description": "Cobalt is a transition metal with symbol Co and atomic number 27. At room conditions, its standard state is a solid. It is placed in period 4, group 9. It has 2 valence electrons, which strongly shape its bonding behavior.",
    "sourceTitle": "Cobalt",
    "wikidataId": "Q740"
  },
  "Ni": {
    "discoveredBy": "Axel Fredrik Cronstedt",
    "discoveryYear": "1751",
    "discoveryText": "Axel Fredrik Cronstedt, 1751",
    "description": "Nickel is a transition metal with symbol Ni and atomic number 28. At room conditions, its standard state is a solid. It is placed in period 4, group 10. It has 2 valence electrons, which strongly shape its bonding behavior.",
    "sourceTitle": "Nickel",
    "wikidataId": "Q744"
  },
  "Cu": {
    "discoveredBy": "Known since antiquity",
    "discoveryYear": "Ancient",
    "discoveryText": "Known since antiquity",
    "description": "Copper is a transition metal with symbol Cu and atomic number 29. At room conditions, its standard state is a solid. It is placed in period 4, group 11. It has 1 valence electron, which strongly shapes its bonding behavior.",
    "sourceTitle": "Copper",
    "wikidataId": "Q753"
  },
  "Zn": {
    "discoveredBy": "Andreas Sigismund Marggraf",
    "discoveryYear": "1746",
    "discoveryText": "Andreas Sigismund Marggraf, 1746",
    "description": "Zinc is a transition metal with symbol Zn and atomic number 30. At room conditions, its standard state is a solid. It is placed in period 4, group 12. It has 2 valence electrons, which strongly shape its bonding behavior.",
    "sourceTitle": "Zinc",
    "wikidataId": "Q758"
  },
  "Ga": {
    "discoveredBy": "Paul-Émile Lecoq de Boisbaudran",
    "discoveryYear": "1875",
    "discoveryText": "Paul-Émile Lecoq de Boisbaudran, 1875",
    "description": "Gallium is a post-transition metal with symbol Ga and atomic number 31. At room conditions, its standard state is a solid. It is placed in period 4, group 13. It has 3 valence electrons, which strongly shape its bonding behavior.",
    "sourceTitle": "Gallium",
    "wikidataId": "Q861"
  },
  "Ge": {
    "discoveredBy": "Clemens Winkler",
    "discoveryYear": "1886",
    "discoveryText": "Clemens Winkler, 1886",
    "description": "Germanium is a metalloid with symbol Ge and atomic number 32. At room conditions, its standard state is a solid. It is placed in period 4, group 14. It has 4 valence electrons, which strongly shape its bonding behavior.",
    "sourceTitle": "Germanium",
    "wikidataId": "Q867"
  },
  "As": {
    "discoveredBy": "Known since antiquity",
    "discoveryYear": "Ancient",
    "discoveryText": "Known since antiquity",
    "description": "Arsenic is a metalloid with symbol As and atomic number 33. At room conditions, its standard state is a solid. It is placed in period 4, group 15. It has 5 valence electrons, which strongly shape its bonding behavior.",
    "sourceTitle": "Arsenic",
    "wikidataId": "Q871"
  },
  "Se": {
    "discoveredBy": "Johan Gottlieb Gahn, Jöns Jacob Berzelius",
    "discoveryYear": "1817",
    "discoveryText": "Johan Gottlieb Gahn, Jöns Jacob Berzelius, 1817",
    "description": "Selenium is a nonmetal with symbol Se and atomic number 34. At room conditions, its standard state is a solid. It is placed in period 4, group 16. It has 6 valence electrons, which strongly shape its bonding behavior.",
    "sourceTitle": "Selenium",
    "wikidataId": "Q876"
  },
  "Br": {
    "discoveredBy": "Antoine Jérôme Balard, Carl Jacob Löwig",
    "discoveryYear": "1826",
    "discoveryText": "Antoine Jérôme Balard, Carl Jacob Löwig, 1826",
    "description": "Bromine is a halogen with symbol Br and atomic number 35. At room conditions, its standard state is a liquid. It is placed in period 4, group 17. It has 7 valence electrons, which strongly shape its bonding behavior.",
    "sourceTitle": "Bromine",
    "wikidataId": "Q879"
  },
  "Kr": {
    "discoveredBy": "William Ramsay, Morris Travers",
    "discoveryYear": "1898",
    "discoveryText": "William Ramsay, Morris Travers, 1898",
    "description": "Krypton is a noble gas with symbol Kr and atomic number 36. At room conditions, its standard state is a gas. It is placed in period 4, group 18. It has 8 valence electrons, which strongly shape its bonding behavior.",
    "sourceTitle": "Krypton",
    "wikidataId": "Q888"
  },
  "Rb": {
    "discoveredBy": "Robert Bunsen, Gustav Kirchhoff",
    "discoveryYear": "1861",
    "discoveryText": "Robert Bunsen, Gustav Kirchhoff, 1861",
    "description": "Rubidium is an alkali metal with symbol Rb and atomic number 37. At room conditions, its standard state is a solid. It is placed in period 5, group 1. It has 1 valence electron, which strongly shapes its bonding behavior.",
    "sourceTitle": "Rubidium",
    "wikidataId": "Q895"
  },
  "Sr": {
    "discoveredBy": "William Cruickshank",
    "discoveryYear": "1790",
    "discoveryText": "William Cruickshank, 1790",
    "description": "Strontium is an alkaline earth metal with symbol Sr and atomic number 38. At room conditions, its standard state is a solid. It is placed in period 5, group 2. It has 2 valence electrons, which strongly shape its bonding behavior.",
    "sourceTitle": "Strontium",
    "wikidataId": "Q938"
  },
  "Y": {
    "discoveredBy": "Johan Gadolin, Friedrich Wöhler",
    "discoveryYear": "1794",
    "discoveryText": "Johan Gadolin, Friedrich Wöhler, 1794",
    "description": "Yttrium is a transition metal with symbol Y and atomic number 39. At room conditions, its standard state is a solid. It is placed in period 5, group 3. It has 2 valence electrons, which strongly shape its bonding behavior.",
    "sourceTitle": "Yttrium",
    "wikidataId": "Q941"
  },
  "Zr": {
    "discoveredBy": "Anton Eduard van Arkel, Jan Hendrik de Boer, Martin Heinrich Klaproth, Jöns Jacob Berzelius",
    "discoveryYear": "1789",
    "discoveryText": "Anton Eduard van Arkel, Jan Hendrik de Boer, Martin Heinrich Klaproth, Jöns Jacob Berzelius, 1789",
    "description": "Zirconium is a transition metal with symbol Zr and atomic number 40. At room conditions, its standard state is a solid. It is placed in period 5, group 4. It has 2 valence electrons, which strongly shape its bonding behavior.",
    "sourceTitle": "Zirconium",
    "wikidataId": "Q1038"
  },
  "Nb": {
    "discoveredBy": "Charles Hatchett",
    "discoveryYear": "1801",
    "discoveryText": "Charles Hatchett, 1801",
    "description": "Niobium is a transition metal with symbol Nb and atomic number 41. At room conditions, its standard state is a solid. It is placed in period 5, group 5. It has 1 valence electron, which strongly shapes its bonding behavior.",
    "sourceTitle": "Niobium",
    "wikidataId": "Q1046"
  },
  "Mo": {
    "discoveredBy": "Carl Wilhelm Scheele",
    "discoveryYear": "1778",
    "discoveryText": "Carl Wilhelm Scheele, 1778",
    "description": "Molybdenum is a transition metal with symbol Mo and atomic number 42. At room conditions, its standard state is a solid. It is placed in period 5, group 6. It has 1 valence electron, which strongly shapes its bonding behavior.",
    "sourceTitle": "Molybdenum",
    "wikidataId": "Q1053"
  },
  "Tc": {
    "discoveredBy": "Carlo Perrier, Emilio G. Segrè",
    "discoveryYear": "1937",
    "discoveryText": "Carlo Perrier, Emilio G. Segrè, 1937",
    "description": "Technetium is a transition metal with symbol Tc and atomic number 43. At room conditions, its standard state is a solid. It is placed in period 5, group 7. It has 2 valence electrons, which strongly shape its bonding behavior.",
    "sourceTitle": "Technetium",
    "wikidataId": "Q1054"
  },
  "Ru": {
    "discoveredBy": "Karl Ernst Claus",
    "discoveryYear": "1827",
    "discoveryText": "Karl Ernst Claus, 1827",
    "description": "Ruthenium is a transition metal with symbol Ru and atomic number 44. At room conditions, its standard state is a solid. It is placed in period 5, group 8. It has 1 valence electron, which strongly shapes its bonding behavior.",
    "sourceTitle": "Ruthenium",
    "wikidataId": "Q1086"
  },
  "Rh": {
    "discoveredBy": "William Hyde Wollaston",
    "discoveryYear": "1803",
    "discoveryText": "William Hyde Wollaston, 1803",
    "description": "Rhodium is a transition metal with symbol Rh and atomic number 45. At room conditions, its standard state is a solid. It is placed in period 5, group 9. It has 1 valence electron, which strongly shapes its bonding behavior.",
    "sourceTitle": "Rhodium",
    "wikidataId": "Q1087"
  },
  "Pd": {
    "discoveredBy": "William Hyde Wollaston",
    "discoveryYear": "1803",
    "discoveryText": "William Hyde Wollaston, 1803",
    "description": "Palladium is a transition metal with symbol Pd and atomic number 46. At room conditions, its standard state is a solid. It is placed in period 5, group 10. It has 18 valence electrons, which strongly shape its bonding behavior.",
    "sourceTitle": "Palladium",
    "wikidataId": "Q1089"
  },
  "Ag": {
    "discoveredBy": "Known since antiquity",
    "discoveryYear": "Ancient",
    "discoveryText": "Known since antiquity",
    "description": "Silver is a transition metal with symbol Ag and atomic number 47. At room conditions, its standard state is a solid. It is placed in period 5, group 11. It has 1 valence electron, which strongly shapes its bonding behavior.",
    "sourceTitle": "Silver",
    "wikidataId": "Q1090"
  },
  "Cd": {
    "discoveredBy": "Friedrich Stromeyer, Karl Samuel Leberecht Hermann",
    "discoveryYear": "1817",
    "discoveryText": "Friedrich Stromeyer, Karl Samuel Leberecht Hermann, 1817",
    "description": "Cadmium is a transition metal with symbol Cd and atomic number 48. At room conditions, its standard state is a solid. It is placed in period 5, group 12. It has 2 valence electrons, which strongly shape its bonding behavior.",
    "sourceTitle": "Cadmium",
    "wikidataId": "Q1091"
  },
  "In": {
    "discoveredBy": "Hieronymous Theodor Richter, Ferdinand Reich",
    "discoveryYear": "1863",
    "discoveryText": "Hieronymous Theodor Richter, Ferdinand Reich, 1863",
    "description": "Indium is a post-transition metal with symbol In and atomic number 49. At room conditions, its standard state is a solid. It is placed in period 5, group 13. It has 3 valence electrons, which strongly shape its bonding behavior.",
    "sourceTitle": "Indium",
    "wikidataId": "Q1094"
  },
  "Sn": {
    "discoveredBy": "Known since antiquity",
    "discoveryYear": "Ancient",
    "discoveryText": "Known since antiquity",
    "description": "Tin is a post-transition metal with symbol Sn and atomic number 50. At room conditions, its standard state is a solid. It is placed in period 5, group 14. It has 4 valence electrons, which strongly shape its bonding behavior.",
    "sourceTitle": "Tin",
    "wikidataId": "Q1096"
  },
  "Sb": {
    "discoveredBy": "Known since antiquity",
    "discoveryYear": "Ancient",
    "discoveryText": "Known since antiquity",
    "description": "Antimony is a metalloid with symbol Sb and atomic number 51. At room conditions, its standard state is a solid. It is placed in period 5, group 15. It has 5 valence electrons, which strongly shape its bonding behavior.",
    "sourceTitle": "Antimony",
    "wikidataId": "Q1099"
  },
  "Te": {
    "discoveredBy": "Franz-Joseph Müller von Reichenstein",
    "discoveryYear": "1782",
    "discoveryText": "Franz-Joseph Müller von Reichenstein, 1782",
    "description": "Tellurium is a metalloid with symbol Te and atomic number 52. At room conditions, its standard state is a solid. It is placed in period 5, group 16. It has 6 valence electrons, which strongly shape its bonding behavior.",
    "sourceTitle": "Tellurium",
    "wikidataId": "Q1100"
  },
  "I": {
    "discoveredBy": "Bernard Courtois",
    "discoveryYear": "1811",
    "discoveryText": "Bernard Courtois, 1811",
    "description": "Iodine is a halogen with symbol I and atomic number 53. At room conditions, its standard state is a solid. It is placed in period 5, group 17. It has 7 valence electrons, which strongly shape its bonding behavior.",
    "sourceTitle": "Iodine",
    "wikidataId": "Q1103"
  },
  "Xe": {
    "discoveredBy": "William Ramsay, Morris Travers",
    "discoveryYear": "1898",
    "discoveryText": "William Ramsay, Morris Travers, 1898",
    "description": "Xenon is a noble gas with symbol Xe and atomic number 54. At room conditions, its standard state is a gas. It is placed in period 5, group 18. It has 8 valence electrons, which strongly shape its bonding behavior.",
    "sourceTitle": "Xenon",
    "wikidataId": "Q1106"
  },
  "Cs": {
    "discoveredBy": "Robert Bunsen, Gustav Kirchhoff",
    "discoveryYear": "1860",
    "discoveryText": "Robert Bunsen, Gustav Kirchhoff, 1860",
    "description": "Cesium is an alkali metal with symbol Cs and atomic number 55. At room conditions, its standard state is a solid. It is placed in period 6, group 1. It has 1 valence electron, which strongly shapes its bonding behavior.",
    "sourceTitle": "Caesium",
    "wikidataId": "Q1108"
  },
  "Ba": {
    "discoveredBy": "Humphry Davy",
    "discoveryYear": "1808",
    "discoveryText": "Humphry Davy, 1808",
    "description": "Barium is an alkaline earth metal with symbol Ba and atomic number 56. At room conditions, its standard state is a solid. It is placed in period 6, group 2. It has 2 valence electrons, which strongly shape its bonding behavior.",
    "sourceTitle": "Barium",
    "wikidataId": "Q1112"
  },
  "La": {
    "discoveredBy": "Carl Gustaf Mosander",
    "discoveryYear": "1839",
    "discoveryText": "Carl Gustaf Mosander, 1839",
    "description": "Lanthanum is a lanthanide with symbol La and atomic number 57. At room conditions, its standard state is a solid. It is placed in period 6, group 3. It has 2 valence electrons, which strongly shape its bonding behavior.",
    "sourceTitle": "Lanthanum",
    "wikidataId": "Q1801"
  },
  "Ce": {
    "discoveredBy": "Martin Heinrich Klaproth, Jöns Jacob Berzelius",
    "discoveryYear": "1803",
    "discoveryText": "Martin Heinrich Klaproth, Jöns Jacob Berzelius, 1803",
    "description": "Cerium is a lanthanide with symbol Ce and atomic number 58. At room conditions, its standard state is a solid. It is placed in period 6, group 4. It has 2 valence electrons, which strongly shape its bonding behavior.",
    "sourceTitle": "Cerium",
    "wikidataId": "Q1385"
  },
  "Pr": {
    "discoveredBy": "Carl Gustaf Mosander",
    "discoveryYear": "1885",
    "discoveryText": "Carl Gustaf Mosander, 1885",
    "description": "Praseodymium is a lanthanide with symbol Pr and atomic number 59. At room conditions, its standard state is a solid. It is placed in period 6, group 5. It has 2 valence electrons, which strongly shape its bonding behavior.",
    "sourceTitle": "Praseodymium",
    "wikidataId": "Q1386"
  },
  "Nd": {
    "discoveredBy": "Carl Auer von Welsbach",
    "discoveryYear": "1885",
    "discoveryText": "Carl Auer von Welsbach, 1885",
    "description": "Neodymium is a lanthanide with symbol Nd and atomic number 60. At room conditions, its standard state is a solid. It is placed in period 6, group 6. It has 2 valence electrons, which strongly shape its bonding behavior.",
    "sourceTitle": "Neodymium",
    "wikidataId": "Q1388"
  },
  "Pm": {
    "discoveredBy": "Lawrence E. Glendenin, Jacob Akiba Marinsky, Charles D. Coryell",
    "discoveryYear": "1945",
    "discoveryText": "Lawrence E. Glendenin, Jacob Akiba Marinsky, Charles D. Coryell, 1945",
    "description": "Promethium is a lanthanide with symbol Pm and atomic number 61. At room conditions, its standard state is a solid. It is placed in period 6, group 7. It has 2 valence electrons, which strongly shape its bonding behavior.",
    "sourceTitle": "Promethium",
    "wikidataId": "Q1809"
  },
  "Sm": {
    "discoveredBy": "Paul-Émile Lecoq de Boisbaudran",
    "discoveryYear": "1879",
    "discoveryText": "Paul-Émile Lecoq de Boisbaudran, 1879",
    "description": "Samarium is a lanthanide with symbol Sm and atomic number 62. At room conditions, its standard state is a solid. It is placed in period 6, group 8. It has 2 valence electrons, which strongly shape its bonding behavior.",
    "sourceTitle": "Samarium",
    "wikidataId": "Q1819"
  },
  "Eu": {
    "discoveredBy": "Eugène-Anatole Demarçay",
    "discoveryYear": "1901",
    "discoveryText": "Eugène-Anatole Demarçay, 1901",
    "description": "Europium is a lanthanide with symbol Eu and atomic number 63. At room conditions, its standard state is a solid. It is placed in period 6, group 9. It has 2 valence electrons, which strongly shape its bonding behavior.",
    "sourceTitle": "Europium",
    "wikidataId": "Q1396"
  },
  "Gd": {
    "discoveredBy": "Jean Charles Galissard de Marignac",
    "discoveryYear": "1880",
    "discoveryText": "Jean Charles Galissard de Marignac, 1880",
    "description": "Gadolinium is a lanthanide with symbol Gd and atomic number 64. At room conditions, its standard state is a solid. It is placed in period 6, group 10. It has 2 valence electrons, which strongly shape its bonding behavior.",
    "sourceTitle": "Gadolinium",
    "wikidataId": "Q1832"
  },
  "Tb": {
    "discoveredBy": "Carl Gustaf Mosander",
    "discoveryYear": "1843",
    "discoveryText": "Carl Gustaf Mosander, 1843",
    "description": "Terbium is a lanthanide with symbol Tb and atomic number 65. At room conditions, its standard state is a solid. It is placed in period 6, group 11. It has 2 valence electrons, which strongly shape its bonding behavior.",
    "sourceTitle": "Terbium",
    "wikidataId": "Q1838"
  },
  "Dy": {
    "discoveredBy": "Paul-Émile Lecoq de Boisbaudran",
    "discoveryYear": "1886",
    "discoveryText": "Paul-Émile Lecoq de Boisbaudran, 1886",
    "description": "Dysprosium is a lanthanide with symbol Dy and atomic number 66. At room conditions, its standard state is a solid. It is placed in period 6, group 12. It has 2 valence electrons, which strongly shape its bonding behavior.",
    "sourceTitle": "Dysprosium",
    "wikidataId": "Q1843"
  },
  "Ho": {
    "discoveredBy": "Per Teodor Cleve, Marc Delafontaine, Jacques-Louis Soret",
    "discoveryYear": "1878",
    "discoveryText": "Per Teodor Cleve, Marc Delafontaine, Jacques-Louis Soret, 1878",
    "description": "Holmium is a lanthanide with symbol Ho and atomic number 67. At room conditions, its standard state is a solid. It is placed in period 6, group 13. It has 2 valence electrons, which strongly shape its bonding behavior.",
    "sourceTitle": "Holmium",
    "wikidataId": "Q1846"
  },
  "Er": {
    "discoveredBy": "Carl Gustaf Mosander",
    "discoveryYear": "1843",
    "discoveryText": "Carl Gustaf Mosander, 1843",
    "description": "Erbium is a lanthanide with symbol Er and atomic number 68. At room conditions, its standard state is a solid. It is placed in period 6, group 14. It has 2 valence electrons, which strongly shape its bonding behavior.",
    "sourceTitle": "Erbium",
    "wikidataId": "Q1849"
  },
  "Tm": {
    "discoveredBy": "Per Teodor Cleve",
    "discoveryYear": "1879",
    "discoveryText": "Per Teodor Cleve, 1879",
    "description": "Thulium is a lanthanide with symbol Tm and atomic number 69. At room conditions, its standard state is a solid. It is placed in period 6, group 15. It has 2 valence electrons, which strongly shape its bonding behavior.",
    "sourceTitle": "Thulium",
    "wikidataId": "Q1853"
  },
  "Yb": {
    "discoveredBy": "Jean Charles Galissard de Marignac",
    "discoveryYear": "1878",
    "discoveryText": "Jean Charles Galissard de Marignac, 1878",
    "description": "Ytterbium is a lanthanide with symbol Yb and atomic number 70. At room conditions, its standard state is a solid. It is placed in period 6, group 16. It has 2 valence electrons, which strongly shape its bonding behavior.",
    "sourceTitle": "Ytterbium",
    "wikidataId": "Q1855"
  },
  "Lu": {
    "discoveredBy": "Georges Urbain, Carl Auer von Welsbach",
    "discoveryYear": "1907",
    "discoveryText": "Georges Urbain, Carl Auer von Welsbach, 1907",
    "description": "Lutetium is a lanthanide with symbol Lu and atomic number 71. At room conditions, its standard state is a solid. It is placed in period 6, group 17. It has 2 valence electrons, which strongly shape its bonding behavior.",
    "sourceTitle": "Lutetium",
    "wikidataId": "Q1857"
  },
  "Hf": {
    "discoveredBy": "Dirk Coster, George de Hevesy",
    "discoveryYear": "1923",
    "discoveryText": "Dirk Coster, George de Hevesy, 1923",
    "description": "Hafnium is a transition metal with symbol Hf and atomic number 72. At room conditions, its standard state is a solid. It is placed in period 6, group 4. It has 2 valence electrons, which strongly shape its bonding behavior.",
    "sourceTitle": "Hafnium",
    "wikidataId": "Q1119"
  },
  "Ta": {
    "discoveredBy": "Anders Gustaf Ekeberg",
    "discoveryYear": "1802",
    "discoveryText": "Anders Gustaf Ekeberg, 1802",
    "description": "Tantalum is a transition metal with symbol Ta and atomic number 73. At room conditions, its standard state is a solid. It is placed in period 6, group 5. It has 2 valence electrons, which strongly shape its bonding behavior.",
    "sourceTitle": "Tantalum",
    "wikidataId": "Q1123"
  },
  "W": {
    "discoveredBy": "Juan José Elhuyar, Fausto Elhuyar",
    "discoveryYear": "1783",
    "discoveryText": "Juan José Elhuyar, Fausto Elhuyar, 1783",
    "description": "Tungsten is a transition metal with symbol W and atomic number 74. At room conditions, its standard state is a solid. It is placed in period 6, group 6. It has 2 valence electrons, which strongly shape its bonding behavior.",
    "sourceTitle": "Tungsten",
    "wikidataId": "Q743"
  },
  "Re": {
    "discoveredBy": "Otto Berg, Ida Noddack, Walter Noddack",
    "discoveryYear": "1925",
    "discoveryText": "Otto Berg, Ida Noddack, Walter Noddack, 1925",
    "description": "Rhenium is a transition metal with symbol Re and atomic number 75. At room conditions, its standard state is a solid. It is placed in period 6, group 7. It has 2 valence electrons, which strongly shape its bonding behavior.",
    "sourceTitle": "Rhenium",
    "wikidataId": "Q737"
  },
  "Os": {
    "discoveredBy": "Smithson Tennant, William Hyde Wollaston",
    "discoveryYear": "1803",
    "discoveryText": "Smithson Tennant, William Hyde Wollaston, 1803",
    "description": "Osmium is a transition metal with symbol Os and atomic number 76. At room conditions, its standard state is a solid. It is placed in period 6, group 8. It has 2 valence electrons, which strongly shape its bonding behavior.",
    "sourceTitle": "Osmium",
    "wikidataId": "Q751"
  },
  "Ir": {
    "discoveredBy": "Smithson Tennant",
    "discoveryYear": "1803",
    "discoveryText": "Smithson Tennant, 1803",
    "description": "Iridium is a transition metal with symbol Ir and atomic number 77. At room conditions, its standard state is a solid. It is placed in period 6, group 9. It has 2 valence electrons, which strongly shape its bonding behavior.",
    "sourceTitle": "Iridium",
    "wikidataId": "Q877"
  },
  "Pt": {
    "discoveredBy": "Antonio de Ulloa, Julius Caesar Scaliger",
    "discoveryYear": "1735",
    "discoveryText": "Antonio de Ulloa, Julius Caesar Scaliger, 1735",
    "description": "Platinum is a transition metal with symbol Pt and atomic number 78. At room conditions, its standard state is a solid. It is placed in period 6, group 10. It has 1 valence electron, which strongly shapes its bonding behavior.",
    "sourceTitle": "Platinum",
    "wikidataId": "Q880"
  },
  "Au": {
    "discoveredBy": "Known since antiquity",
    "discoveryYear": "Ancient",
    "discoveryText": "Known since antiquity",
    "description": "Gold is a transition metal with symbol Au and atomic number 79. At room conditions, its standard state is a solid. It is placed in period 6, group 11. It has 1 valence electron, which strongly shapes its bonding behavior.",
    "sourceTitle": "Gold",
    "wikidataId": "Q897"
  },
  "Hg": {
    "discoveredBy": "Known since antiquity",
    "discoveryYear": "Ancient",
    "discoveryText": "Known since antiquity",
    "description": "Mercury is a transition metal with symbol Hg and atomic number 80. At room conditions, its standard state is a liquid. It is placed in period 6, group 12. It has 2 valence electrons, which strongly shape its bonding behavior.",
    "sourceTitle": "Mercury (element)",
    "wikidataId": "Q925"
  },
  "Tl": {
    "discoveredBy": "William Crookes",
    "discoveryYear": "1861",
    "discoveryText": "William Crookes, 1861",
    "description": "Thallium is a post-transition metal with symbol Tl and atomic number 81. At room conditions, its standard state is a solid. It is placed in period 6, group 13. It has 3 valence electrons, which strongly shape its bonding behavior.",
    "sourceTitle": "Thallium",
    "wikidataId": "Q932"
  },
  "Pb": {
    "discoveredBy": "Known since antiquity",
    "discoveryYear": "Ancient",
    "discoveryText": "Known since antiquity",
    "description": "Lead is a post-transition metal with symbol Pb and atomic number 82. At room conditions, its standard state is a solid. It is placed in period 6, group 14. It has 4 valence electrons, which strongly shape its bonding behavior.",
    "sourceTitle": "Lead",
    "wikidataId": "Q708"
  },
  "Bi": {
    "discoveredBy": "Not firmly attributed",
    "discoveryYear": "1753",
    "discoveryText": "Not firmly attributed, 1753",
    "description": "Bismuth is a post-transition metal with symbol Bi and atomic number 83. At room conditions, its standard state is a solid. It is placed in period 6, group 15. It has 5 valence electrons, which strongly shape its bonding behavior.",
    "sourceTitle": "Bismuth",
    "wikidataId": "Q942"
  },
  "Po": {
    "discoveredBy": "Pierre Curie, Q7186",
    "discoveryYear": "1898",
    "discoveryText": "Pierre Curie, Q7186, 1898",
    "description": "Polonium is a metalloid with symbol Po and atomic number 84. At room conditions, its standard state is a solid. It is placed in period 6, group 16. It has 6 valence electrons, which strongly shape its bonding behavior.",
    "sourceTitle": "Polonium",
    "wikidataId": "Q979"
  },
  "At": {
    "discoveredBy": "Emilio G. Segrè",
    "discoveryYear": "1940",
    "discoveryText": "Emilio G. Segrè, 1940",
    "description": "Astatine is a halogen with symbol At and atomic number 85. At room conditions, its standard state is a solid. It is placed in period 6, group 17. It has 7 valence electrons, which strongly shape its bonding behavior.",
    "sourceTitle": "Astatine",
    "wikidataId": "Q999"
  },
  "Rn": {
    "discoveredBy": "Robert Bowie Owens, Friedrich Ernst Dorn, Ernest Rutherford",
    "discoveryYear": "1900",
    "discoveryText": "Robert Bowie Owens, Friedrich Ernst Dorn, Ernest Rutherford, 1900",
    "description": "Radon is a noble gas with symbol Rn and atomic number 86. At room conditions, its standard state is a gas. It is placed in period 6, group 18. It has 8 valence electrons, which strongly shape its bonding behavior.",
    "sourceTitle": "Radon",
    "wikidataId": "Q1133"
  },
  "Fr": {
    "discoveredBy": "Marguerite Perey",
    "discoveryYear": "1939",
    "discoveryText": "Marguerite Perey, 1939",
    "description": "Francium is an alkali metal with symbol Fr and atomic number 87. At room conditions, its standard state is a solid. It is placed in period 7, group 1. It has 1 valence electron, which strongly shapes its bonding behavior.",
    "sourceTitle": "Francium",
    "wikidataId": "Q671"
  },
  "Ra": {
    "discoveredBy": "Pierre Curie, Q7186",
    "discoveryYear": "1898",
    "discoveryText": "Pierre Curie, Q7186, 1898",
    "description": "Radium is an alkaline earth metal with symbol Ra and atomic number 88. At room conditions, its standard state is a solid. It is placed in period 7, group 2. It has 2 valence electrons, which strongly shape its bonding behavior.",
    "sourceTitle": "Radium",
    "wikidataId": "Q1128"
  },
  "Ac": {
    "discoveredBy": "André-Louis Debierne",
    "discoveryYear": "1899",
    "discoveryText": "André-Louis Debierne, 1899",
    "description": "Actinium is an actinide with symbol Ac and atomic number 89. At room conditions, its standard state is a solid. It is placed in period 7, group 3. It has 2 valence electrons, which strongly shape its bonding behavior.",
    "sourceTitle": "Actinium",
    "wikidataId": "Q1121"
  },
  "Th": {
    "discoveredBy": "Jöns Jacob Berzelius",
    "discoveryYear": "1828",
    "discoveryText": "Jöns Jacob Berzelius, 1828",
    "description": "Thorium is an actinide with symbol Th and atomic number 90. At room conditions, its standard state is a solid. It is placed in period 7, group 4. It has 2 valence electrons, which strongly shape its bonding behavior.",
    "sourceTitle": "Thorium",
    "wikidataId": "Q1115"
  },
  "Pa": {
    "discoveredBy": "Kazimierz Fajans, Otto Hahn, Lise Meitner",
    "discoveryYear": "1913",
    "discoveryText": "Kazimierz Fajans, Otto Hahn, Lise Meitner, 1913",
    "description": "Protactinium is an actinide with symbol Pa and atomic number 91. At room conditions, its standard state is a solid. It is placed in period 7, group 5. It has 2 valence electrons, which strongly shape its bonding behavior.",
    "sourceTitle": "Protactinium",
    "wikidataId": "Q1109"
  },
  "U": {
    "discoveredBy": "Q903801",
    "discoveryYear": "1789",
    "discoveryText": "Q903801, 1789",
    "description": "Uranium is an actinide with symbol U and atomic number 92. At room conditions, its standard state is a solid. It is placed in period 7, group 6. It has 2 valence electrons, which strongly shape its bonding behavior.",
    "sourceTitle": "Uranium",
    "wikidataId": "Q1098"
  },
  "Np": {
    "discoveredBy": "Philip Abelson, Edwin McMillan",
    "discoveryYear": "1940",
    "discoveryText": "Philip Abelson, Edwin McMillan, 1940",
    "description": "Neptunium is an actinide with symbol Np and atomic number 93. At room conditions, its standard state is a solid. It is placed in period 7, group 7. It has 2 valence electrons, which strongly shape its bonding behavior.",
    "sourceTitle": "Neptunium",
    "wikidataId": "Q1105"
  },
  "Pu": {
    "discoveredBy": "Joseph W. Kennedy, Arthur Wahl, Glenn T. Seaborg, Edwin McMillan",
    "discoveryYear": "1940",
    "discoveryText": "Joseph W. Kennedy, Arthur Wahl, Glenn T. Seaborg, Edwin McMillan, 1940",
    "description": "Plutonium is an actinide with symbol Pu and atomic number 94. At room conditions, its standard state is a solid. It is placed in period 7, group 8. It has 2 valence electrons, which strongly shape its bonding behavior.",
    "sourceTitle": "Plutonium",
    "wikidataId": "Q1102"
  },
  "Am": {
    "discoveredBy": "Glenn T. Seaborg",
    "discoveryYear": "1944",
    "discoveryText": "Glenn T. Seaborg, 1944",
    "description": "Americium is an actinide with symbol Am and atomic number 95. At room conditions, its standard state is a solid. It is placed in period 7, group 9. It has 2 valence electrons, which strongly shape its bonding behavior.",
    "sourceTitle": "Americium",
    "wikidataId": "Q1872"
  },
  "Cm": {
    "discoveredBy": "Glenn T. Seaborg",
    "discoveryYear": "1944",
    "discoveryText": "Glenn T. Seaborg, 1944",
    "description": "Curium is an actinide with symbol Cm and atomic number 96. At room conditions, its standard state is a solid. It is placed in period 7, group 10. It has 2 valence electrons, which strongly shape its bonding behavior.",
    "sourceTitle": "Curium",
    "wikidataId": "Q1876"
  },
  "Bk": {
    "discoveredBy": "Stanley Gerald Thompson, Albert Ghiorso, Glenn T. Seaborg",
    "discoveryYear": "1949",
    "discoveryText": "Stanley Gerald Thompson, Albert Ghiorso, Glenn T. Seaborg, 1949",
    "description": "Berkelium is an actinide with symbol Bk and atomic number 97. At room conditions, its standard state is a solid. It is placed in period 7, group 11. It has 2 valence electrons, which strongly shape its bonding behavior.",
    "sourceTitle": "Berkelium",
    "wikidataId": "Q1882"
  },
  "Cf": {
    "discoveredBy": "Stanley Gerald Thompson, Kenneth Street Jr., Albert Ghiorso, Glenn T. Seaborg",
    "discoveryYear": "1950",
    "discoveryText": "Stanley Gerald Thompson, Kenneth Street Jr., Albert Ghiorso, Glenn T. Seaborg, 1950",
    "description": "Californium is an actinide with symbol Cf and atomic number 98. At room conditions, its standard state is a solid. It is placed in period 7, group 12. It has 2 valence electrons, which strongly shape its bonding behavior.",
    "sourceTitle": "Californium",
    "wikidataId": "Q1888"
  },
  "Es": {
    "discoveredBy": "Albert Ghiorso, Glenn T. Seaborg",
    "discoveryYear": "1952",
    "discoveryText": "Albert Ghiorso, Glenn T. Seaborg, 1952",
    "description": "Einsteinium is an actinide with symbol Es and atomic number 99. At room conditions, its standard state is a solid. It is placed in period 7, group 13. It has 2 valence electrons, which strongly shape its bonding behavior.",
    "sourceTitle": "Einsteinium",
    "wikidataId": "Q1892"
  },
  "Fm": {
    "discoveredBy": "Glenn T. Seaborg",
    "discoveryYear": "1952",
    "discoveryText": "Glenn T. Seaborg, 1952",
    "description": "Fermium is an actinide with symbol Fm and atomic number 100. At room conditions, its standard state is a solid. It is placed in period 7, group 14. It has 2 valence electrons, which strongly shape its bonding behavior.",
    "sourceTitle": "Fermium",
    "wikidataId": "Q1896"
  },
  "Md": {
    "discoveredBy": "Glenn T. Seaborg",
    "discoveryYear": "1955",
    "discoveryText": "Glenn T. Seaborg, 1955",
    "description": "Mendelevium is an actinide with symbol Md and atomic number 101. At room conditions, its standard state is a solid. It is placed in period 7, group 15. It has 2 valence electrons, which strongly shape its bonding behavior.",
    "sourceTitle": "Mendelevium",
    "wikidataId": "Q1898"
  },
  "No": {
    "discoveredBy": "Glenn T. Seaborg",
    "discoveryYear": "1957",
    "discoveryText": "Glenn T. Seaborg, 1957",
    "description": "Nobelium is an actinide with symbol No and atomic number 102. At room conditions, its standard state is a solid. It is placed in period 7, group 16. It has 2 valence electrons, which strongly shape its bonding behavior.",
    "sourceTitle": "Nobelium",
    "wikidataId": "Q1901"
  },
  "Lr": {
    "discoveredBy": "Albert Ghiorso",
    "discoveryYear": "1961",
    "discoveryText": "Albert Ghiorso, 1961",
    "description": "Lawrencium is an actinide with symbol Lr and atomic number 103. At room conditions, its standard state is a solid. It is placed in period 7, group 17. It has 2 valence electrons, which strongly shape its bonding behavior.",
    "sourceTitle": "Lawrencium",
    "wikidataId": "Q1905"
  },
  "Rf": {
    "discoveredBy": "Albert Ghiorso",
    "discoveryYear": "1964",
    "discoveryText": "Albert Ghiorso, 1964",
    "description": "Rutherfordium is a transition metal with symbol Rf and atomic number 104. At room conditions, its standard state is a solid. It is placed in period 7, group 4. It has 2 valence electrons, which strongly shape its bonding behavior.",
    "sourceTitle": "Rutherfordium",
    "wikidataId": "Q1226"
  },
  "Db": {
    "discoveredBy": "Lawrence Berkeley National Laboratory, Joint Institute for Nuclear Research",
    "discoveryYear": "1967",
    "discoveryText": "Lawrence Berkeley National Laboratory, Joint Institute for Nuclear Research, 1967",
    "description": "Dubnium is a transition metal with symbol Db and atomic number 105. At room conditions, its standard state is a solid. It is placed in period 7, group 5. It has 2 valence electrons, which strongly shape its bonding behavior.",
    "sourceTitle": "Dubnium",
    "wikidataId": "Q1232"
  },
  "Sg": {
    "discoveredBy": "Yuri Oganessian",
    "discoveryYear": "1974",
    "discoveryText": "Yuri Oganessian, 1974",
    "description": "Seaborgium is a transition metal with symbol Sg and atomic number 106. At room conditions, its standard state is a solid. It is placed in period 7, group 6. It has 2 valence electrons, which strongly shape its bonding behavior.",
    "sourceTitle": "Seaborgium",
    "wikidataId": "Q1234"
  },
  "Bh": {
    "discoveredBy": "Yuri Oganessian",
    "discoveryYear": "1976",
    "discoveryText": "Yuri Oganessian, 1976",
    "description": "Bohrium is a transition metal with symbol Bh and atomic number 107. At room conditions, its standard state is a solid. It is placed in period 7, group 7. It has 2 valence electrons, which strongly shape its bonding behavior.",
    "sourceTitle": "Bohrium",
    "wikidataId": "Q1249"
  },
  "Hs": {
    "discoveredBy": "GSI Helmholtz Centre for Heavy Ion Research",
    "discoveryYear": "1984",
    "discoveryText": "GSI Helmholtz Centre for Heavy Ion Research, 1984",
    "description": "Hassium is a transition metal with symbol Hs and atomic number 108. At room conditions, its standard state is a solid. It is placed in period 7, group 8. It has 2 valence electrons, which strongly shape its bonding behavior.",
    "sourceTitle": "Hassium",
    "wikidataId": "Q1252"
  },
  "Mt": {
    "discoveredBy": "GSI Helmholtz Centre for Heavy Ion Research",
    "discoveryYear": "1982",
    "discoveryText": "GSI Helmholtz Centre for Heavy Ion Research, 1982",
    "description": "Meitnerium is a transition metal with symbol Mt and atomic number 109. At room conditions, its standard state is a solid. It is placed in period 7, group 9. It has 2 valence electrons, which strongly shape its bonding behavior.",
    "sourceTitle": "Meitnerium",
    "wikidataId": "Q1258"
  },
  "Ds": {
    "discoveredBy": "GSI Helmholtz Centre for Heavy Ion Research",
    "discoveryYear": "1994",
    "discoveryText": "GSI Helmholtz Centre for Heavy Ion Research, 1994",
    "description": "Darmstadtium is a transition metal with symbol Ds and atomic number 110. At room conditions, its standard state is an expected to be a solid. It is placed in period 7, group 10. It has 2 valence electrons, which strongly shape its bonding behavior.",
    "sourceTitle": "Darmstadtium",
    "wikidataId": "Q1266"
  },
  "Rg": {
    "discoveredBy": "GSI Helmholtz Centre for Heavy Ion Research",
    "discoveryYear": "1994",
    "discoveryText": "GSI Helmholtz Centre for Heavy Ion Research, 1994",
    "description": "Roentgenium is a transition metal with symbol Rg and atomic number 111. At room conditions, its standard state is an expected to be a solid. It is placed in period 7, group 11. It has 2 valence electrons, which strongly shape its bonding behavior.",
    "sourceTitle": "Roentgenium",
    "wikidataId": "Q1272"
  },
  "Cn": {
    "discoveredBy": "GSI Helmholtz Centre for Heavy Ion Research",
    "discoveryYear": "1996",
    "discoveryText": "GSI Helmholtz Centre for Heavy Ion Research, 1996",
    "description": "Copernicium is a transition metal with symbol Cn and atomic number 112. At room conditions, its standard state is an expected to be a solid. It is placed in period 7, group 12. It has 2 valence electrons, which strongly shape its bonding behavior.",
    "sourceTitle": "Copernicium",
    "wikidataId": "Q1278"
  },
  "Nh": {
    "discoveredBy": "Joint Institute for Nuclear Research",
    "discoveryYear": "2004",
    "discoveryText": "Joint Institute for Nuclear Research, 2004",
    "description": "Nihonium is a post-transition metal with symbol Nh and atomic number 113. At room conditions, its standard state is an expected to be a solid. It is placed in period 7, group 13. It has 3 valence electrons, which strongly shape its bonding behavior.",
    "sourceTitle": "Nihonium",
    "wikidataId": "Q1301"
  },
  "Fl": {
    "discoveredBy": "Joint Institute for Nuclear Research",
    "discoveryYear": "1998",
    "discoveryText": "Joint Institute for Nuclear Research, 1998",
    "description": "Flerovium is a post-transition metal with symbol Fl and atomic number 114. At room conditions, its standard state is an expected to be a solid. It is placed in period 7, group 14. It has 4 valence electrons, which strongly shape its bonding behavior.",
    "sourceTitle": "Flerovium",
    "wikidataId": "Q1302"
  },
  "Mc": {
    "discoveredBy": "Joint Institute for Nuclear Research",
    "discoveryYear": "2003",
    "discoveryText": "Joint Institute for Nuclear Research, 2003",
    "description": "Moscovium is a post-transition metal with symbol Mc and atomic number 115. At room conditions, its standard state is an expected to be a solid. It is placed in period 7, group 15. It has 5 valence electrons, which strongly shape its bonding behavior.",
    "sourceTitle": "Moscovium",
    "wikidataId": "Q1303"
  },
  "Lv": {
    "discoveredBy": "Joint Institute for Nuclear Research",
    "discoveryYear": "2000",
    "discoveryText": "Joint Institute for Nuclear Research, 2000",
    "description": "Livermorium is a post-transition metal with symbol Lv and atomic number 116. At room conditions, its standard state is an expected to be a solid. It is placed in period 7, group 16. It has 6 valence electrons, which strongly shape its bonding behavior.",
    "sourceTitle": "Livermorium",
    "wikidataId": "Q1304"
  },
  "Ts": {
    "discoveredBy": "Yuri Oganessian",
    "discoveryYear": "2010",
    "discoveryText": "Yuri Oganessian, 2010",
    "description": "Tennessine is a halogen with symbol Ts and atomic number 117. At room conditions, its standard state is an expected to be a solid. It is placed in period 7, group 17. It has 7 valence electrons, which strongly shape its bonding behavior.",
    "sourceTitle": "Tennessine",
    "wikidataId": "Q1306"
  },
  "Og": {
    "discoveredBy": "Joint Institute for Nuclear Research",
    "discoveryYear": "2006",
    "discoveryText": "Joint Institute for Nuclear Research, 2006",
    "description": "Oganesson is a noble gas with symbol Og and atomic number 118. At room conditions, its standard state is an expected to be a gas. It is placed in period 7, group 18. It has 8 valence electrons, which strongly shape its bonding behavior.",
    "sourceTitle": "Oganesson",
    "wikidataId": "Q1307"
  }
};
