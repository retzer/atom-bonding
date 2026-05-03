import { jsx as _jsx } from "react/jsx-runtime";
import { Suspense, lazy } from "react";
const Molecule3DViewLazy = lazy(() => import("./Molecule3DView").then((mod) => ({ default: mod.Molecule3DView })));
export function Safe3DView(props) {
    return (_jsx(Suspense, { fallback: _jsx("div", { className: "simulation-wrap molecule-3d-wrap", style: { display: "grid", placeItems: "center" }, children: _jsx("span", { style: { color: "#a7b2ad" }, children: "Loading 3D view..." }) }), children: _jsx(Molecule3DViewLazy, { ...props }) }));
}
