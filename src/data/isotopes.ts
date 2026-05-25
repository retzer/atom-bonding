import { periodicElements } from "./periodicTable";
import type { AtomSymbol, DecayBranch, DecayMode, IsotopeRecord } from "../types";

const SECOND = 1;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const YEAR = 365.25 * DAY;

const elementBySymbol = new Map(periodicElements.map((element) => [element.symbol, element]));
const elementByAtomicNumber = new Map(periodicElements.map((element) => [element.atomicNumber, element]));

export const isotopeDataSources = [
  "IAEA LiveChart / ENSDF for nuclide half-lives and decay modes",
  "NIST atomic weights and isotopic compositions for stable isotope context"
] as const;

export function isotopeId(symbol: AtomSymbol, massNumber: number) {
  return `${symbol}-${massNumber}`;
}

export function elementForAtomicNumber(atomicNumber: number) {
  return elementByAtomicNumber.get(atomicNumber as (typeof periodicElements)[number]["atomicNumber"]) ?? null;
}

function massNumberFromAtomicMass(raw: string | number) {
  const text = String(raw);
  const bracket = text.match(/\[(\d+)/);
  if (bracket) return Number(bracket[1]);
  const parsed = Number.parseFloat(text.replace(/[^\d.-]/g, ""));
  return Number.isFinite(parsed) ? Math.max(1, Math.round(parsed)) : 1;
}

function product(symbol: AtomSymbol, massNumber: number) {
  const element = elementBySymbol.get(symbol);
  if (!element) throw new Error(`Unsupported decay daughter symbol: ${symbol}`);
  return {
    atomicNumber: element.atomicNumber,
    symbol,
    massNumber,
    neutronCount: Math.max(0, massNumber - element.atomicNumber)
  };
}

function branch(mode: DecayMode, description: string, daughter?: { symbol: AtomSymbol; massNumber: number }, probability = 1): DecayBranch {
  return {
    mode,
    probability,
    daughter: daughter ? product(daughter.symbol, daughter.massNumber) : undefined,
    description
  };
}

function record(
  symbol: AtomSymbol,
  massNumber: number,
  options: {
    stable?: boolean;
    abundance?: number;
    halfLifeSeconds?: number | null;
    halfLifeLabel?: string;
    branches?: DecayBranch[];
    source?: IsotopeRecord["source"];
    reference?: boolean;
    notes?: string;
  } = {}
): IsotopeRecord {
  const element = elementBySymbol.get(symbol);
  if (!element) throw new Error(`Unsupported isotope symbol: ${symbol}`);
  const stable = options.stable ?? !options.halfLifeSeconds;
  return {
    id: isotopeId(symbol, massNumber),
    symbol,
    atomicNumber: element.atomicNumber,
    massNumber,
    neutronCount: Math.max(0, massNumber - element.atomicNumber),
    label: `${symbol}-${massNumber}`,
    stable,
    stability: stable ? "stable" : "radioactive",
    naturalAbundance: options.abundance,
    halfLifeSeconds: options.halfLifeSeconds ?? null,
    halfLifeLabel: stable ? "stable" : options.halfLifeLabel,
    decayBranches: stable ? [] : options.branches ?? [],
    source: options.source ?? (stable ? "NIST" : "curated reference"),
    reference: options.reference,
    notes: options.notes
  };
}

const curatedIsotopes: IsotopeRecord[] = [
  record("H", 1, { stable: true, abundance: 99.985, notes: "Protium is the most abundant hydrogen isotope." }),
  record("H", 2, { stable: true, abundance: 0.015, notes: "Deuterium has one proton and one neutron." }),
  record("H", 3, {
    stable: false,
    halfLifeSeconds: 12.32 * YEAR,
    halfLifeLabel: "12.32 years",
    branches: [branch("beta-minus", "A neutron becomes a proton, forming helium-3.", { symbol: "He", massNumber: 3 })],
    notes: "Tritium is radioactive hydrogen."
  }),
  record("He", 3, { stable: true, abundance: 0.000137 }),
  record("He", 4, { stable: true, abundance: 99.999863 }),
  record("C", 12, { stable: true, abundance: 98.93 }),
  record("C", 13, { stable: true, abundance: 1.07 }),
  record("C", 14, {
    stable: false,
    halfLifeSeconds: 5730 * YEAR,
    halfLifeLabel: "5,730 years",
    branches: [branch("beta-minus", "A neutron converts into a proton, transmuting carbon-14 into nitrogen-14.", { symbol: "N", massNumber: 14 })],
    notes: "Carbon-14 is used in radiocarbon dating."
  }),
  record("N", 14, { stable: true, abundance: 99.636 }),
  record("N", 15, { stable: true, abundance: 0.364 }),
  record("O", 16, { stable: true, abundance: 99.757 }),
  record("O", 17, { stable: true, abundance: 0.038 }),
  record("O", 18, { stable: true, abundance: 0.205 }),
  record("P", 31, { stable: true, abundance: 100 }),
  record("S", 32, { stable: true, abundance: 94.99 }),
  record("Cl", 35, { stable: true, abundance: 75.76 }),
  record("Cl", 37, { stable: true, abundance: 24.24 }),
  record("K", 40, {
    stable: false,
    halfLifeSeconds: 1.248e9 * YEAR,
    halfLifeLabel: "1.248 billion years",
    branches: [
      branch("beta-minus", "The neutron-rich branch forms calcium-40.", { symbol: "Ca", massNumber: 40 }, 0.893),
      branch("electron-capture", "Electron capture forms argon-40.", { symbol: "Ar", massNumber: 40 }, 0.107)
    ],
    notes: "Potassium-40 is a naturally occurring radioisotope."
  }),
  record("Ca", 40, { stable: true, abundance: 96.941 }),
  record("Fe", 56, { stable: true, abundance: 91.754 }),
  record("Co", 60, {
    stable: false,
    halfLifeSeconds: 5.271 * YEAR,
    halfLifeLabel: "5.27 years",
    branches: [branch("beta-minus", "Cobalt-60 beta decays to nickel-60.", { symbol: "Ni", massNumber: 60 })],
    notes: "Cobalt-60 is a common gamma-emitting reference isotope."
  }),
  record("Sr", 90, {
    stable: false,
    halfLifeSeconds: 28.79 * YEAR,
    halfLifeLabel: "28.79 years",
    branches: [branch("beta-minus", "Strontium-90 beta decays to yttrium-90.", { symbol: "Y", massNumber: 90 })],
    notes: "Strontium-90 is a fission-product radioisotope."
  }),
  record("I", 127, { stable: true, abundance: 100 }),
  record("I", 131, {
    stable: false,
    halfLifeSeconds: 8.02 * DAY,
    halfLifeLabel: "8.02 days",
    branches: [branch("beta-minus", "Iodine-131 beta decays to xenon-131.", { symbol: "Xe", massNumber: 131 })],
    notes: "Iodine-131 is important in nuclear medicine and fallout monitoring."
  }),
  record("Cs", 137, {
    stable: false,
    halfLifeSeconds: 30.17 * YEAR,
    halfLifeLabel: "30.17 years",
    branches: [branch("beta-minus", "Cesium-137 beta decays to barium-137.", { symbol: "Ba", massNumber: 137 })],
    notes: "Cesium-137 is a long-lived fission product."
  }),
  record("Bi", 209, {
    stable: false,
    halfLifeSeconds: 2.01e19 * YEAR,
    halfLifeLabel: "about 2.01e19 years",
    branches: [branch("alpha", "Bismuth-209 alpha decays extremely slowly to thallium-205.", { symbol: "Tl", massNumber: 205 })],
    notes: "Bismuth-209 is radioactive, but its half-life is so long that it behaves as effectively stable in ordinary chemistry."
  }),
  record("Tc", 99, {
    stable: false,
    halfLifeSeconds: 211000 * YEAR,
    halfLifeLabel: "211,000 years",
    branches: [branch("beta-minus", "Technetium-99 beta decays to ruthenium-99.", { symbol: "Ru", massNumber: 99 })],
    reference: true,
    notes: "Technetium has no stable isotopes."
  }),
  record("Pm", 145, {
    stable: false,
    halfLifeSeconds: 17.7 * YEAR,
    halfLifeLabel: "17.7 years",
    branches: [branch("electron-capture", "Promethium-145 captures an electron to form neodymium-145.", { symbol: "Nd", massNumber: 145 })],
    reference: true,
    notes: "Promethium has no stable isotopes."
  }),
  record("Po", 210, { stable: false, halfLifeSeconds: 138 * DAY, halfLifeLabel: "138 days", branches: [branch("alpha", "Polonium-210 alpha decays to lead-206.", { symbol: "Pb", massNumber: 206 })], reference: true }),
  record("At", 210, { stable: false, halfLifeSeconds: 8.1 * HOUR, halfLifeLabel: "8.1 hours", branches: [branch("alpha", "Astatine-210 alpha decay forms bismuth-206.", { symbol: "Bi", massNumber: 206 })], reference: true }),
  record("Rn", 222, { stable: false, halfLifeSeconds: 3.82 * DAY, halfLifeLabel: "3.82 days", branches: [branch("alpha", "Radon-222 alpha decays to polonium-218.", { symbol: "Po", massNumber: 218 })], reference: true }),
  record("Fr", 223, { stable: false, halfLifeSeconds: 22 * MINUTE, halfLifeLabel: "22 minutes", branches: [branch("beta-minus", "Francium-223 beta decays to radium-223.", { symbol: "Ra", massNumber: 223 })], reference: true }),
  record("Ra", 226, { stable: false, halfLifeSeconds: 1600 * YEAR, halfLifeLabel: "1,600 years", branches: [branch("alpha", "Radium-226 alpha decays to radon-222.", { symbol: "Rn", massNumber: 222 })], reference: true }),
  record("Ac", 227, { stable: false, halfLifeSeconds: 21.8 * YEAR, halfLifeLabel: "21.8 years", branches: [branch("beta-minus", "Actinium-227 beta decays to thorium-227.", { symbol: "Th", massNumber: 227 })], reference: true }),
  record("Th", 232, { stable: false, halfLifeSeconds: 14.0e9 * YEAR, halfLifeLabel: "14.0 billion years", branches: [branch("alpha", "Thorium-232 alpha decays to radium-228.", { symbol: "Ra", massNumber: 228 })], reference: true }),
  record("Pa", 231, { stable: false, halfLifeSeconds: 32760 * YEAR, halfLifeLabel: "32,760 years", branches: [branch("alpha", "Protactinium-231 alpha decays to actinium-227.", { symbol: "Ac", massNumber: 227 })], reference: true }),
  record("U", 238, { stable: false, halfLifeSeconds: 4.468e9 * YEAR, halfLifeLabel: "4.468 billion years", branches: [branch("alpha", "Uranium-238 alpha decays to thorium-234.", { symbol: "Th", massNumber: 234 })], reference: true }),
  record("Np", 237, { stable: false, halfLifeSeconds: 2.14e6 * YEAR, halfLifeLabel: "2.14 million years", branches: [branch("alpha", "Neptunium-237 alpha decays to protactinium-233.", { symbol: "Pa", massNumber: 233 })], reference: true }),
  record("Pu", 239, { stable: false, halfLifeSeconds: 24110 * YEAR, halfLifeLabel: "24,110 years", branches: [branch("alpha", "Plutonium-239 alpha decays to uranium-235.", { symbol: "U", massNumber: 235 })], reference: true }),
  record("Am", 241, { stable: false, halfLifeSeconds: 432.2 * YEAR, halfLifeLabel: "432 years", branches: [branch("alpha", "Americium-241 alpha decays to neptunium-237.", { symbol: "Np", massNumber: 237 })], reference: true }),
  record("Cm", 247, { stable: false, halfLifeSeconds: 15.6e6 * YEAR, halfLifeLabel: "15.6 million years", branches: [branch("alpha", "Curium-247 alpha decays to plutonium-243.", { symbol: "Pu", massNumber: 243 })], reference: true }),
  record("Bk", 249, { stable: false, halfLifeSeconds: 330 * DAY, halfLifeLabel: "330 days", branches: [branch("beta-minus", "Berkelium-249 beta decays to californium-249.", { symbol: "Cf", massNumber: 249 })], reference: true }),
  record("Cf", 251, { stable: false, halfLifeSeconds: 898 * YEAR, halfLifeLabel: "898 years", branches: [branch("alpha", "Californium-251 alpha decays to curium-247.", { symbol: "Cm", massNumber: 247 })], reference: true }),
  record("Es", 252, { stable: false, halfLifeSeconds: 472 * DAY, halfLifeLabel: "472 days", branches: [branch("alpha", "Einsteinium-252 alpha decay forms berkelium-248.", { symbol: "Bk", massNumber: 248 })], reference: true }),
  record("Fm", 257, { stable: false, halfLifeSeconds: 100 * DAY, halfLifeLabel: "100 days", branches: [branch("alpha", "Fermium-257 alpha decay forms californium-253.", { symbol: "Cf", massNumber: 253 })], reference: true }),
  record("Md", 258, { stable: false, halfLifeSeconds: 51.5 * DAY, halfLifeLabel: "51.5 days", branches: [branch("alpha", "Mendelevium-258 alpha decay forms einsteinium-254.", { symbol: "Es", massNumber: 254 })], reference: true }),
  record("No", 259, { stable: false, halfLifeSeconds: 58 * MINUTE, halfLifeLabel: "58 minutes", branches: [branch("alpha", "Nobelium-259 alpha decays to fermium-255.", { symbol: "Fm", massNumber: 255 })], reference: true }),
  record("Lr", 266, {
    stable: false,
    halfLifeSeconds: 11 * HOUR,
    halfLifeLabel: "11 hours",
    branches: [branch("spontaneous-fission", "Lawrencium-266 is represented as a spontaneous-fission isotope. V1 does not guess deterministic fission fragments.", undefined)],
    reference: true,
    notes: "Do not collapse this isotope into a guessed alpha chain; fission products require source-backed fragment data."
  }),
  record("Rf", 267, { stable: false, halfLifeSeconds: 1.3 * HOUR, halfLifeLabel: "1.3 hours", branches: [branch("alpha", "Rutherfordium-267 alpha decay forms nobelium-263.", { symbol: "No", massNumber: 263 })], reference: true }),
  record("Db", 268, { stable: false, halfLifeSeconds: 32 * HOUR, halfLifeLabel: "32 hours", branches: [branch("alpha", "Dubnium-268 alpha decay forms lawrencium-264.", { symbol: "Lr", massNumber: 264 })], reference: true }),
  record("Sg", 271, { stable: false, halfLifeSeconds: 2.4 * MINUTE, halfLifeLabel: "2.4 minutes", branches: [branch("alpha", "Seaborgium-271 alpha decay forms rutherfordium-267.", { symbol: "Rf", massNumber: 267 })], reference: true }),
  record("Bh", 270, { stable: false, halfLifeSeconds: 61, halfLifeLabel: "61 seconds", branches: [branch("alpha", "Bohrium-270 alpha decay forms dubnium-266.", { symbol: "Db", massNumber: 266 })], reference: true }),
  record("Hs", 277, { stable: false, halfLifeSeconds: 11 * MINUTE, halfLifeLabel: "11 minutes", branches: [branch("alpha", "Hassium-277 alpha decay forms seaborgium-273.", { symbol: "Sg", massNumber: 273 })], reference: true }),
  record("Mt", 278, { stable: false, halfLifeSeconds: 4, halfLifeLabel: "4 seconds", branches: [branch("alpha", "Meitnerium-278 alpha decay forms bohrium-274.", { symbol: "Bh", massNumber: 274 })], reference: true }),
  record("Ds", 281, { stable: false, halfLifeSeconds: 12.7, halfLifeLabel: "12.7 seconds", branches: [branch("alpha", "Darmstadtium-281 alpha decay forms hassium-277.", { symbol: "Hs", massNumber: 277 })], reference: true }),
  record("Rg", 282, { stable: false, halfLifeSeconds: 100, halfLifeLabel: "100 seconds", branches: [branch("alpha", "Roentgenium-282 alpha decay forms meitnerium-278.", { symbol: "Mt", massNumber: 278 })], reference: true }),
  record("Cn", 285, { stable: false, halfLifeSeconds: 29, halfLifeLabel: "29 seconds", branches: [branch("alpha", "Copernicium-285 alpha decay forms darmstadtium-281.", { symbol: "Ds", massNumber: 281 })], reference: true }),
  record("Nh", 286, { stable: false, halfLifeSeconds: 20, halfLifeLabel: "20 seconds", branches: [branch("alpha", "Nihonium-286 alpha decay forms roentgenium-282.", { symbol: "Rg", massNumber: 282 })], reference: true }),
  record("Fl", 289, { stable: false, halfLifeSeconds: 1.9, halfLifeLabel: "1.9 seconds", branches: [branch("alpha", "Flerovium-289 alpha decay forms copernicium-285.", { symbol: "Cn", massNumber: 285 })], reference: true }),
  record("Mc", 290, { stable: false, halfLifeSeconds: 0.65, halfLifeLabel: "0.65 seconds", branches: [branch("alpha", "Moscovium-290 alpha decay forms nihonium-286.", { symbol: "Nh", massNumber: 286 })], reference: true }),
  record("Lv", 293, { stable: false, halfLifeSeconds: 0.06, halfLifeLabel: "60 milliseconds", branches: [branch("alpha", "Livermorium-293 alpha decay forms flerovium-289.", { symbol: "Fl", massNumber: 289 })], reference: true }),
  record("Ts", 294, { stable: false, halfLifeSeconds: 0.051, halfLifeLabel: "51 milliseconds", branches: [branch("alpha", "Tennessine-294 alpha decay forms moscovium-290.", { symbol: "Mc", massNumber: 290 })], reference: true }),
  record("Og", 294, { stable: false, halfLifeSeconds: 0.0007, halfLifeLabel: "0.7 milliseconds", branches: [branch("alpha", "Oganesson-294 alpha decay forms livermorium-290.", { symbol: "Lv", massNumber: 290 })], reference: true })
];

const curatedById = new Map(curatedIsotopes.map((item) => [item.id, item]));
const unstableReferenceBySymbol = new Map(curatedIsotopes.filter((item) => item.reference).map((item) => [item.symbol, item]));

function defaultRecordForElement(element: (typeof periodicElements)[number]) {
  const reference = unstableReferenceBySymbol.get(element.symbol);
  if (reference) return reference;
  const massNumber = massNumberFromAtomicMass(element.atomicMass);
  return curatedById.get(isotopeId(element.symbol, massNumber)) ?? record(element.symbol, massNumber, {
    stable: element.atomicNumber < 84 && element.symbol !== "Tc" && element.symbol !== "Pm",
    source: element.atomicNumber < 84 && element.symbol !== "Tc" && element.symbol !== "Pm" ? "NIST" : "local estimate",
    reference: element.atomicNumber >= 84,
    notes: element.atomicNumber < 84
      ? "Default isotope chosen from the element atomic-mass entry."
      : "Fallback reference isotope generated from the element mass entry until a source-backed record is added."
  });
}

const defaultRecords = periodicElements.map(defaultRecordForElement);
const allRecords = [...defaultRecords, ...curatedIsotopes];
const deduped = new Map<string, IsotopeRecord>();
for (const item of allRecords) {
  const existing = deduped.get(item.id);
  if (!existing || item.reference || item.source !== "local estimate") deduped.set(item.id, item);
}

export const isotopeRecords = [...deduped.values()].sort((a, b) => a.atomicNumber - b.atomicNumber || a.massNumber - b.massNumber);
export const isotopeRecordsById = new Map(isotopeRecords.map((item) => [item.id, item]));
export const isotopeRecordsBySymbol = new Map<AtomSymbol, IsotopeRecord[]>();

for (const item of isotopeRecords) {
  const list = isotopeRecordsBySymbol.get(item.symbol) ?? [];
  list.push(item);
  isotopeRecordsBySymbol.set(item.symbol, list.sort((a, b) => a.massNumber - b.massNumber));
}

export const defaultIsotopeBySymbol = new Map<AtomSymbol, IsotopeRecord>();
for (const element of periodicElements) {
  const reference = unstableReferenceBySymbol.get(element.symbol);
  const massNumber = massNumberFromAtomicMass(element.atomicMass);
  const defaultRecord = reference ?? isotopeRecordsById.get(isotopeId(element.symbol, massNumber)) ?? defaultRecordForElement(element);
  defaultIsotopeBySymbol.set(element.symbol, defaultRecord);
}
