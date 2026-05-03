import { buildMoleculeGraph } from "./graph.js";
import { analyzeAtomGeometry } from "./vsepr.js";
const templates = {
    AX2: [
        { x: 1, y: 0, z: 0 },
        { x: -1, y: 0, z: 0 }
    ],
    AX3: [
        { x: 1, y: 0, z: 0 },
        { x: -0.5, y: 0.866, z: 0 },
        { x: -0.5, y: -0.866, z: 0 }
    ],
    AX2E: [
        { x: 0.866, y: 0.5, z: 0 },
        { x: -0.866, y: 0.5, z: 0 }
    ],
    AX4: [
        { x: 0.943, y: 0, z: -0.333 },
        { x: -0.471, y: 0.816, z: -0.333 },
        { x: -0.471, y: -0.816, z: -0.333 },
        { x: 0, y: 0, z: 1 }
    ],
    AX3E: [
        { x: 0.94, y: 0, z: -0.18 },
        { x: -0.47, y: 0.814, z: -0.18 },
        { x: -0.47, y: -0.814, z: -0.18 }
    ],
    AX2E2: [
        { x: 0.79, y: 0.42, z: -0.45 },
        { x: -0.79, y: 0.42, z: -0.45 }
    ],
    AX5: [
        { x: 1, y: 0, z: 0 },
        { x: -0.5, y: 0.866, z: 0 },
        { x: -0.5, y: -0.866, z: 0 },
        { x: 0, y: 0, z: 1 },
        { x: 0, y: 0, z: -1 }
    ],
    AX6: [
        { x: 1, y: 0, z: 0 },
        { x: -1, y: 0, z: 0 },
        { x: 0, y: 1, z: 0 },
        { x: 0, y: -1, z: 0 },
        { x: 0, y: 0, z: 1 },
        { x: 0, y: 0, z: -1 }
    ]
};
export function applyVsepr3DTargets(atoms, bonds) {
    const graph = buildMoleculeGraph(atoms, bonds);
    const targets = new Map();
    for (const center of atoms) {
        const analysis = analyzeAtomGeometry(center, atoms, bonds);
        const neighbors = graph.neighborsById.get(center.id) ?? [];
        if (!analysis || neighbors.length < 2)
            continue;
        const baseVectors = templates[analysis.axe] ?? templates[`AX${neighbors.length}`];
        if (!baseVectors || baseVectors.length < neighbors.length)
            continue;
        const orderedNeighbors = [...neighbors].sort((a, b) => Math.atan2(a.y - center.y, a.x - center.x) - Math.atan2(b.y - center.y, b.x - center.x));
        const orderedVectors = [...baseVectors].sort((a, b) => Math.atan2(a.y, a.x) - Math.atan2(b.y, b.x));
        const centerZ = center.z ?? 0;
        orderedNeighbors.forEach((neighbor, index) => {
            const vector = repelledByLonePairs(orderedVectors[index], analysis.axe, analysis.lonePairs);
            const bond = graph.bondsByAtomId.get(center.id)?.find((item) => item.a === neighbor.id || item.b === neighbor.id);
            const length = bond?.length ?? Math.hypot(neighbor.x - center.x, neighbor.y - center.y);
            const next = {
                x: center.x + vector.x * length,
                y: center.y + vector.y * length,
                z: centerZ + vector.z * length
            };
            const existing = targets.get(neighbor.id);
            if (existing) {
                existing.x += next.x;
                existing.y += next.y;
                existing.z += next.z;
                existing.count += 1;
            }
            else {
                targets.set(neighbor.id, { ...next, count: 1 });
            }
        });
    }
    for (const atom of atoms) {
        const target = targets.get(atom.id);
        if (target) {
            atom.targetX = target.x / target.count;
            atom.targetY = target.y / target.count;
            atom.targetZ = target.z / target.count;
        }
        else if (atom.targetZ === undefined) {
            atom.targetZ = 0;
        }
    }
}
function repelledByLonePairs(vector, axe, lonePairs) {
    if (lonePairs <= 0)
        return vector;
    const loneVectors = lonePairVectorsFor(axe, lonePairs);
    if (!loneVectors.length)
        return vector;
    const repelled = loneVectors.reduce((current, lone) => ({
        x: current.x - lone.x * 0.16,
        y: current.y - lone.y * 0.16,
        z: current.z - lone.z * 0.16
    }), { ...vector });
    return normalizeVec(repelled);
}
function lonePairVectorsFor(axe, lonePairs) {
    const map = {
        AX3E: [{ x: 0, y: 0, z: 1 }],
        AX2E2: [{ x: 0.64, y: -0.5, z: 0.58 }, { x: -0.64, y: -0.5, z: 0.58 }],
        AX2E: [{ x: 0, y: -1, z: 0 }]
    };
    return (map[axe] ?? []).slice(0, lonePairs).map(normalizeVec);
}
function normalizeVec(vector) {
    const length = Math.max(0.001, Math.hypot(vector.x, vector.y, vector.z));
    return { x: vector.x / length, y: vector.y / length, z: vector.z / length };
}
