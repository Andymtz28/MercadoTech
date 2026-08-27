"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RatingStars } from "@/components/shared/RatingStars";
import { EmptyState } from "@/components/shared/EmptyState";
import type { Review } from "@/types/review";

interface ReviewsSectionProps {
  reviews: Review[];
  canReview: boolean;
  onSubmit: (rating: number, comment: string) => Promise<void>;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" });
}

export function ReviewsSection({ reviews, canReview, onSubmit }: ReviewsSectionProps) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    setSubmitting(true);
    try {
      await onSubmit(rating, comment.trim());
      setComment("");
      setRating(5);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">Reseñas</h2>

      {canReview && (
        <div className="space-y-2 rounded-lg border p-3">
          <p className="text-sm font-medium">Compraste este producto — cuéntanos qué te pareció</p>
          <div className="flex items-center gap-1" role="radiogroup" aria-label="Calificación">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setRating(value)}
                aria-label={`${value} estrellas`}
                role="radio"
                aria-checked={rating === value}
              >
                <Star
                  width={24}
                  height={24}
                  className={value <= rating ? "fill-primary text-primary" : "fill-muted text-muted-foreground"}
                />
              </button>
            ))}
          </div>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Comparte tu experiencia con este producto…"
            aria-label="Comentario de la reseña"
          />
          <Button size="sm" onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Enviando…" : "Publicar reseña"}
          </Button>
        </div>
      )}

      {reviews.length === 0 ? (
        <EmptyState title="Todavía no hay reseñas" description="Sé el primero en reseñar este producto." />
      ) : (
        <ul className="space-y-4">
          {reviews.map((review) => (
            <li key={review.id} className="space-y-1 border-b pb-4 last:border-b-0">
              <div className="flex items-center gap-2">
                <RatingStars rating={review.rating} size={16} />
                <span className="text-sm text-muted-foreground">
                  Comprador verificado · {formatDate(review.created_at)}
                </span>
              </div>
              {review.comment && <p className="text-sm">{review.comment}</p>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
