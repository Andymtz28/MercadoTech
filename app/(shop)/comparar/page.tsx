"use client";

import { Fragment, Suspense, useEffect, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { getProductById } from "@/services/product.service";
import { ProductImage } from "@/components/shared/ProductImage";
import { ConditionBadge } from "@/components/shared/ConditionBadge";
import { Price } from "@/components/shared/Price";
import { Container } from "@/components/shared/Container";
import { LoadingState } from "@/components/shared/LoadingState";
import { EmptyState } from "@/components/shared/EmptyState";
import type { ProductWithImages } from "@/types/product";

// El diseño compara 7 claves normalizadas (Procesador, RAM, Almacenamiento,
// Pantalla, Batería, Peso, Puertos) que exigen ficha técnica por categoría
// — el esquema actual todavía no la tiene. Mientras tanto se comparan los
// campos reales disponibles.
const ROWS: { label: string; render: (product: ProductWithImages) => ReactNode }[] = [
  { label: "Marca", render: (p) => p.brand ?? "—" },
  { label: "Condición", render: (p) => <ConditionBadge condition={p.condition} /> },
  { label: "Stock", render: (p) => `${p.stock} disponibles` },
  {
    label: "Calificación",
    render: (p) => (p.review_count > 0 ? `★ ${p.average_rating?.toFixed(1)} · ${p.review_count} opiniones` : "Sin reseñas"),
  },
];

function CompareContent() {
  const searchParams = useSearchParams();
  const ids = searchParams.get("ids")?.split(",").filter(Boolean).slice(0, 3) ?? [];
  const [products, setProducts] = useState<ProductWithImages[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (ids.length === 0) {
      setProducts([]);
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    Promise.all(ids.map((id) => getProductById(id))).then((results) => {
      if (active) {
        setProducts(results.filter((p): p is ProductWithImages => p !== null));
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids.join(",")]);

  if (loading) return <LoadingState message="Cargando comparador…" />;

  if (products.length === 0) {
    return (
      <EmptyState
        title="No hay productos para comparar"
        description="Selecciona hasta 3 productos en los resultados de búsqueda con la casilla “Comparar”."
      />
    );
  }

  return (
    <Container className="space-y-6 py-8">
      <h1 className="text-2xl font-bold">Comparador técnico</h1>
      <div className="overflow-x-auto rounded-2xl border border-border bg-card p-5">
        <div className="grid min-w-[600px] gap-4" style={{ gridTemplateColumns: `150px repeat(${products.length}, 1fr)` }}>
          <div />
          {products.map((product) => (
            <div key={product.id} className="space-y-2 text-center">
              <div className="relative mx-auto aspect-square w-[110px] overflow-hidden rounded-lg bg-muted">
                <ProductImage src={product.image_url} alt={product.title} sizes="110px" />
              </div>
              <p className="line-clamp-2 min-h-[2.5em] text-[13.5px] font-medium">{product.title}</p>
              <Price value={product.price} className="text-lg text-primary" />
            </div>
          ))}

          {ROWS.map((row) => (
            <Fragment key={row.label}>
              <div className="flex items-center border-b border-divider-quiet py-2.5 text-sm text-text-faint">{row.label}</div>
              {products.map((product) => (
                <div
                  key={`${row.label}-${product.id}`}
                  className="flex items-center justify-center border-b border-divider-quiet py-2.5 text-sm font-medium text-text-muted"
                >
                  {row.render(product)}
                </div>
              ))}
            </Fragment>
          ))}
        </div>
      </div>
    </Container>
  );
}

export default function ComparePage() {
  return (
    <Suspense fallback={<LoadingState message="Cargando comparador…" />}>
      <CompareContent />
    </Suspense>
  );
}
