import { Suspense, lazy } from "react";

const Molecule3DViewLazy = lazy(() => import("./Molecule3DView").then((mod) => ({ default: mod.Molecule3DView })));

export function Safe3DView(props: any) {
  return (
    <Suspense fallback={
      <div className="simulation-wrap molecule-3d-wrap" style={{ display: "grid", placeItems: "center" }}>
        <span style={{ color: "#a7b2ad" }}>Loading 3D view...</span>
      </div>
    }>
      <Molecule3DViewLazy {...props} />
    </Suspense>
  );
}
