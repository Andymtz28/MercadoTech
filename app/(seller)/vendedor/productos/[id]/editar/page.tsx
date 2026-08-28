"use client";

import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useCategories } from "@/hooks/useCategories";
import { useProductForm } from "@/hooks/useProductForm";
import { ProductForm } from "@/components/seller/ProductForm";
import { LoadingState } from "@/components/shared/LoadingState";
import { getErrorMessage } from "@/lib/utils";

export default function SellerEditProductPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { categories } = useCategories();
  const form = useProductForm(user?.id ?? "", id);
  const router = useRouter();

  if (!user || form.loading) return <LoadingState message="Cargando producto…" />;

  async function handleSubmit() {
    try {
      await form.submit();
      toast.success("Cambios guardados");
      router.push("/vendedor/productos");
    } catch (err) {
      toast.error(getErrorMessage(err, "No se pudieron guardar los cambios."));
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Editar producto</h1>
      <ProductForm
        fields={form.fields}
        onFieldChange={form.updateField}
        categories={categories}
        images={form.images}
        onReorderImages={(images) =>
          form.reorderImages(images).catch((err) => toast.error(getErrorMessage(err, "No se pudo guardar el orden.")))
        }
        onAddImage={(file) =>
          form.addImage(file).catch((err) => toast.error(getErrorMessage(err, "No se pudo agregar la imagen.")))
        }
        onRemoveImage={(imgId) =>
          form.removeImage(imgId).catch((err) => toast.error(getErrorMessage(err, "No se pudo quitar la imagen.")))
        }
        onSubmit={handleSubmit}
        saving={form.saving}
        submitLabel="Guardar cambios"
      />
    </div>
  );
}
