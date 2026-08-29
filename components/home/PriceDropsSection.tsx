import { ProductGrid } from "@/components/catalog/ProductGrid";
import type { Product } from "@/types/product";

interface PriceDropsSectionProps {
  products: Product[];
  loading: boolean;
}

export function PriceDropsSection({ products, loading }: PriceDropsSectionProps) {
  if (!loading && products.length === 0) return null;

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-lg font-bold text-text-strong">Bajaron de precio esta semana</h2>
        <p className="text-xs text-text-faint">Seguimiento de 90 días</p>
      </div>
      <ProductGrid products={products} loading={loading} />
    </section>
  );
}
