export function structuralBonds(bonds) {
    return bonds.filter((bond) => bond.kind !== "hydrogen" && bond.kind !== "dispersion");
}
export function buildMoleculeGraph(atoms, bonds) {
    const atomById = new Map(atoms.map((atom) => [atom.id, atom]));
    const neighborsById = new Map(atoms.map((atom) => [atom.id, []]));
    const bondsByAtomId = new Map(atoms.map((atom) => [atom.id, []]));
    for (const bond of structuralBonds(bonds)) {
        const a = atomById.get(bond.a);
        const b = atomById.get(bond.b);
        if (!a || !b)
            continue;
        neighborsById.get(a.id)?.push(b);
        neighborsById.get(b.id)?.push(a);
        bondsByAtomId.get(a.id)?.push(bond);
        bondsByAtomId.get(b.id)?.push(bond);
    }
    return { atomById, neighborsById, bondsByAtomId };
}
