"use client";

import { Suspense, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useProducts } from "@/hooks/useProducts";
import { useSemanticSearch } from "@/hooks/useSemanticSearch";
import { useBrandCounts } from "@/hooks/useBrandCounts";
import { useCompareSelection } from "@/hooks/useCompareSelection";
import { useCart } from "@/hooks/useCart";
import { ProductGrid } from "@/components/catalog/ProductGrid";
import { FiltersPanel } from "@/components/catalog/FiltersPanel";
import { FiltersSidebar } from "@/components/catalog/FiltersSidebar";
import { ComparisonBar } from "@/components/catalog/ComparisonBar";
import { Pagination } from "@/components/catalog/Pagination";
import { Container } from "@/components/shared/Container";
import { LoadingState } from "@/components/shared/LoadingState";
import { EmptyState } from "@/components/shared/EmptyState";
import { cn, getErrorMessage } from "@/lib/utils";
import { CATALOG_PAGE_SIZE, DEFAULT_SORT, PRICE_FILTER_MAX, type SortOption } from "@/lib/constants/catalog";
import type { ProductCondition } from "@/lib/constants/roles";

type SearchTab = "exact" | "ai";

const TABS: { value: SearchTab; label: string }[] = [
  { value: "exact", label: "Coincidencia exacta" },
  { value: "ai", label: "Resultados con IA" },
];

function SearchContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, initializing } = useAuth();
  const [tab, setTab] = useState<SearchTab>("exact");
  const brandOptions = useBrandCounts();
  const compare = useCompareSelection();
  const { add: addToCart } = useCart(user?.id);

  const q = searchParams.get("q") || "";
  const sort = (searchParams.get("sort") as SortOption) || DEFAULT_SORT;
  const page = Number(searchParams.get("page") ?? "1");
  const maxPrice = Number(searchParams.get("maxPrice") ?? PRICE_FILTER_MAX);
  const condition = (searchParams.get("condition") as ProductCondition | null) ?? undefined;
  const selectedBrands = searchParams.get("brands")?.split(",").filter(Boolean) ?? [];

  // Búsqueda por ilike sobre title y brand (sesión 3) — sigue igual para
  // anónimos; sidebar de marca/precio/condición es lo nuevo de esta fase.
  const { items, total, loading, error, reload } = useProducts({
    search: q,
    sort,
    page,
    maxPrice: maxPrice < PRICE_FILTER_MAX ? maxPrice : undefined,
    condition,
    brands: selectedBrands.length > 0 ? selectedBrands : undefined,
  });
  const totalPages = Math.max(1, Math.ceil(total / CATALOG_PAGE_SIZE));
  const compareProducts = items.filter((product) => compare.ids.includes(product.id));

  // Solo busca con la pestaña IA activa y sesión iniciada: evita gastar
  // cuota de Hugging Face en cada carga de /buscar.
  const { results: aiResults, loading: aiLoading, error: aiError } = useSemanticSearch(q, tab === "ai" && !!user);
  const similarityById = Object.fromEntries(aiResults.map((r) => [r.id, r.similarity]));

  function updateParams(next: {
    sort?: SortOption;
    page?: number;
    maxPrice?: number;
    condition?: ProductCondition;
    brands?: string[];
  }) {
    const params = new URLSearchParams(searchParams.toString());
    if (next.sort !== undefined) {
      params.set("sort", next.sort);
      params.delete("page");
    }
    if (next.page !== undefined) {
      params.set("page", String(next.page));
    }
    if (next.maxPrice !== undefined) {
      params.set("maxPrice", String(next.maxPrice));
      params.delete("page");
    }
    if ("condition" in next) {
      if (next.condition) params.set("condition", next.condition);
      else params.delete("condition");
      params.delete("page");
    }
    if (next.brands !== undefined) {
      if (next.brands.length > 0) params.set("brands", next.brands.join(","));
      else params.delete("brands");
      params.delete("page");
    }
    router.push(`/buscar?${params.toString()}`);
  }

  function goToLogin() {
    const redirectTo = `${pathname}?${searchParams.toString()}`;
    router.push(`/login?redirectTo=${encodeURIComponent(redirectTo)}`);
  }

  async function handleAddToCart(productId: string) {
    if (!user) {
      goToLogin();
      return;
    }
    try {
      await addToCart(productId);
      toast.success("Agregado al carrito");
    } catch (err) {
      toast.error(getErrorMessage(err, "No se pudo agregar al carrito."));
    }
  }

  return (
    <Container className="space-y-6 py-8">
      <h1 className="text-2xl font-bold">{q ? `Resultados para "${q}"` : "Buscar productos"}</h1>

      {/* Botones simples (no el Tabs de Base UI): montar Tabs.Panel junto al
          Select de FiltersPanel deja la página colgada en el Suspense de
          este layout — problema de la librería, no del flujo de datos. */}
      <div role="tablist" aria-label="Modo de búsqueda" className="inline-flex h-8 w-fit gap-1 rounded-lg bg-muted p-[3px] text-muted-foreground">
        {TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            role="tab"
            aria-selected={tab === t.value}
            onClick={() => setTab(t.value)}
            className={cn(
              "rounded-md px-2.5 py-1 text-sm font-medium whitespace-nowrap transition-all",
              tab === t.value ? "bg-background text-foreground shadow-sm" : "hover:text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "exact" ? (
        <div className="flex flex-col gap-5 sm:flex-row">
          <FiltersSidebar
            brands={brandOptions}
            selectedBrands={selectedBrands}
            onBrandsChange={(brands) => updateParams({ brands })}
            maxPrice={maxPrice}
            onMaxPriceChange={(value) => updateParams({ maxPrice: value })}
            condition={condition}
            onConditionChange={(value) => updateParams({ condition: value })}
          />
          <div className="min-w-0 flex-1 space-y-6">
            <FiltersPanel sort={sort} onSortChange={(s) => updateParams({ sort: s })} resultCount={total} />
            <ProductGrid
              products={items}
              loading={loading}
              error={error}
              onRetry={reload}
              emptyTitle="Sin resultados"
              emptyDescription="Intenta con otras palabras clave."
              compareIds={compare.ids}
              onCompareChange={(id) => compare.toggle(id)}
              onAddToCart={handleAddToCart}
            />
            <Pagination page={page} totalPages={totalPages} onPageChange={(p) => updateParams({ page: p })} />
            <ComparisonBar products={compareProducts} onClear={compare.clear} />
          </div>
        </div>
      ) : (
        <div>
          {!initializing && !user ? (
            <EmptyState
              title="Inicia sesión para usar la búsqueda inteligente"
              description="Con tu cuenta puedes describir lo que necesitas en vez de adivinar palabras exactas."
              actionLabel="Iniciar sesión"
              onAction={goToLogin}
            />
          ) : !q.trim() ? (
            <EmptyState
              title="Escribe qué necesitas"
              description='Prueba describir para qué lo necesitas, por ejemplo: "audífonos para el gimnasio".'
            />
          ) : (
            <ProductGrid
              products={aiResults}
              loading={aiLoading || initializing}
              error={aiError}
              similarityById={similarityById}
              emptyTitle="Sin resultados"
              emptyDescription="Prueba describir para qué lo necesitas con otras palabras."
            />
          )}
        </div>
      )}
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
