"use client";

import { useCallback, useEffect, useState } from "react";
import { getProductById } from "@/services/product.service";
import { createProduct, updateProduct } from "@/services/seller.service";
import {
  deleteProductImage,
  getPublicUrl,
  saveImageOrder,
  uploadProductImage,
  validateProductImageFile,
} from "@/services/storage.service";
import type { ProductFormInput } from "@/lib/validators/product";
import type { GalleryImage, ProductImage } from "@/types/product";

export type { GalleryImage };

const EMPTY_FIELDS: ProductFormInput = {
  title: "",
  description: "",
  brand: "",
  condition: "nuevo",
  categoryId: "",
  price: 0,
  stock: 0,
};

export function useProductForm(sellerId: string, productId?: string) {
  const isEdit = !!productId;
  const [fields, setFields] = useState<ProductFormInput>(EMPTY_FIELDS);
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!productId) return;
    let active = true;
    setLoading(true);
    getProductById(productId).then((product) => {
      if (!active || !product) return;
      setFields({
        title: product.title,
        description: product.description ?? "",
        brand: product.brand ?? "",
        condition: product.condition,
        categoryId: product.category_id,
        price: product.price,
        stock: product.stock,
      });
      setImages(
        product.images
          .slice()
          .sort((a, b) => a.position - b.position)
          .map((img) => ({
            id: img.id,
            imagePath: img.image_path,
            publicUrl: getPublicUrl(img.image_path),
            position: img.position,
            file: null,
          })),
      );
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [productId]);

  const updateField = useCallback(<K extends keyof ProductFormInput>(key: K, value: ProductFormInput[K]) => {
    setFields((prev) => ({ ...prev, [key]: value }));
  }, []);

  // Reorden: local en modo create (no hay product_id todavía); se persiste
  // de inmediato en modo edit (upsert con filas completas).
  const reorderImages = useCallback(
    async (nextOrder: GalleryImage[]) => {
      const reindexed = nextOrder.map((img, index) => ({ ...img, position: index }));
      setImages(reindexed);

      if (!isEdit) return;
      const persisted = reindexed.filter(
        (img): img is GalleryImage & { imagePath: string } => !!img.imagePath && !img.file,
      );
      if (persisted.length === 0) return;
      const rows: ProductImage[] = persisted.map((img) => ({
        id: img.id,
        product_id: productId!,
        image_path: img.imagePath,
        position: img.position,
      }));
      await saveImageOrder(rows);
    },
    [isEdit, productId],
  );

  const addImage = useCallback(
    async (file: File) => {
      const invalidReason = validateProductImageFile(file);
      if (invalidReason) throw new Error(invalidReason);

      if (!isEdit) {
        setImages((prev) => [
          ...prev,
          { id: crypto.randomUUID(), imagePath: null, publicUrl: URL.createObjectURL(file), position: prev.length, file },
        ]);
        return;
      }

      const maxPosition = images.reduce((max, img) => Math.max(max, img.position), -1);
      const row = await uploadProductImage(file, sellerId, productId!, maxPosition + 1);
      setImages((prev) => [
        ...prev,
        { id: row.id, imagePath: row.image_path, publicUrl: getPublicUrl(row.image_path), position: row.position, file: null },
      ]);
    },
    [isEdit, images, sellerId, productId],
  );

  const removeImage = useCallback(
    async (imageId: string) => {
      const target = images.find((img) => img.id === imageId);
      if (!target) return;
      if (target.imagePath) {
        await deleteProductImage(imageId, target.imagePath);
      }
      setImages((prev) => prev.filter((img) => img.id !== imageId));
    },
    [images],
  );

  const submit = useCallback(async (): Promise<string> => {
    setSaving(true);
    try {
      if (isEdit) {
        await updateProduct(productId!, fields);
        return productId!;
      }

      const newId = await createProduct({ ...fields, sellerId });
      for (let index = 0; index < images.length; index += 1) {
        const image = images[index];
        if (image.file) {
          await uploadProductImage(image.file, sellerId, newId, index);
        }
      }
      return newId;
    } finally {
      setSaving(false);
    }
  }, [isEdit, productId, fields, images, sellerId]);

  return {
    fields,
    updateField,
    images,
    addImage,
    removeImage,
    reorderImages,
    submit,
    loading,
    saving,
    isEdit,
  };
}
