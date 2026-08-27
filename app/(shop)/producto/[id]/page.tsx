"use client";

import { useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useProduct } from "@/hooks/useProduct";
import { useQuestions } from "@/hooks/useQuestions";
import { useReviews } from "@/hooks/useReviews";
import { useFavorite } from "@/hooks/useFavorite";
import { useCart } from "@/hooks/useCart";
import { registerView } from "@/services/product.service";
import { getPublicUrl } from "@/services/storage.service";
import { createClient } from "@/lib/supabase/client";
import { getErrorMessage } from "@/lib/utils";
import { Container } from "@/components/shared/Container";
import { LoadingState } from "@/components/shared/LoadingState";
import { ErrorState } from "@/components/shared/ErrorState";
import { ProductGallery } from "@/components/product/ProductGallery";
import { ProductInfo } from "@/components/product/ProductInfo";
import { BuyBox } from "@/components/product/BuyBox";
import { QuestionsSection } from "@/components/product/QuestionsSection";
import { ReviewsSection } from "@/components/product/ReviewsSection";

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { product, loading, error, reload } = useProduct(id);
  const { questions, ask, answer } = useQuestions(id);
  const { reviews, canReview, submitReview } = useReviews(id, user?.id);
  const { favorite, toggle: toggleFavorite } = useFavorite(id, user?.id);
  const { add: addToCart } = useCart(user?.id);
  const supabase = useMemo(() => createClient(), []);
  const imageUrls = useMemo(
    () => (product ? product.images.map((img) => getPublicUrl(img.image_path, supabase)) : []),
    [product, supabase],
  );

  useEffect(() => {
    if (user && product) {
      registerView(product.id, user.id).catch(() => {
        // Fire-and-forget: no bloquea ni rompe la UI de detalle.
      });
    }
  }, [user, product]);

  if (loading) return <LoadingState message="Cargando producto…" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!product) return <ErrorState message="Producto no encontrado." />;

  const isOwnProduct = user?.id === product.seller_id;
  const productId = product.id;

  async function handleAsk(question: string) {
    if (!user) return;
    try {
      await ask(user.id, question);
    } catch (err) {
      toast.error(getErrorMessage(err, "No se pudo enviar la pregunta."));
    }
  }

  async function handleAnswer(questionId: string, answerText: string) {
    try {
      await answer(questionId, answerText);
      toast.success("Respuesta publicada");
    } catch (err) {
      toast.error(getErrorMessage(err, "No se pudo publicar la respuesta."));
    }
  }

  async function handleSubmitReview(rating: number, comment: string) {
    try {
      await submitReview(rating, comment);
      toast.success("Reseña publicada");
    } catch (err) {
      toast.error(getErrorMessage(err, "No se pudo publicar la reseña."));
    }
  }

  async function handleToggleFavorite() {
    try {
      await toggleFavorite();
    } catch (err) {
      toast.error(getErrorMessage(err, "No se pudo actualizar favoritos."));
    }
  }

  async function handleAddToCart() {
    try {
      await addToCart(productId);
      toast.success("Agregado al carrito");
    } catch (err) {
      toast.error(getErrorMessage(err, "No se pudo agregar al carrito."));
    }
  }

  return (
    <Container className="space-y-10 py-8">
      <div className="grid gap-8 md:grid-cols-2">
        <ProductGallery images={product.images} imageUrls={imageUrls} title={product.title} />
        <div className="space-y-6">
          <ProductInfo product={product} />
          <BuyBox
            price={product.price}
            stock={product.stock}
            isAuthenticated={!!user}
            isOwnProduct={isOwnProduct}
            isFavorite={favorite}
            onToggleFavorite={user ? handleToggleFavorite : undefined}
            onAddToCart={user && !isOwnProduct && product.stock > 0 ? handleAddToCart : undefined}
          />
        </div>
      </div>

      <QuestionsSection
        questions={questions}
        isAuthenticated={!!user}
        isProductOwner={isOwnProduct}
        onAsk={handleAsk}
        onAnswer={handleAnswer}
      />

      <ReviewsSection reviews={reviews} canReview={!!canReview?.allowed} onSubmit={handleSubmitReview} />
    </Container>
  );
}
