"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useSellerProducts } from "@/hooks/useSellerProducts";
import { LoadingState } from "@/components/shared/LoadingState";
import { ErrorState } from "@/components/shared/ErrorState";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { ProductsTable } from "@/components/seller/ProductsTable";
import { getErrorMessage } from "@/lib/utils";

export default function SellerProductsPage() {
  const { user } = useAuth();
  const { products, loading, error, remove, reload } = useSellerProducts(user?.id);
  const router = useRouter();

  async function handleDelete(productId: string) {
    if (!window.confirm("¿Eliminar este producto? Esta acción no se puede deshacer.")) return;
    try {
      await remove(productId);
      toast.success("Producto eliminado");
    } catch (err) {
      toast.error(getErrorMessage(err, "No se pudo eliminar el producto."));
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Mis productos</h1>
        <Button nativeButton={false} render={<Link href="/vendedor/publicar">Publicar producto</Link>} />
      </div>

      {loading ? (
        <LoadingState message="Cargando productos…" />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : products.length === 0 ? (
        <EmptyState
          title="Todavía no tienes productos"
          description="Publica tu primer producto para empezar a vender."
          actionLabel="Publicar producto"
          onAction={() => router.push("/vendedor/publicar")}
        />
      ) : (
        <ProductsTable products={products} onDelete={handleDelete} />
      )}
    </div>
  );
}
