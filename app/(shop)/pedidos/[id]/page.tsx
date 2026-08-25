import { EmptyState } from "@/components/shared/EmptyState";

export default async function OrderDetailPage({ params }: PageProps<"/pedidos/[id]">) {
  const { id } = await params;
  return <EmptyState title="Próximamente (Fase 3.6)" description={`Detalle del pedido ${id}.`} />;
}
