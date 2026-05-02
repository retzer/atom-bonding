import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { atomData } from "../data/atoms";
import { periodicElements, type PeriodicElementInfo } from "../data/periodicTable";
import type { AtomSymbol } from "../types";

type Props = {
  selectedElements: AtomSymbol[];
  onElementClick: (symbol: AtomSymbol) => void;
  defaultOpen?: boolean;
};

export function PeriodicTable({ selectedElements, onElementClick, defaultOpen = false }: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const [preview, setPreview] = useState<PeriodicElementInfo | null>(null);
  const timerRef = useRef<number | null>(null);

  const beginPreview = (element: PeriodicElementInfo) => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setPreview(element), 900);
  };

  const endPreview = () => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = null;
    setPreview(null);
  };

  useEffect(() => () => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
  }, []);

  return (
    <section className={`periodic-table-panel${open ? " expanded" : " collapsed"}`} aria-label="Periodic table of elements">
      <div className="periodic-table-header">
        <div>
          <h2>Periodic Table</h2>
          <p>{open ? "Click an element to add one atom. Hover to study its shells and valence electrons." : "Open the full table when you need every element."}</p>
        </div>
        {open ? (
          <div className="periodic-legend" aria-label="Element categories">
            <span data-category="core-nonmetals">Nonmetals</span>
            <span data-category="metalloids">Metalloids</span>
            <span data-category="transition-metals">Transition</span>
            <span data-category="lanthanides">Lanthanides</span>
            <span data-category="actinides">Actinides</span>
            <span data-category="noble-gases">Noble gases</span>
          </div>
        ) : (
          <span className="periodic-table-count">118 elements</span>
        )}
        <button className="periodic-table-toggle" onClick={() => {
          setOpen((current) => !current);
          setPreview(null);
        }}>
          {open ? "Collapse" : "Open table"}
        </button>
      </div>
      {open && <div className="periodic-table-shell">
        <div className="periodic-grid" onMouseLeave={endPreview}>
          {periodicElements.map((element) => {
            const atom = atomData[element.symbol];
            const selected = selectedElements.includes(element.symbol);
            return (
              <button
                key={element.symbol}
                className={`periodic-cell category-${element.category}${selected ? " selected" : ""}`}
                style={{
                  "--periodic-color": atom.color,
                  gridColumn: element.gridColumn,
                  gridRow: element.gridRow
                } as CSSProperties}
                title={`${element.name} (${element.symbol})`}
                onMouseEnter={() => beginPreview(element)}
                onFocus={() => setPreview(element)}
                onBlur={() => setPreview(null)}
                onClick={() => onElementClick(element.symbol)}
              >
                <span className="periodic-number">{element.atomicNumber}</span>
                <strong>{element.symbol}</strong>
                <span className="periodic-name">{element.name}</span>
                <span className="periodic-mass">{element.atomicMass}</span>
              </button>
            );
          })}
        </div>
        {preview && <ElementPreview element={preview} />}
      </div>}
    </section>
  );
}

function ElementPreview({ element }: { element: PeriodicElementInfo }) {
  const atom = atomData[element.symbol];
  const visibleShells = element.shells.filter((count) => count > 0);
  const valenceCount = Math.max(element.valenceElectrons, 0);
  const valenceShellIndex = visibleShells.length - 1;
  const shellText = visibleShells.map((count, index) => `${index + 1}: ${count}`).join("  ");

  return (
    <aside className="element-hover-preview" aria-live="polite">
      <div className="preview-atom" style={{ "--atom-color": atom.color } as CSSProperties}>
        <div className="preview-nucleus">
          <strong>{element.symbol}</strong>
          <span>{element.atomicNumber}</span>
        </div>
        {visibleShells.map((_, index) => {
          const radius = 44 + index * 22;
          return (
            <span
              key={`${element.symbol}-shell-${index}`}
              className="preview-shell"
              style={{
                width: radius * 2,
                height: radius * 2,
                "--shell-index": index
              } as CSSProperties}
            />
          );
        })}
        {Array.from({ length: valenceCount }, (_, index) => (
          <span
            key={`${element.symbol}-electron-${index}`}
            className="preview-electron-orbit"
            style={{
              width: (44 + valenceShellIndex * 22) * 2,
              height: (44 + valenceShellIndex * 22) * 2,
              animationDelay: `${index * -0.62}s`,
              animationDuration: `${4.8 + Math.min(valenceShellIndex, 4) * 0.8}s`,
              "--start-angle": `${(360 / Math.max(valenceCount, 1)) * index}deg`
            } as CSSProperties}
          >
            <i />
          </span>
        ))}
      </div>
      <div className="preview-facts">
        <div className="preview-title">
          <span>{element.atomicNumber}</span>
          <div>
            <strong>{element.name}</strong>
            <small>{element.categoryLabel}</small>
          </div>
        </div>
        <dl>
          <div><dt>Mass</dt><dd>{element.atomicMass}</dd></div>
          <div><dt>Period / Group</dt><dd>{element.period} / {element.group || "series"}</dd></div>
          <div><dt>State</dt><dd>{element.standardState || "Unknown"}</dd></div>
          <div><dt>Electronegativity</dt><dd>{element.electronegativity ?? "N/A"}</dd></div>
          <div><dt>Atomic radius</dt><dd>{formatValue(element.atomicRadius, "pm")}</dd></div>
          <div><dt>Ionization</dt><dd>{formatValue(element.ionizationEnergy, "eV")}</dd></div>
          <div><dt>Electron affinity</dt><dd>{formatValue(element.electronAffinity, "eV")}</dd></div>
          <div><dt>Density</dt><dd>{formatValue(element.density, "g/cm3")}</dd></div>
          <div><dt>Melting point</dt><dd>{formatValue(element.meltingPoint, "K")}</dd></div>
          <div><dt>Boiling point</dt><dd>{formatValue(element.boilingPoint, "K")}</dd></div>
          <div><dt>Valence e-</dt><dd>{element.valenceElectrons}</dd></div>
          <div><dt>Shells</dt><dd>{shellText}</dd></div>
          <div><dt>Configuration</dt><dd>{element.electronConfiguration}</dd></div>
          <div><dt>Oxidation</dt><dd>{element.oxidationStates || "N/A"}</dd></div>
          <div><dt>Discovered</dt><dd>{element.yearDiscovered || "Unknown"}</dd></div>
        </dl>
      </div>
    </aside>
  );
}

function formatValue(value: number | null, unit: string) {
  return value === null ? "N/A" : `${value} ${unit}`;
}
