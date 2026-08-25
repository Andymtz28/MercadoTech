import Link from "next/link";
import { ChevronDown, LayoutGrid } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export interface CategoryLink {
  id: string;
  name: string;
  slug: string;
}

interface CategoriesMenuProps {
  categories: CategoryLink[];
}

export function CategoriesMenu({ categories }: CategoriesMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" className="gap-1.5">
            <LayoutGrid className="size-4" aria-hidden="true" />
            Categorías
            <ChevronDown className="size-3.5" aria-hidden="true" />
          </Button>
        }
      />
      <DropdownMenuContent align="start" className="w-56">
        {categories.length === 0 ? (
          <DropdownMenuItem disabled>Sin categorías</DropdownMenuItem>
        ) : (
          categories.map((category) => (
            <DropdownMenuItem key={category.id} render={<Link href={`/categoria/${category.slug}`} />}>
              {category.name}
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
