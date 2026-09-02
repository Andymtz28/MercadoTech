"use client";

import { useState, type FormEvent } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LoadingState } from "@/components/shared/LoadingState";

// dnd-kit (reordenar imágenes por arrastre) solo se necesita en /vendedor/
// publicar y /vendedor/productos/[id]/editar — sacarlo del bundle común de
// esas páginas (Fase 7.2, medido en docs/PERFORMANCE.md).
const SortableImageGallery = dynamic(
  () => import("@/components/seller/SortableImageGallery").then((m) => m.SortableImageGallery),
  { ssr: false, loading: () => <LoadingState message="Cargando imágenes…" /> },
);
import { validateProductForm, type ProductFormInput } from "@/lib/validators/product";
import type { FieldErrors } from "@/lib/validators/auth";
import { PRODUCT_CONDITIONS } from "@/lib/constants/roles";
import type { CategoryLink } from "@/components/layout/CategoriesMenu";
import type { GalleryImage } from "@/types/product";

const CONDITION_LABELS: Record<string, string> = {
  nuevo: "Nuevo",
  usado: "Usado",
  reacondicionado: "Reacondicionado",
};

interface ProductFormProps {
  fields: ProductFormInput;
  onFieldChange: <K extends keyof ProductFormInput>(key: K, value: ProductFormInput[K]) => void;
  categories: CategoryLink[];
  images: GalleryImage[];
  onReorderImages: (images: GalleryImage[]) => void;
  onAddImage: (file: File) => void;
  onRemoveImage: (imageId: string) => void;
  onSubmit: () => Promise<void>;
  saving: boolean;
  submitLabel: string;
}

export function ProductForm({
  fields,
  onFieldChange,
  categories,
  images,
  onReorderImages,
  onAddImage,
  onRemoveImage,
  onSubmit,
  saving,
  submitLabel,
}: ProductFormProps) {
  const [errors, setErrors] = useState<FieldErrors<ProductFormInput>>({});

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const validationErrors = validateProductForm(fields);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;
    await onSubmit();
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-4" noValidate>
      <div className="space-y-1.5">
        <Label htmlFor="title">Título</Label>
        <Input
          id="title"
          value={fields.title}
          onChange={(e) => onFieldChange("title", e.target.value)}
          aria-invalid={!!errors.title}
        />
        {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Descripción</Label>
        <Textarea
          id="description"
          value={fields.description}
          onChange={(e) => onFieldChange("description", e.target.value)}
          aria-invalid={!!errors.description}
        />
        {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="brand">Marca</Label>
          <Input id="brand" value={fields.brand} onChange={(e) => onFieldChange("brand", e.target.value)} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="condition">Condición</Label>
          <Select
            value={fields.condition}
            onValueChange={(v) => onFieldChange("condition", v as typeof fields.condition)}
            items={CONDITION_LABELS}
          >
            <SelectTrigger id="condition" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRODUCT_CONDITIONS.map((condition) => (
                <SelectItem key={condition} value={condition}>
                  {CONDITION_LABELS[condition]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="categoryId">Categoría</Label>
        <Select
          value={fields.categoryId}
          onValueChange={(v) => onFieldChange("categoryId", v ?? "")}
          items={Object.fromEntries(categories.map((category) => [category.id, category.name]))}
        >
          <SelectTrigger id="categoryId" className="w-full" aria-invalid={!!errors.categoryId}>
            <SelectValue placeholder="Selecciona una categoría" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.categoryId && <p className="text-sm text-destructive">{errors.categoryId}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="price">Precio</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            min="0"
            value={fields.price}
            onChange={(e) => onFieldChange("price", Number(e.target.value))}
            aria-invalid={!!errors.price}
          />
          {errors.price && <p className="text-sm text-destructive">{errors.price}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="stock">Stock</Label>
          <Input
            id="stock"
            type="number"
            step="1"
            min="0"
            value={fields.stock}
            onChange={(e) => onFieldChange("stock", Number(e.target.value))}
            aria-invalid={!!errors.stock}
          />
          {errors.stock && <p className="text-sm text-destructive">{errors.stock}</p>}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Imágenes</Label>
        <SortableImageGallery
          images={images}
          onReorder={onReorderImages}
          onAdd={onAddImage}
          onRemove={onRemoveImage}
        />
      </div>

      <Button type="submit" disabled={saving}>
        {saving ? "Guardando…" : submitLabel}
      </Button>
    </form>
  );
}
