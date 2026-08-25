import { EmptyState } from "@/components/shared/EmptyState";

export default async function ProductDetailPage({ params }: PageProps<"/producto/[id]">) {
  const { id } = await params;
  return (
    <EmptyState title="Próximamente (Fase 3.5)" description={`Detalle del producto ${id}.`} />
  );
}
