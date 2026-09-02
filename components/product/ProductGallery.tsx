"use client";

import { useState } from "react";
import { ProductImage } from "@/components/shared/ProductImage";
import { cn } from "@/lib/utils";
import type { ProductImage as ProductImageRow } from "@/types/product";

interface ProductGalleryProps {
  images: ProductImageRow[];
  imageUrls: string[];
  title: string;
}

export function ProductGallery({ images, imageUrls, title }: ProductGalleryProps) {
  const [selected, setSelected] = useState(0);

  if (imageUrls.length === 0) {
    return (
      <div className="relative aspect-square overflow-hidden rounded-lg border bg-muted">
        <ProductImage src={null} alt={title} sizes="(min-width: 768px) 50vw, 100vw" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative aspect-square overflow-hidden rounded-lg border bg-muted">
        <ProductImage src={imageUrls[selected]} alt={title} sizes="(min-width: 768px) 50vw, 100vw" />
      </div>
      {imageUrls.length > 1 && (
        <div className="flex gap-2" role="tablist" aria-label="Imágenes del producto">
          {imageUrls.map((url, index) => (
            <button
              key={images[index]?.id ?? url}
              type="button"
              role="tab"
              aria-selected={index === selected}
              aria-label={`Imagen ${index + 1} de ${imageUrls.length}`}
              onClick={() => setSelected(index)}
              className={cn(
                "relative size-16 shrink-0 overflow-hidden rounded-md border-2",
                index === selected ? "border-primary" : "border-transparent",
              )}
            >
              <ProductImage src={url} alt="" fill sizes="64px" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
