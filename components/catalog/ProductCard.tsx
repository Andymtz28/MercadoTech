import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProductImage } from "@/components/shared/ProductImage";
import { ConditionBadge } from "@/components/shared/ConditionBadge";
import { Price } from "@/components/shared/Price";
import { RatingStars } from "@/components/shared/RatingStars";
import type { Product } from "@/types/product";

interface ProductCardProps {
  product: Product;
  // 0-1: solo la pestaña "Resultados con IA" lo pasa (Fase 4.4).
  similarity?: number;
}

export function ProductCard({ product, similarity }: ProductCardProps) {
  const hasDiscount = product.previous_price !== null && product.previous_price > product.price;
  const discountPercent = hasDiscount ? Math.round((1 - product.price / product.previous_price!) * 100) : null;

  return (
    <Link href={`/producto/${product.id}`} className="block">
      <Card className="h-full overflow-hidden py-0 transition-shadow hover:shadow-md">
        <div className="relative aspect-square bg-muted">
          <ProductImage src={product.image_url} alt={product.title} />
          {discountPercent !== null && (
            <Badge className="absolute top-2 left-2">-{discountPercent}%</Badge>
          )}
          {similarity !== undefined && (
            <Badge className="absolute top-2 right-2" variant="secondary">
              {Math.round(similarity * 100)}% relevante
            </Badge>
          )}
        </div>
        <CardContent className="space-y-1.5 p-3">
          <div className="flex items-start justify-between gap-2">
            <p className="line-clamp-2 text-sm font-medium">{product.title}</p>
          </div>
          <ConditionBadge condition={product.condition} />
          <div className="flex items-baseline gap-1.5">
            <Price value={product.price} className="block text-base" />
            {hasDiscount && <Price value={product.previous_price!} className="text-xs font-normal text-text-dim line-through" />}
          </div>
          {product.review_count > 0 && (
            <RatingStars rating={product.average_rating ?? 0} reviewCount={product.review_count} size={14} />
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
