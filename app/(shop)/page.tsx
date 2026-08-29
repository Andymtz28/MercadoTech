"use client";

import { useCategoriesWithCounts } from "@/hooks/useCategoriesWithCounts";
import { usePriceDrops } from "@/hooks/usePriceDrops";
import { useTopReviewed } from "@/hooks/useTopReviewed";
import { useHomeStats } from "@/hooks/useHomeStats";
import { Hero } from "@/components/home/Hero";
import { CategoryTiles } from "@/components/home/CategoryTiles";
import { PriceDropsSection } from "@/components/home/PriceDropsSection";
import { TrustCards } from "@/components/home/TrustCards";
import { ReviewsPanel } from "@/components/home/ReviewsPanel";
import { Container } from "@/components/shared/Container";

const PRICE_DROPS_LIMIT = 5;
const TOP_REVIEWED_LIMIT = 3;

export default function HomePage() {
  const stats = useHomeStats();
  const { categories } = useCategoriesWithCounts();
  const { products: priceDrops, loading: priceDropsLoading } = usePriceDrops(PRICE_DROPS_LIMIT);
  const { products: topReviewed } = useTopReviewed(TOP_REVIEWED_LIMIT);

  return (
    <Container className="space-y-7 py-6">
      <Hero stats={stats} />
      {categories.length > 0 && <CategoryTiles categories={categories} />}
      <PriceDropsSection products={priceDrops} loading={priceDropsLoading} />
      <TrustCards />
      <ReviewsPanel products={topReviewed} />
    </Container>
  );
}
