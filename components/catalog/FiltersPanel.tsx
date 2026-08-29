import { ChevronDown } from "lucide-react";
import { SORT_OPTIONS, type SortOption } from "@/lib/constants/catalog";

interface FiltersPanelProps {
  sort: SortOption;
  onSortChange: (sort: SortOption) => void;
  resultCount?: number;
}

// Select nativo (no el de Base UI): combinado con el layout de dos
// columnas de Resultados, el Select de Base UI deja la página colgada en
// el Suspense de este layout — problema de la librería, no del filtro.
export function FiltersPanel({ sort, onSortChange, resultCount }: FiltersPanelProps) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-[11px]">
      {typeof resultCount === "number" && (
        <p className="text-sm">
          <span className="font-heading font-bold text-text-strong">{resultCount}</span>{" "}
          <span className="text-text-quiet">{resultCount === 1 ? "producto" : "productos"}</span>
        </p>
      )}
      <div className="relative ml-auto">
        <select
          aria-label="Ordenar productos"
          value={sort}
          onChange={(e) => onSortChange(e.target.value as SortOption)}
          className="w-56 appearance-none rounded-lg border border-border-strong bg-surface-input py-1.5 pr-8 pl-3 text-sm text-text-secondary outline-none focus-visible:border-primary"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-text-quiet" />
      </div>
    </div>
  );
}
