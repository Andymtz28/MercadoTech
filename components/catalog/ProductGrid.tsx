import { Skeleton } from "@/components/ui/skeleton";
import { ProductCard } from "@/components/catalog/ProductCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { CATALOG_PAGE_SIZE } from "@/lib/constants/catalog";
import type { Product } from "@/types/product";

interface ProductGridProps {
  products: Product[];
  loading: boolean;
  error?: string | null;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyActionLabel?: string;
  onEmptyAction?: () => void;
  // Producto -> similitud (0-1): solo la pestaña "Resultados con IA" lo pasa.
  similarityById?: Record<string, number>;
  // Comparador + agregar al carrito: solo Resultados los pasa.
  compareIds?: string[];
  onCompareChange?: (productId: string, checked: boolean) => void;
  onAddToCart?: (productId: string) => void;
  // La sección "Bajaron de precio" del Home la pasa en true: su primera
  // tarjeta es el LCP de la página (Fase 7.2, medido en docs/PERFORMANCE.md).
  prioritizeFirst?: boolean;
}

export function ProductGrid({
  products,
  loading,
  error,
  onRetry,
  emptyTitle = "No encontramos productos",
  emptyDescription = "Prueba con otros filtros o vuelve más tarde.",
  emptyActionLabel,
  onEmptyAction,
  similarityById,
  compareIds,
  onCompareChange,
  onAddToCart,
  prioritizeFirst = false,
}: ProductGridProps) {
  if (error) {
    return <ErrorState message={error} onRetry={onRetry} />;
  }

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: CATALOG_PAGE_SIZE }, (_, i) => (
          <Skeleton key={i} className="aspect-square w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        actionLabel={emptyActionLabel}
        onAction={onEmptyAction}
      />
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((product, index) => (
        <ProductCard
          key={product.id}
          product={product}
          similarity={similarityById?.[product.id]}
          compareChecked={compareIds?.includes(product.id)}
          onCompareChange={onCompareChange ? (checked) => onCompareChange(product.id, checked) : undefined}
          onAddToCart={onAddToCart ? () => onAddToCart(product.id) : undefined}
          priority={prioritizeFirst && index === 0}
        />
      ))}
    </div>
  );
}
