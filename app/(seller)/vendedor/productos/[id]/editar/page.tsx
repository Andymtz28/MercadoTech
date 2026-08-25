import { EmptyState } from "@/components/shared/EmptyState";

export default async function SellerEditProductPage({
  params,
}: PageProps<"/vendedor/productos/[id]/editar">) {
  const { id } = await params;
  return <EmptyState title="Próximamente (Fase 3.7)" description={`Editar el producto ${id}.`} />;
}
