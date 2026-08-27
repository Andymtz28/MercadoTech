import { ConditionBadge } from "@/components/shared/ConditionBadge";
import { RatingStars } from "@/components/shared/RatingStars";
import type { Product } from "@/types/product";

interface ProductInfoProps {
  product: Product;
}

export function ProductInfo({ product }: ProductInfoProps) {
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">{product.title}</h1>
        {product.brand && <p className="text-sm text-muted-foreground">Marca: {product.brand}</p>}
      </div>
      <div className="flex items-center gap-3">
        <ConditionBadge condition={product.condition} />
        {product.review_count > 0 && (
          <RatingStars rating={product.average_rating ?? 0} reviewCount={product.review_count} />
        )}
      </div>
      {product.description && (
        <p className="whitespace-pre-line text-sm text-muted-foreground">{product.description}</p>
      )}
    </div>
  );
}
