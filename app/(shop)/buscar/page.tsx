"use client";

import { Suspense, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useProducts } from "@/hooks/useProducts";
import { useSemanticSearch } from "@/hooks/useSemanticSearch";
import { ProductGrid } from "@/components/catalog/ProductGrid";
import { FiltersPanel } from "@/components/catalog/FiltersPanel";
import { Pagination } from "@/components/catalog/Pagination";
import { Container } from "@/components/shared/Container";
import { LoadingState } from "@/components/shared/LoadingState";
import { EmptyState } from "@/components/shared/EmptyState";
import { cn } from "@/lib/utils";
import { CATALOG_PAGE_SIZE, DEFAULT_SORT, type SortOption } from "@/lib/constants/catalog";

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

  const q = searchParams.get("q") || "";
  const sort = (searchParams.get("sort") as SortOption) || DEFAULT_SORT;
  const page = Number(searchParams.get("page") ?? "1");

  // Búsqueda por ilike sobre title y brand (sesión 3) — sigue igual para
  // anónimos; la pestaña IA es lo nuevo de esta fase.
  const { items, total, loading, error, reload } = useProducts({ search: q, sort, page });
  const totalPages = Math.max(1, Math.ceil(total / CATALOG_PAGE_SIZE));

  // Solo busca con la pestaña IA activa y sesión iniciada: evita gastar
  // cuota de Hugging Face en cada carga de /buscar.
  const { results: aiResults, loading: aiLoading, error: aiError } = useSemanticSearch(q, tab === "ai" && !!user);
  const similarityById = Object.fromEntries(aiResults.map((r) => [r.id, r.similarity]));

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

  function goToLogin() {
    const redirectTo = `${pathname}?${searchParams.toString()}`;
    router.push(`/login?redirectTo=${encodeURIComponent(redirectTo)}`);
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
        <div className="space-y-6">
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
