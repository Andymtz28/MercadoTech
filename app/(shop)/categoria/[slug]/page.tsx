import { EmptyState } from "@/components/shared/EmptyState";

export default async function CategoryPage({ params }: PageProps<"/categoria/[slug]">) {
  const { slug } = await params;
  return (
    <EmptyState
      title="Próximamente (Fase 3.4)"
      description={`Productos de la categoría "${slug}".`}
    />
  );
}
