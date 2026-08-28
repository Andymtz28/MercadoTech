"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useProducts } from "@/hooks/useProducts";
import { ProductGrid } from "@/components/catalog/ProductGrid";
import { FiltersPanel } from "@/components/catalog/FiltersPanel";
import { Pagination } from "@/components/catalog/Pagination";
import { Container } from "@/components/shared/Container";
import { LoadingState } from "@/components/shared/LoadingState";
import { CATALOG_PAGE_SIZE, DEFAULT_SORT, type SortOption } from "@/lib/constants/catalog";

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const q = searchParams.get("q") || "";
  const sort = (searchParams.get("sort") as SortOption) || DEFAULT_SORT;
  const page = Number(searchParams.get("page") ?? "1");

  // Búsqueda por ilike sobre title y brand — provisional hasta la búsqueda
  // semántica de la sesión 4.
  const { items, total, loading, error, reload } = useProducts({ search: q, sort, page });
  const totalPages = Math.max(1, Math.ceil(total / CATALOG_PAGE_SIZE));

  function updateParams(next: { sort?: SortOption; page?: number }) {
    const params = new URLSearchParams(searchParams.toString());
    if (next.sort !== undefined) {
      params.set("sort", next.sort);
      params.delete("page");
    }
    if (next.page !== undefined) {
      params.set("page", String(next.page));
    }
    router.push(`/buscar?${params.toString()}`);
  }

  return (
    <Container className="space-y-6 py-8">
      <h1 className="text-2xl font-bold">{q ? `Resultados para "${q}"` : "Buscar productos"}</h1>
      <FiltersPanel sort={sort} onSortChange={(s) => updateParams({ sort: s })} resultCount={total} />
      <ProductGrid
        products={items}
        loading={loading}
        error={error}
        onRetry={reload}
        emptyTitle="Sin resultados"
        emptyDescription="Intenta con otras palabras clave."
      />
      <Pagination page={page} totalPages={totalPages} onPageChange={(p) => updateParams({ page: p })} />
    </Container>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<LoadingState message="Buscando…" />}>
      <SearchContent />
    </Suspense>
  );
}
