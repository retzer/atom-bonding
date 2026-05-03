import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from "react";
import { Activity, ChevronDown, CircleHelp, ListChecks, Orbit, Share2, SlidersHorizontal, Waves } from "lucide-react";
import { atomData } from "../data/atoms.js";
export function ControlDock({ settings, atoms, bonds, hydrogenBonds, events, activePreset, onSetting, onSpawnAtom, onShareScene }) {
    const selectElement = (symbol) => {
        onSetting("selectedElements", [symbol]);
        onSpawnAtom(symbol);
    };
    const inventory = sceneInventory(atoms, bonds);
    return (_jsxs("section", { className: "control-dock", "aria-label": "Simulation controls", children: [_jsxs("div", { className: "dock-title", children: [_jsx(SlidersHorizontal, { size: 18 }), _jsx("h2", { children: "Controls" })] }), _jsxs("div", { className: "control-section", children: [_jsx("div", { className: "control-section-title", children: "Physics" }), _jsxs("div", { className: "control-grid compact-grid", children: [_jsx(Slider, { label: "Temperature", title: "Higher temperature makes atoms move faster.", value: settings.temperature, min: 0.1, max: 1.8, step: 0.05, onChange: (value) => onSetting("temperature", value) }), _jsx(Slider, { label: "Speed", title: "Overall simulation playback speed.", value: settings.speed, min: 0.2, max: 2.4, step: 0.05, onChange: (value) => onSetting("speed", value) }), _jsx(Slider, { label: "Collision", title: "How strongly atoms bounce when they do not bond.", value: settings.collisionStrength, min: 0.2, max: 1.4, step: 0.05, onChange: (value) => onSetting("collisionStrength", value) }), _jsx(Slider, { label: "EN difference", title: "Emphasizes electronegativity difference when classifying bonds.", value: settings.electronegativityEmphasis, min: 0.7, max: 1.5, step: 0.05, onChange: (value) => onSetting("electronegativityEmphasis", value) }), _jsx(Slider, { label: "Bond distance", title: "How close atoms must be before bond rules are tested.", value: settings.bondingDistance, min: 1.45, max: 2.8, step: 0.05, onChange: (value) => onSetting("bondingDistance", value) }), _jsx(Slider, { label: "Zoom", title: "Scale the simulation viewport without changing the chemistry.", value: settings.zoom, min: 0.55, max: 2.2, step: 0.05, onChange: (value) => onSetting("zoom", value) })] }), _jsxs("div", { className: "projection-row", "aria-label": "Geometry behavior", children: [_jsxs("button", { className: settings.geometryMode === "rigid" ? "visual-choice active" : "visual-choice", title: "Strict textbook VSEPR geometry with minimal exploratory motion", onClick: () => onSetting("geometryMode", "rigid"), children: [_jsx(Orbit, { size: 15 }), "Rigid"] }), _jsxs("button", { className: settings.geometryMode === "flexible" ? "visual-choice active" : "visual-choice", title: "Flexible exploration mode with gentle motion and spacing response", onClick: () => onSetting("geometryMode", "flexible"), children: [_jsx(Waves, { size: 15 }), "Flexible"] })] })] }), _jsxs("div", { className: "control-section", children: [_jsx("div", { className: "control-section-title", children: "Elements" }), _jsx("div", { className: "element-board quick-element-board", "aria-label": "Choose a common atom", children: _jsxs("div", { className: "element-group quick-elements", children: [_jsx("div", { className: "element-group-title", children: "Common starters" }), _jsx("div", { className: "element-picker", children: quickElementSymbols.map((symbol) => {
                                        const atom = atomData[symbol];
                                        return (_jsx("button", { className: settings.selectedElements.includes(atom.symbol) ? "selected" : "", style: { "--atom-color": atom.color }, title: `${atom.name}: ${atom.behavior}`, onClick: () => selectElement(atom.symbol), children: atom.symbol }, atom.symbol));
                                    }) }), _jsx("p", { className: "element-group-hint", children: "Open the full periodic table under the simulator for all 118 elements." })] }) })] }), _jsx("div", { className: "control-section control-section-inline", children: _jsx("div", { className: "spawn-row", children: _jsxs("button", { className: "spawn-button", title: "Copy a shareable link for the current scene", onClick: onShareScene, children: [_jsx(Share2, { size: 16 }), "Share scene"] }) }) }), _jsx(CollapsibleSection, { icon: _jsx(ListChecks, { size: 18 }), title: "Scene Composition", defaultOpen: false, children: inventory.groups.length ? (_jsxs(_Fragment, { children: [_jsx("div", { className: "composition-list", children: inventory.groups.map((group) => (_jsxs("article", { children: [_jsx("strong", { children: group.formula }), _jsxs("span", { children: [group.quantity, " ", group.atomCount === 1 ? "atom" : "molecule", group.quantity > 1 ? "s" : "", " - ", group.atomCount, " atoms - ", group.bondCount, " bonds"] }), _jsx("p", { children: group.elements })] }, group.key))) }), _jsxs("p", { className: "composition-total", children: [inventory.totalAtoms, " atoms total - ", inventory.totalBonds, " bonds total - ", inventory.elements] })] })) : (_jsx("p", { className: "muted", children: "No compositions yet. Click an element to add atoms, or choose a preset molecule." })) }), _jsx(CollapsibleSection, { icon: _jsx(Activity, { size: 18 }), title: "Recent Events", defaultOpen: false, children: _jsx("div", { className: "event-list", children: events.length ? events.slice(0, 4).map((event) => (_jsxs("article", { children: [_jsx("strong", { children: event.title }), _jsx("p", { children: event.plain })] }, event.id))) : _jsx("p", { className: "muted", children: "No bond event yet. Spawn atoms in Free Simulation or choose a preset molecule." }) }) }), _jsx(CollapsibleSection, { icon: _jsx(CircleHelp, { size: 18 }), title: "Legend", defaultOpen: false, children: _jsxs("div", { className: "legend-grid", children: [_jsxs("span", { children: [_jsx("i", { className: "legend-electron" }), "Valence electron"] }), _jsxs("span", { children: [_jsx("i", { className: "legend-covalent" }), "Covalent sharing"] }), _jsxs("span", { children: [_jsx("i", { className: "legend-ionic" }), "Ionic transfer"] }), _jsxs("span", { children: [_jsx("i", { className: "legend-polar" }), "Partial charge"] }), _jsxs("span", { children: [_jsx("i", { className: "legend-metal" }), "Electron sea"] }), _jsxs("span", { children: [_jsx("i", { className: "legend-hbond" }), "Hydrogen bond"] }), _jsxs("span", { children: [_jsx("i", { className: "legend-shell" }), "Electron shell"] })] }) }), _jsx(CollapsibleSection, { title: "Geometry Forces", icon: null, defaultOpen: false, children: _jsx("p", { children: settings.geometryAssist ? settings.geometryMode === "rigid" ? `Rigid mode keeps the structure close to textbook VSEPR geometry with minimal thermal drift${settings.geometry3D ? ". The 3D view prioritizes ideal bond angles and central-atom geometry." : "."}` : `Flexible mode keeps VSEPR guidance active while allowing exploratory motion, spacing, and gentle distortion${settings.geometry3D ? ". The 3D view blends textbook geometry with the live simulation." : "."}` : "Geometry assist is off. Atoms still bond and collide, but VSEPR angle guidance is paused." }) })] }));
}
const quickElementSymbols = [
    "H", "C", "N", "O", "F", "Na", "Mg", "Al", "Si", "P", "S", "Cl",
    "K", "Ca", "Fe", "Cu", "Zn", "Br", "Ag", "I", "Au", "Hg", "Pb"
];
function CollapsibleSection({ icon, title, defaultOpen, children }) {
    const [open, setOpen] = useState(defaultOpen);
    return (_jsxs("div", { className: `control-section collapsible-section${open ? " expanded" : ""}`, children: [_jsxs("button", { className: "collapsible-header", onClick: () => setOpen((prev) => !prev), children: [_jsxs("span", { className: "collapsible-header-left", children: [icon, _jsx("span", { className: "control-section-title", children: title })] }), _jsx(ChevronDown, { size: 16, className: `collapsible-chevron${open ? " rotated" : ""}` })] }), open && _jsx("div", { className: "collapsible-body", children: children })] }));
}
function Slider({ label, title, value, min, max, step, onChange }) {
    return (_jsxs("label", { className: "slider", title: title, children: [_jsxs("span", { children: [label, _jsx("strong", { children: Number.isInteger(value) ? value : value.toFixed(2) })] }), _jsx("input", { type: "range", value: value, min: min, max: max, step: step, onChange: (event) => onChange(Number(event.target.value)) })] }));
}
function sceneInventory(atoms, bonds) {
    const structuralBonds = bonds.filter((bond) => bond.kind !== "hydrogen" && bond.kind !== "dispersion");
    const adjacency = new Map();
    for (const atom of atoms)
        adjacency.set(atom.id, new Set());
    for (const bond of structuralBonds) {
        adjacency.get(bond.a)?.add(bond.b);
        adjacency.get(bond.b)?.add(bond.a);
    }
    const seen = new Set();
    const components = [];
    for (const atom of atoms) {
        if (seen.has(atom.id))
            continue;
        const stack = [atom.id];
        const ids = new Set();
        seen.add(atom.id);
        while (stack.length) {
            const id = stack.pop();
            ids.add(id);
            for (const next of adjacency.get(id) ?? []) {
                if (seen.has(next))
                    continue;
                seen.add(next);
                stack.push(next);
            }
        }
        components.push(atoms.filter((item) => ids.has(item.id)));
    }
    const grouped = new Map();
    for (const component of components) {
        const ids = new Set(component.map((atom) => atom.id));
        const bondCount = structuralBonds.filter((bond) => ids.has(bond.a) && ids.has(bond.b)).length;
        const formula = formulaFromAtoms(component);
        const key = `${formula}-${component.length}-${bondCount}`;
        const existing = grouped.get(key);
        if (existing) {
            existing.quantity += 1;
        }
        else {
            grouped.set(key, {
                key,
                formula,
                quantity: 1,
                atomCount: component.length,
                bondCount,
                elements: elementSummary(component)
            });
        }
    }
    return {
        groups: [...grouped.values()].sort((a, b) => b.atomCount - a.atomCount || a.formula.localeCompare(b.formula)),
        totalAtoms: atoms.length,
        totalBonds: structuralBonds.length,
        elements: elementSummary(atoms)
    };
}
function formulaFromAtoms(atoms) {
    const counts = atoms.reduce((acc, item) => {
        acc[item.symbol] = (acc[item.symbol] ?? 0) + 1;
        return acc;
    }, {});
    return formatCounts(counts, true);
}
function elementSummary(atoms) {
    const counts = atoms.reduce((acc, item) => {
        acc[item.symbol] = (acc[item.symbol] ?? 0) + 1;
        return acc;
    }, {});
    return formatCounts(counts, false).replace(/([A-Z][a-z]?)(\d+)/g, "$1 x $2").replace(/([A-Z][a-z]?)(?=$|,)/g, "$1 x 1");
}
function formatCounts(counts, hillOrder) {
    const symbols = Object.keys(counts).sort((a, b) => {
        if (hillOrder && counts.C) {
            if (a === "C")
                return -1;
            if (b === "C")
                return 1;
            if (a === "H")
                return -1;
            if (b === "H")
                return 1;
        }
        return (atomData[a]?.atomicNumber ?? 999) - (atomData[b]?.atomicNumber ?? 999);
    });
    return symbols.map((symbol) => `${symbol}${counts[symbol] > 1 ? counts[symbol] : ""}`).join(hillOrder ? "" : ", ");
}
