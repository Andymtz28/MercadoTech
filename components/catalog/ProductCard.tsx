import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { ProductImage } from "@/components/shared/ProductImage";
import { ConditionBadge } from "@/components/shared/ConditionBadge";
import { Price } from "@/components/shared/Price";
import { RatingStars } from "@/components/shared/RatingStars";
import type { Product } from "@/types/product";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <Link href={`/producto/${product.id}`} className="block">
      <Card className="h-full overflow-hidden py-0 transition-shadow hover:shadow-md">
        <div className="relative aspect-square bg-muted">
          <ProductImage src={product.image_url} alt={product.title} />
        </div>
        <CardContent className="space-y-1.5 p-3">
          <div className="flex items-start justify-between gap-2">
            <p className="line-clamp-2 text-sm font-medium">{product.title}</p>
          </div>
          <ConditionBadge condition={product.condition} />
          <Price value={product.price} className="block text-base" />
          {product.review_count > 0 && (
            <RatingStars rating={product.average_rating ?? 0} reviewCount={product.review_count} size={14} />
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
