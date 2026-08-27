import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductImage } from "@/components/shared/ProductImage";
import { Price } from "@/components/shared/Price";
import type { CartItemWithProduct } from "@/types/cart";

interface CartItemRowProps {
  item: CartItemWithProduct;
  onQuantityChange: (quantity: number) => void;
  onRemove: () => void;
}

export function CartItemRow({ item, onQuantityChange, onRemove }: CartItemRowProps) {
  if (!item.product) {
    return (
      <div className="flex items-center justify-between gap-4 border-b py-4 last:border-b-0">
        <p className="text-sm text-muted-foreground">Este producto ya no está disponible.</p>
        <Button variant="ghost" size="icon" onClick={onRemove} aria-label="Quitar del carrito">
          <Trash2 className="size-4" aria-hidden="true" />
        </Button>
      </div>
    );
  }

  const { product } = item;
  const atStockLimit = item.quantity >= product.stock;

  return (
    <div className="flex items-center gap-4 border-b py-4 last:border-b-0">
      <div className="relative size-20 shrink-0 overflow-hidden rounded-md border bg-muted">
        <ProductImage src={product.imageUrl} alt={product.title} />
      </div>

      <div className="min-w-0 flex-1 space-y-1">
        <Link href={`/producto/${product.id}`} className="line-clamp-2 text-sm font-medium hover:underline">
          {product.title}
        </Link>
        <Price value={product.price} />
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          disabled={item.quantity <= 1}
          onClick={() => onQuantityChange(item.quantity - 1)}
          aria-label="Disminuir cantidad"
        >
          <Minus className="size-3.5" aria-hidden="true" />
        </Button>
        <span className="w-8 text-center text-sm" aria-live="polite">
          {item.quantity}
        </span>
        <Button
          variant="outline"
          size="icon"
          disabled={atStockLimit}
          onClick={() => onQuantityChange(item.quantity + 1)}
          aria-label="Aumentar cantidad"
        >
          <Plus className="size-3.5" aria-hidden="true" />
        </Button>
      </div>

      <Button variant="ghost" size="icon" onClick={onRemove} aria-label="Quitar del carrito">
        <Trash2 className="size-4" aria-hidden="true" />
      </Button>
    </div>
  );
}
