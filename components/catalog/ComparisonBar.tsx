import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { Product } from "@/types/product";

interface ComparisonBarProps {
  products: Product[];
  onClear: () => void;
}

// Aparece con >=1 producto seleccionado para comparar (diseño/README.md §
// Resultados de búsqueda). Máximo 3 — lo garantiza useCompareSelection.
export function ComparisonBar({ products, onClear }: ComparisonBarProps) {
  if (products.length === 0) return null;

  return (
    <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary bg-surface-raised px-5 py-3.5 shadow-[0_12px_32px_rgba(0,0,0,.6)]">
      <p className="text-sm">
        <span className="font-heading font-bold text-text-strong">Comparar {products.length}</span>{" "}
        <span className="text-text-quiet">{products.map((p) => p.brand).filter(Boolean).join(" · ")}</span>
      </p>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="border-outline" onClick={onClear}>
          Limpiar
        </Button>
        <Button
          size="sm"
          nativeButton={false}
          render={<Link href={`/comparar?ids=${products.map((p) => p.id).join(",")}`}>Ver comparación</Link>}
        />
      </div>
    </div>
  );
}
