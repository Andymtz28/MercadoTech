"use client";

import { useAuth } from "@/hooks/useAuth";
import { useFavorites } from "@/hooks/useFavorites";
import { Container } from "@/components/shared/Container";
import { ProductGrid } from "@/components/catalog/ProductGrid";

export default function FavoritesPage() {
  const { user } = useAuth();
  const { products, loading, error, reload } = useFavorites(user?.id);

  return (
    <Container className="space-y-6 py-8">
      <h1 className="text-2xl font-bold">Favoritos</h1>
      <ProductGrid
        products={products}
        loading={loading}
        error={error}
        onRetry={reload}
        emptyTitle="Todavía no tienes favoritos"
        emptyDescription="Los productos que marques con el corazón aparecerán aquí."
      />
    </Container>
  );
}
