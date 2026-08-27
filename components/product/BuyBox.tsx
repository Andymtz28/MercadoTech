import { Heart, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Price } from "@/components/shared/Price";
import { cn } from "@/lib/utils";

interface BuyBoxProps {
  price: number;
  stock: number;
  isAuthenticated: boolean;
  isOwnProduct: boolean;
  onAddToCart?: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

export function BuyBox({
  price,
  stock,
  isAuthenticated,
  isOwnProduct,
  onAddToCart,
  isFavorite,
  onToggleFavorite,
}: BuyBoxProps) {
  const disabledReason = !isAuthenticated
    ? "Inicia sesión para comprar"
    : isOwnProduct
      ? "Es tu propio producto"
      : stock <= 0
        ? "Sin stock"
        : null;

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <Price value={price} className="text-2xl" />
      <p className="text-sm text-muted-foreground">
        {stock > 0 ? `${stock} disponibles` : "Sin stock disponible"}
      </p>

      <div className="flex gap-2">
        <Button className="flex-1" disabled={!!disabledReason} onClick={onAddToCart}>
          <ShoppingCart className="size-4" aria-hidden="true" />
          Agregar al carrito
        </Button>
        {onToggleFavorite && (
          <Button
            variant="outline"
            size="icon"
            onClick={onToggleFavorite}
            aria-label={isFavorite ? "Quitar de favoritos" : "Agregar a favoritos"}
            aria-pressed={isFavorite}
          >
            <Heart className={cn("size-4", isFavorite && "fill-destructive text-destructive")} aria-hidden="true" />
          </Button>
        )}
      </div>

      {disabledReason && <p className="text-sm text-muted-foreground">{disabledReason}</p>}
    </div>
  );
}
