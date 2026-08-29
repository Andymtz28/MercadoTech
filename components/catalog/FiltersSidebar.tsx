import { formatPrice } from "@/lib/utils";
import { PRICE_FILTER_MAX, PRICE_FILTER_MIN, PRICE_FILTER_STEP } from "@/lib/constants/catalog";
import type { BrandCount } from "@/services/product.service";
import type { ProductCondition } from "@/lib/constants/roles";

interface FiltersSidebarProps {
  brands: BrandCount[];
  selectedBrands: string[];
  onBrandsChange: (brands: string[]) => void;
  maxPrice: number;
  onMaxPriceChange: (value: number) => void;
  condition: ProductCondition | undefined;
  onConditionChange: (condition: ProductCondition | undefined) => void;
}

// "Todas"/"Usado" no están en el mockup (su catálogo de ejemplo no incluye
// usados), pero el esquema real sí tiene esa condición — se agrega para no
// dejar productos reales sin forma de filtrarlos.
const CONDITIONS: { value: ProductCondition | ""; label: string }[] = [
  { value: "", label: "Todas" },
  { value: "nuevo", label: "Nuevo" },
  { value: "usado", label: "Usado" },
  { value: "reacondicionado", label: "Reacond." },
];

export function FiltersSidebar({
  brands,
  selectedBrands,
  onBrandsChange,
  maxPrice,
  onMaxPriceChange,
  condition,
  onConditionChange,
}: FiltersSidebarProps) {
  function toggleBrand(brand: string) {
    onBrandsChange(selectedBrands.includes(brand) ? selectedBrands.filter((b) => b !== brand) : [...selectedBrands, brand]);
  }

  return (
    <aside className="w-full shrink-0 space-y-5 rounded-2xl border border-border bg-card p-4 sm:sticky sm:top-[84px] sm:w-[248px]">
      {brands.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold tracking-wide text-text-secondary uppercase">Marca</p>
          <div className="space-y-1.5">
            {brands.map(({ brand, count }) => (
              <label key={brand} className="flex cursor-pointer items-center justify-between gap-2 text-sm">
                <span className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedBrands.includes(brand)}
                    onChange={() => toggleBrand(brand)}
                    className="size-[15px] accent-primary"
                  />
                  <span className="text-text-secondary">{brand}</span>
                </span>
                <span className="text-xs text-text-dim">{count}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2 border-t border-divider pt-4">
        <p className="text-xs font-semibold tracking-wide text-text-secondary uppercase">Precio máximo</p>
        <input
          type="range"
          min={PRICE_FILTER_MIN}
          max={PRICE_FILTER_MAX}
          step={PRICE_FILTER_STEP}
          value={maxPrice}
          onChange={(e) => onMaxPriceChange(Number(e.target.value))}
          className="w-full accent-primary"
        />
        <p className="font-heading text-sm font-bold text-text-strong">Hasta {formatPrice(maxPrice)}</p>
      </div>

      <div className="space-y-2 border-t border-divider pt-4">
        <label htmlFor="filter-condition" className="text-xs font-semibold tracking-wide text-text-secondary uppercase">
          Condición
        </label>
        <select
          id="filter-condition"
          value={condition ?? ""}
          onChange={(e) => onConditionChange(e.target.value ? (e.target.value as ProductCondition) : undefined)}
          className="w-full rounded-lg border border-border-strong bg-surface-input px-2.5 py-1.5 text-sm text-text-secondary outline-none focus-visible:border-primary"
        >
          {CONDITIONS.map((option) => (
            <option key={option.label} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </aside>
  );
}
