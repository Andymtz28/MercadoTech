"use client";

import { Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useProducts } from "@/hooks/useProducts";
import { ProductGrid } from "@/components/catalog/ProductGrid";
import { FiltersPanel } from "@/components/catalog/FiltersPanel";
import { Pagination } from "@/components/catalog/Pagination";
import { Container } from "@/components/shared/Container";
import { LoadingState } from "@/components/shared/LoadingState";
import { CATALOG_PAGE_SIZE, DEFAULT_SORT, type SortOption } from "@/lib/constants/catalog";

function CategoryContent() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const sort = (searchParams.get("sort") as SortOption) || DEFAULT_SORT;
  const page = Number(searchParams.get("page") ?? "1");

  const { items, total, loading, error, reload } = useProducts({ categorySlug: slug, sort, page });
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
    router.push(`/categoria/${slug}?${params.toString()}`);
  }

  return (
    <Container className="space-y-6 py-8">
      <h1 className="text-2xl font-bold capitalize">{slug.replace(/-/g, " ")}</h1>
      <FiltersPanel sort={sort} onSortChange={(s) => updateParams({ sort: s })} resultCount={total} />
      <ProductGrid
        products={items}
        loading={loading}
        error={error}
        onRetry={reload}
        emptyTitle="Sin productos en esta categoría"
        emptyDescription="Vuelve pronto, los vendedores agregan productos todo el tiempo."
      />
      <Pagination page={page} totalPages={totalPages} onPageChange={(p) => updateParams({ page: p })} />
    </Container>
  );
}

export default function CategoryPage() {
  return (
    <Suspense fallback={<LoadingState message="Cargando categoría…" />}>
      <CategoryContent />
    </Suspense>
  );
}
