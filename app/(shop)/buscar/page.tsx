import { EmptyState } from "@/components/shared/EmptyState";

export default async function SearchPage({ searchParams }: PageProps<"/buscar">) {
  const { q } = await searchParams;
  return (
    <EmptyState
      title="Próximamente (Fase 3.4)"
      description={q ? `Resultados para "${q}".` : "Búsqueda de productos."}
    />
  );
}
