import Link from "next/link";
import { MonogramBadge } from "@/components/shared/MonogramBadge";
import { getMonogram } from "@/lib/utils";
import type { CategoryWithCount } from "@/services/category.service";

interface CategoryTilesProps {
  categories: CategoryWithCount[];
}

export function CategoryTiles({ categories }: CategoryTilesProps) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-text-strong">Categorías</h2>
        <Link href="/buscar" className="text-sm font-medium text-primary hover:text-brand-hover">
          Ver todo el catálogo
        </Link>
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3">
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/categoria/${category.slug}`}
            className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 transition-all duration-150 hover:-translate-y-0.5 hover:border-primary"
          >
            <MonogramBadge text={getMonogram(category.name)} />
            <div className="min-w-0">
              <p className="truncate font-heading text-sm font-bold text-text-strong">{category.name}</p>
              <p className="text-xs text-text-faint">
                {category.productCount} {category.productCount === 1 ? "publicación" : "publicaciones"}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
