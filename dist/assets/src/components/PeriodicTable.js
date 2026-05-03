import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from "react";
import { atomData } from "../data/atoms.js";
import { elementDetails } from "../data/elementDetails.js";
import { periodicElements } from "../data/periodicTable.js";
const previewHoverDelayMs = 2400;
export function PeriodicTable({ selectedElements, onElementClick, defaultOpen = false }) {
    const [open, setOpen] = useState(defaultOpen);
    const [preview, setPreview] = useState(null);
    const timerRef = useRef(null);
    const beginPreview = (element) => {
        if (timerRef.current)
            window.clearTimeout(timerRef.current);
        setPreview(null);
        timerRef.current = window.setTimeout(() => setPreview(element), previewHoverDelayMs);
    };
    const endPreview = () => {
        if (timerRef.current)
            window.clearTimeout(timerRef.current);
        timerRef.current = null;
        setPreview(null);
    };
    useEffect(() => () => {
        if (timerRef.current)
            window.clearTimeout(timerRef.current);
    }, []);
    return (_jsxs("section", { className: `periodic-table-panel${open ? " expanded" : " collapsed"}`, "aria-label": "Periodic table of elements", children: [_jsxs("div", { className: "periodic-table-header", children: [_jsxs("div", { children: [_jsx("h2", { children: "Periodic Table" }), _jsx("p", { children: open ? "Click an element to add one atom. Hover to study its shells and valence electrons." : "Open the full table when you need every element." })] }), open ? (_jsxs("div", { className: "periodic-legend", "aria-label": "Element categories", children: [_jsx("span", { "data-category": "core-nonmetals", children: "Nonmetals" }), _jsx("span", { "data-category": "metalloids", children: "Metalloids" }), _jsx("span", { "data-category": "transition-metals", children: "Transition" }), _jsx("span", { "data-category": "lanthanides", children: "Lanthanides" }), _jsx("span", { "data-category": "actinides", children: "Actinides" }), _jsx("span", { "data-category": "noble-gases", children: "Noble gases" })] })) : (_jsx("span", { className: "periodic-table-count", children: "118 elements" })), _jsx("button", { className: "periodic-table-toggle", onClick: () => {
                            setOpen((current) => !current);
                            setPreview(null);
                        }, children: open ? "Collapse" : "Open table" })] }), open && _jsxs("div", { className: "periodic-table-shell", onMouseLeave: endPreview, children: [_jsx("div", { className: "periodic-grid", children: periodicElements.map((element) => {
                            const atom = atomData[element.symbol];
                            const selected = selectedElements.includes(element.symbol);
                            return (_jsxs("button", { className: `periodic-cell category-${element.category}${selected ? " selected" : ""}`, style: {
                                    "--periodic-color": atom.color,
                                    gridColumn: element.gridColumn,
                                    gridRow: element.gridRow
                                }, title: `${element.name} (${element.symbol})`, onMouseEnter: () => beginPreview(element), onFocus: () => setPreview(element), onBlur: () => setPreview(null), onClick: () => onElementClick(element.symbol), children: [_jsx("span", { className: "periodic-number", children: element.atomicNumber }), _jsx("strong", { children: element.symbol }), _jsx("span", { className: "periodic-name", children: element.name }), _jsx("span", { className: "periodic-mass", children: element.atomicMass })] }, element.symbol));
                        }) }), preview && _jsx(ElementPreview, { element: preview })] })] }));
}
function ElementPreview({ element }) {
    const atom = atomData[element.symbol];
    const detail = elementDetails[element.symbol];
    const visibleShells = element.shells.filter((count) => count > 0);
    const valenceCount = Math.max(element.valenceElectrons, 0);
    const valenceShellIndex = visibleShells.length - 1;
    const previewMaxRadius = 88;
    const previewBaseRadius = visibleShells.length > 5 ? 30 : 36;
    const previewSpacing = visibleShells.length <= 1 ? 0 : Math.min(18, (previewMaxRadius - previewBaseRadius) / (visibleShells.length - 1));
    const previewRadii = visibleShells.map((_, index) => previewBaseRadius + index * previewSpacing);
    const shellText = visibleShells.map((count, index) => `${index + 1}: ${count}`).join("  ");
    return (_jsxs("aside", { className: "element-hover-preview", "aria-live": "polite", children: [_jsxs("div", { className: "preview-atom", style: { "--atom-color": atom.color }, children: [_jsxs("div", { className: "preview-nucleus", children: [_jsx("strong", { children: element.symbol }), _jsx("span", { children: element.atomicNumber })] }), visibleShells.map((_, index) => {
                        const radius = previewRadii[index];
                        return (_jsx("span", { className: "preview-shell", style: {
                                width: radius * 2,
                                height: radius * 2,
                                "--shell-index": index
                            } }, `${element.symbol}-shell-${index}`));
                    }), Array.from({ length: valenceCount }, (_, index) => (_jsx("span", { className: "preview-electron-orbit", style: {
                            width: (previewRadii[valenceShellIndex] ?? previewBaseRadius) * 2,
                            height: (previewRadii[valenceShellIndex] ?? previewBaseRadius) * 2,
                            animationDelay: `${index * -0.62}s`,
                            animationDuration: `${4.8 + Math.min(valenceShellIndex, 4) * 0.8}s`,
                            "--start-angle": `${(360 / Math.max(valenceCount, 1)) * index}deg`
                        }, children: _jsx("i", {}) }, `${element.symbol}-electron-${index}`)))] }), _jsxs("div", { className: "preview-facts", children: [_jsxs("div", { className: "preview-title", children: [_jsx("span", { children: element.atomicNumber }), _jsxs("div", { children: [_jsx("strong", { children: element.name }), _jsx("small", { children: element.categoryLabel })] })] }), detail && _jsx("p", { className: "preview-description", children: detail.description }), _jsxs("dl", { children: [_jsxs("div", { children: [_jsx("dt", { children: "Mass" }), _jsx("dd", { children: element.atomicMass })] }), _jsxs("div", { children: [_jsx("dt", { children: "Period / Group" }), _jsxs("dd", { children: [element.period, " / ", element.group || "series"] })] }), _jsxs("div", { children: [_jsx("dt", { children: "State" }), _jsx("dd", { children: element.standardState || "Unknown" })] }), _jsxs("div", { children: [_jsx("dt", { children: "Electronegativity" }), _jsx("dd", { children: element.electronegativity ?? "N/A" })] }), _jsxs("div", { children: [_jsx("dt", { children: "Atomic radius" }), _jsx("dd", { children: formatValue(element.atomicRadius, "pm") })] }), _jsxs("div", { children: [_jsx("dt", { children: "Ionization" }), _jsx("dd", { children: formatValue(element.ionizationEnergy, "eV") })] }), _jsxs("div", { children: [_jsx("dt", { children: "Electron affinity" }), _jsx("dd", { children: formatValue(element.electronAffinity, "eV") })] }), _jsxs("div", { children: [_jsx("dt", { children: "Density" }), _jsx("dd", { children: formatValue(element.density, "g/cm3") })] }), _jsxs("div", { children: [_jsx("dt", { children: "Melting point" }), _jsx("dd", { children: formatValue(element.meltingPoint, "K") })] }), _jsxs("div", { children: [_jsx("dt", { children: "Boiling point" }), _jsx("dd", { children: formatValue(element.boilingPoint, "K") })] }), _jsxs("div", { children: [_jsx("dt", { children: "Valence e-" }), _jsx("dd", { children: element.valenceElectrons })] }), _jsxs("div", { children: [_jsx("dt", { children: "Shells" }), _jsx("dd", { children: shellText })] }), _jsxs("div", { children: [_jsx("dt", { children: "Configuration" }), _jsx("dd", { children: element.electronConfiguration })] }), _jsxs("div", { children: [_jsx("dt", { children: "Oxidation" }), _jsx("dd", { children: element.oxidationStates || "N/A" })] }), _jsxs("div", { children: [_jsx("dt", { children: "Discovered" }), _jsx("dd", { children: detail?.discoveryYear || element.yearDiscovered || "Unknown" })] }), _jsxs("div", { children: [_jsx("dt", { children: "Discoverer" }), _jsx("dd", { children: detail?.discoveredBy || "Unknown" })] })] })] })] }));
}
function formatValue(value, unit) {
    return value === null ? "N/A" : `${value} ${unit}`;
}
