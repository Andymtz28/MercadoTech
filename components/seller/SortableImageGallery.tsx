"use client";

import { useRef } from "react";
import { X, GripVertical, Plus } from "lucide-react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { ProductImage } from "@/components/shared/ProductImage";
import type { GalleryImage } from "@/types/product";

interface SortableImageGalleryProps {
  images: GalleryImage[];
  onReorder: (images: GalleryImage[]) => void;
  onAdd: (file: File) => void;
  onRemove: (imageId: string) => void;
}

function SortableThumb({ image, onRemove }: { image: GalleryImage; onRemove: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: image.id });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className="relative size-24 shrink-0 overflow-hidden rounded-md border bg-muted"
      aria-roledescription="imagen ordenable"
    >
      <ProductImage src={image.publicUrl} alt="" fill sizes="96px" />
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="absolute inset-x-0 top-0 flex h-6 cursor-grab items-center justify-center bg-black/50 text-white active:cursor-grabbing"
        aria-label="Arrastrar para reordenar"
        style={{ opacity: isDragging ? 0.5 : 1 }}
      >
        <GripVertical className="size-3.5" aria-hidden="true" />
      </button>
      <Button
        type="button"
        variant="destructive"
        size="icon-sm"
        className="absolute right-1 bottom-1"
        onClick={onRemove}
        aria-label="Quitar imagen"
      >
        <X className="size-3" aria-hidden="true" />
      </Button>
    </li>
  );
}

export function SortableImageGallery({ images, onReorder, onAdd, onRemove }: SortableImageGalleryProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = images.findIndex((img) => img.id === active.id);
    const newIndex = images.findIndex((img) => img.id === over.id);
    onReorder(arrayMove(images, oldIndex, newIndex));
  }

  return (
    <div className="space-y-2">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={images.map((img) => img.id)} strategy={horizontalListSortingStrategy}>
          <ul className="flex flex-wrap gap-3" aria-label="Galería de imágenes del producto">
            {images.map((image) => (
              <SortableThumb key={image.id} image={image} onRemove={() => onRemove(image.id)} />
            ))}
            <li>
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="flex size-24 flex-col items-center justify-center gap-1 rounded-md border border-dashed text-muted-foreground hover:bg-muted"
              >
                <Plus className="size-5" aria-hidden="true" />
                <span className="text-xs">Agregar</span>
              </button>
            </li>
          </ul>
        </SortableContext>
      </DndContext>
      <input
        ref={inputRef}
        type="file"
        data-testid="product-image-input"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onAdd(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}
