"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useCategories } from "@/hooks/useCategories";
import { useProductForm } from "@/hooks/useProductForm";
import { ProductForm } from "@/components/seller/ProductForm";
import { LoadingState } from "@/components/shared/LoadingState";
import { getErrorMessage } from "@/lib/utils";

export default function SellerCreateProductPage() {
  const { user } = useAuth();
  const { categories } = useCategories();
  const form = useProductForm(user?.id ?? "");
  const router = useRouter();

  if (!user) return <LoadingState message="Cargando…" />;

  async function handleSubmit() {
    try {
      const id = await form.submit();
      toast.success("Producto publicado");
      router.push(`/vendedor/productos/${id}/editar`);
    } catch (err) {
      toast.error(getErrorMessage(err, "No se pudo publicar el producto."));
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Publicar producto</h1>
      <ProductForm
        fields={form.fields}
        onFieldChange={form.updateField}
        categories={categories}
        images={form.images}
        onReorderImages={form.reorderImages}
        onAddImage={(file) =>
          form.addImage(file).catch((err) => toast.error(getErrorMessage(err, "No se pudo agregar la imagen.")))
        }
        onRemoveImage={(id) =>
          form.removeImage(id).catch((err) => toast.error(getErrorMessage(err, "No se pudo quitar la imagen.")))
        }
        onSubmit={handleSubmit}
        saving={form.saving}
        submitLabel="Publicar"
      />
    </div>
  );
}
