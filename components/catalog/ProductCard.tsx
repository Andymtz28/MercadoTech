import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProductImage } from "@/components/shared/ProductImage";
import { ConditionBadge } from "@/components/shared/ConditionBadge";
import { Price } from "@/components/shared/Price";
import { RatingStars } from "@/components/shared/RatingStars";
import type { Product } from "@/types/product";

interface ProductCardProps {
  product: Product;
  // 0-1: solo la pestaña "Resultados con IA" lo pasa (Fase 4.4).
  similarity?: number;
  // Pie "Comparar"/"Agregar": solo Resultados los pasa (diseño/README.md §
  // Resultados de búsqueda). Sin ellos, la tarjeta no muestra el pie.
  compareChecked?: boolean;
  onCompareChange?: (checked: boolean) => void;
  onAddToCart?: () => void;
}

export function ProductCard({ product, similarity, compareChecked, onCompareChange, onAddToCart }: ProductCardProps) {
  const hasDiscount = product.previous_price !== null && product.previous_price > product.price;
  const discountPercent = hasDiscount ? Math.round((1 - product.price / product.previous_price!) * 100) : null;
  const showFooter = onCompareChange !== undefined || onAddToCart !== undefined;

  return (
    <Card data-testid="product-card" data-product-id={product.id} className="h-full overflow-hidden py-0 transition-shadow hover:shadow-md">
      <Link href={`/producto/${product.id}`} className="block">
        <div className="relative aspect-square bg-muted">
          <ProductImage src={product.image_url} alt={product.title} />
          {discountPercent !== null && <Badge className="absolute top-2 left-2">-{discountPercent}%</Badge>}
          {similarity !== undefined && (
            <Badge className="absolute top-2 right-2" variant="secondary">
              {Math.round(similarity * 100)}% relevante
            </Badge>
          )}
        </div>
        <CardContent className="space-y-1.5 p-3">
          <p className="line-clamp-2 min-h-[2.6em] text-sm font-medium">{product.title}</p>
          <ConditionBadge condition={product.condition} />
          <div className="flex items-baseline gap-1.5">
            <Price value={product.price} className="block text-base" />
            {hasDiscount && <Price value={product.previous_price!} className="text-xs font-normal text-text-dim line-through" />}
          </div>
          {product.review_count > 0 && (
            <RatingStars rating={product.average_rating ?? 0} reviewCount={product.review_count} size={14} />
          )}
        </CardContent>
      </Link>
      {showFooter && (
        <div className="flex items-center justify-between gap-2 border-t border-divider px-3 py-2.5">
          {onCompareChange ? (
            <label className="flex cursor-pointer items-center gap-1.5 text-xs text-text-quiet">
              <input
                type="checkbox"
                checked={compareChecked ?? false}
                onChange={(e) => onCompareChange(e.target.checked)}
                className="size-3.5 accent-primary"
              />
              Comparar
            </label>
          ) : (
            <span />
          )}
          {onAddToCart && (
            <Button size="sm" variant="outline" onClick={onAddToCart} className="border-primary text-primary hover:bg-brand-soft">
              Agregar
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}
