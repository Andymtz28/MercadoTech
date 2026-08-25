import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface RatingStarsProps {
  rating: number;
  reviewCount?: number;
  size?: number;
  className?: string;
}

export function RatingStars({ rating, reviewCount, size = 16, className }: RatingStarsProps) {
  const rounded = Math.round(rating);

  return (
    <div className={cn("flex items-center gap-1", className)} role="img" aria-label={`${rating.toFixed(1)} de 5 estrellas`}>
      <div className="flex" aria-hidden="true">
        {Array.from({ length: 5 }, (_, i) => (
          <Star
            key={i}
            width={size}
            height={size}
            className={i < rounded ? "fill-primary text-primary" : "fill-muted text-muted-foreground"}
          />
        ))}
      </div>
      {typeof reviewCount === "number" && (
        <span className="text-sm text-muted-foreground">({reviewCount})</span>
      )}
    </div>
  );
}
