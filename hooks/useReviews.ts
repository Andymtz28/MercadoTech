"use client";

import { useCallback, useEffect, useState } from "react";
import { getErrorMessage } from "@/lib/utils";
import { canReview, createReview, listReviews, type CanReviewResult } from "@/services/review.service";
import type { Review } from "@/types/review";

export function useReviews(productId: string, userId?: string) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [canReviewResult, setCanReviewResult] = useState<CanReviewResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [list, can] = await Promise.all([
        listReviews(productId),
        userId ? canReview(productId, userId) : Promise.resolve(null),
      ]);
      setReviews(list);
      setCanReviewResult(can);
    } catch (err) {
      setError(getErrorMessage(err, "No se pudieron cargar las reseñas."));
    } finally {
      setLoading(false);
    }
  }, [productId, userId]);

  useEffect(() => {
    reload();
  }, [reload]);

  const submitReview = useCallback(
    async (rating: number, comment: string) => {
      if (!userId || !canReviewResult?.allowed || !canReviewResult.orderId) {
        throw new Error("No puedes reseñar este producto todavía.");
      }
      await createReview({ productId, buyerId: userId, orderId: canReviewResult.orderId, rating, comment });
      await reload();
    },
    [userId, canReviewResult, productId, reload],
  );

  return { reviews, canReview: canReviewResult, loading, error, submitReview, reload };
}
