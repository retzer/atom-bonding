import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { ChevronDown, Search } from "lucide-react";
import { atomData } from "../data/atoms";
import { periodicElements } from "../data/periodicTable";
import type { AtomSymbol } from "../types";

type Props = {
  selectedElements: AtomSymbol[];
  onElementClick: (symbol: AtomSymbol) => void;
};

export function ChemLabElementPicker({ selectedElements, onElementClick }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement | null>(null);
  const selected = selectedElements[0] ?? "C";

  const matches = useMemo(() => {
    const term = normalize(query);
    if (!term) return periodicElements;
    return periodicElements.filter((element) => {
      const atom = atomData[element.symbol];
      return [element.symbol, element.name, atom.group, element.categoryLabel]
        .some((value) => normalize(String(value)).includes(term));
    });
  }, [query]);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target instanceof Node ? event.target : null;
      if (target && rootRef.current?.contains(target)) return;
      setOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const chooseElement = (symbol: AtomSymbol) => {
    onElementClick(symbol);
    setOpen(false);
    setQuery("");
  };

  return (
    <div className="chem-element-picker" ref={rootRef}>
      <button
        type="button"
        className="chem-element-picker-trigger"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((current) => !current)}
      >
        <span className="chem-element-badge">{selected}</span>
        <span>Elements</span>
        <ChevronDown size={15} />
      </button>
      {open && (
        <div className="chem-element-dropdown" role="dialog" aria-label="Compact periodic table">
          <label className="chem-element-search">
            <Search size={15} />
            <input
              value={query}
              placeholder="Search element..."
              autoFocus
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <div className={`chem-mini-periodic ${query.trim() ? "searching" : ""}`}>
            {matches.map((element) => {
              const atom = atomData[element.symbol];
              const isSelected = selectedElements.includes(element.symbol);
              return (
                <button
                  key={element.symbol}
                  type="button"
                  className={`chem-mini-element category-${element.category}${isSelected ? " selected" : ""}`}
                  style={{
                    "--periodic-color": atom.color,
                    gridColumn: query.trim() ? undefined : element.gridColumn,
                    gridRow: query.trim() ? undefined : element.gridRow
                  } as CSSProperties}
                  title={`${element.name} (${element.symbol}) - add atom`}
                  onClick={() => chooseElement(element.symbol)}
                >
                  <span>{element.atomicNumber}</span>
                  <strong>{element.symbol}</strong>
                  <small>{element.name}</small>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function normalize(value: string) {
  return value.toLocaleLowerCase().replace(/[^a-z0-9]+/g, "");
}
