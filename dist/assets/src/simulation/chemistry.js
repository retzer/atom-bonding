import { atomData } from "../data/atoms.js";
const covalentPairs = {
    "B-C": 1,
    "B-F": 1,
    "B-H": 1,
    "H-H": 1,
    "Br-Br": 1,
    "C-H": 1,
    "Cl-Cl": 1,
    "H-N": 1,
    "H-O": 1,
    "F-F": 1,
    "H-Br": 1,
    "H-Cl": 1,
    "H-F": 1,
    "H-I": 1,
    "I-I": 1,
    "C-O": 2,
    "C-C": 1,
    "C-N": 1,
    "N-N": 3,
    "O-O": 2,
    "O-S": 2,
    "N-O": 2,
    "C-P": 1,
    "C-Se": 1,
    "C-S": 1,
    "Cl-P": 1,
    "H-P": 1,
    "H-Se": 1,
    "H-S": 1,
    "O-P": 1,
    "P-P": 1,
    "P-S": 1,
    "Se-Se": 1,
    "C-F": 1,
    "C-Cl": 1,
    "C-Br": 1,
    "C-I": 1,
    "Al-Cl": 1,
    "Al-F": 1,
    "O-Si": 1,
    "Si-Si": 1,
    "H-Si": 1,
    "Ge-H": 1,
    "Ge-O": 1,
    "Ge-Ge": 1,
    "As-H": 1,
    "As-Cl": 1,
    "Sb-Cl": 1,
    "H-Te": 1,
    "O-Te": 2
};
const pairKey = (a, b) => [a, b].sort().join("-");
export const bondKindLabel = {
    "nonpolar-covalent": "Nonpolar covalent",
    "polar-covalent": "Polar covalent",
    ionic: "Ionic",
    metallic: "Metallic",
    hydrogen: "Hydrogen bond",
    dispersion: "London dispersion"
};
export function desiredBondOrder(a, b) {
    return covalentPairs[pairKey(a, b)] ?? 1;
}
export function classifyBond(a, b, emphasis) {
    const atomA = atomData[a];
    const atomB = atomData[b];
    if (atomA.metal && atomB.metal)
        return "metallic";
    const diff = Math.abs(atomA.electronegativity - atomB.electronegativity) * emphasis;
    if (diff >= 1.7 && (atomA.metal || atomB.metal))
        return "ionic";
    if (diff >= 0.45)
        return "polar-covalent";
    return "nonpolar-covalent";
}
export function availableBondSlots(atom, bonds) {
    const currentOrder = bonds
        .filter((bond) => bond.a === atom.id || bond.b === atom.id)
        .reduce((sum, bond) => sum + bond.order, 0);
    return atomData[atom.symbol].maxBonds - currentOrder;
}
export function canBond(a, b, bonds, settings) {
    if (a.id === b.id)
        return false;
    if (bonds.some((bond) => (bond.a === a.id && bond.b === b.id) || (bond.a === b.id && bond.b === a.id)))
        return false;
    const kind = classifyBond(a.symbol, b.symbol, settings.electronegativityEmphasis);
    if (kind === "metallic")
        return false;
    const order = kind === "ionic" ? 1 : desiredBondOrder(a.symbol, b.symbol);
    return availableBondSlots(a, bonds) >= order && availableBondSlots(b, bonds) >= order;
}
export function makeBond(a, b, time, settings) {
    const kind = classifyBond(a.symbol, b.symbol, settings.electronegativityEmphasis);
    const order = kind === "ionic" ? 1 : desiredBondOrder(a.symbol, b.symbol);
    const atomA = atomData[a.symbol];
    const atomB = atomData[b.symbol];
    const polarity = Math.abs(atomA.electronegativity - atomB.electronegativity);
    const length = Math.max(78, (atomA.covalentRadius + atomB.covalentRadius) * 0.86);
    const electronShift = atomA.electronegativity === atomB.electronegativity
        ? undefined
        : atomA.electronegativity > atomB.electronegativity ? a.id : b.id;
    return {
        id: `bond-${a.id}-${b.id}-${Math.round(time * 1000)}`,
        a: a.id,
        b: b.id,
        kind,
        order,
        strength: kind === "ionic" ? 0.08 : 0.14 + order * 0.04,
        length,
        formedAt: time,
        polarity,
        electronShift
    };
}
export function applyIonCharges(a, b) {
    const atomA = atomData[a.symbol];
    const atomB = atomData[b.symbol];
    const chargeFor = (atom) => {
        if (["Be", "Mg", "Ca", "Sr", "Ba", "Zn", "Hg", "Fe"].includes(atom.symbol))
            return 2;
        if (["Al", "Ga", "N", "P", "As", "Sb", "Bi"].includes(atom.symbol))
            return 3;
        if (["O", "S", "Se", "Te"].includes(atom.symbol))
            return 2;
        return 1;
    };
    if (atomA.electronegativity > atomB.electronegativity) {
        a.charge -= chargeFor(atomA);
        b.charge += chargeFor(atomB);
    }
    else {
        b.charge -= chargeFor(atomB);
        a.charge += chargeFor(atomA);
    }
}
export function eventForBond(bond, a, b) {
    const atomA = atomData[a.symbol];
    const atomB = atomData[b.symbol];
    const names = `${atomA.name} and ${atomB.name}`;
    if (bond.kind === "ionic") {
        const acceptor = atomA.electronegativity > atomB.electronegativity ? atomA.name : atomB.name;
        const donor = atomA.electronegativity > atomB.electronegativity ? atomB.name : atomA.name;
        return {
            id: `event-${bond.id}`,
            time: bond.formedAt,
            title: `${bondKindLabel[bond.kind]} bond formed`,
            plain: `${donor} transfers valence electron density to ${acceptor}. The atoms become oppositely charged ions that attract.`,
            science: `The electronegativity gap is large, so this model treats the interaction as electron transfer followed by Coulombic attraction between ions.`,
            bondId: bond.id
        };
    }
    const pairText = bond.order === 1 ? "one pair" : bond.order === 2 ? "two pairs" : "three pairs";
    const polarity = bond.kind === "polar-covalent" ? " One atom pulls harder, so partial charges appear." : " Both atoms pull about equally, so the bond is nonpolar.";
    return {
        id: `event-${bond.id}`,
        time: bond.formedAt,
        title: `${bondKindLabel[bond.kind]} bond formed`,
        plain: `${names} share ${pairText} of electrons.${polarity}`,
        science: `A ${bond.order === 1 ? "single" : bond.order === 2 ? "double" : "triple"} covalent bond is shown as shared electron density between valence shells. The electronegativity difference is ${bond.polarity.toFixed(2)}.`,
        bondId: bond.id
    };
}
export function stableShellText(symbol) {
    const atom = atomData[symbol];
    if (symbol === "H")
        return "duet tendency: 2 electrons in the first shell";
    if (atom.nobleGas)
        return "already stable: full valence shell";
    if (atom.metal)
        return "often stabilizes by losing valence electrons";
    return "octet tendency: 8 electrons in the valence shell";
}
