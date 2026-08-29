import Link from "next/link";
import type { Product } from "@/types/product";

interface ReviewsPanelProps {
  products: Product[];
}

// El diseño usa un "banco de pruebas editorial" (dato de ejemplo); el
// esquema real solo tiene reseñas de compradores, así que la copia se
// ajusta a "reseñas" en vez de inventar un puntaje editorial que no existe.
export function ReviewsPanel({ products }: ReviewsPanelProps) {
  if (products.length === 0) return null;

  return (
    <section className="rounded-2xl border border-border bg-card p-6">
      <h2 className="mb-4 text-lg font-bold text-text-strong">Mejor calificados</h2>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        {products.map((product) => (
          <Link
            key={product.id}
            href={`/producto/${product.id}`}
            className="border-l-2 border-border-strong pl-4 hover:border-primary"
          >
            <p className="font-heading text-xl font-extrabold text-primary">
              {((product.average_rating ?? 0) * 2).toFixed(1)} <span className="text-xs font-normal text-text-quiet">de 10</span>
            </p>
            <p className="mt-1 line-clamp-1 text-sm font-medium text-text-muted">{product.title}</p>
            <p className="text-xs text-text-faint">
              {product.review_count} {product.review_count === 1 ? "reseña" : "reseñas"}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
