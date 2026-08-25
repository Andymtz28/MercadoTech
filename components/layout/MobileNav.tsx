"use client";

import Link from "next/link";
import { Menu, Heart, Package, Store, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { SearchBar } from "@/components/layout/SearchBar";
import type { CategoryLink } from "@/components/layout/CategoriesMenu";
import type { NavUser } from "@/components/layout/UserMenu";

interface MobileNavProps {
  categories: CategoryLink[];
  user: NavUser | null;
  onLogout?: () => void;
}

export function MobileNav({ categories, user, onLogout }: MobileNavProps) {
  return (
    <Sheet>
      <SheetTrigger
        render={
          <Button variant="ghost" size="icon" className="md:hidden" aria-label="Abrir menú">
            <Menu className="size-5" aria-hidden="true" />
          </Button>
        }
      />
      <SheetContent side="left" className="w-72 gap-0">
        <SheetHeader>
          <SheetTitle>MercadoTech</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-4 px-4 pb-6">
          <SearchBar />

          <div className="flex flex-col gap-1">
            <p className="px-2 text-xs font-medium text-muted-foreground">Categorías</p>
            {categories.length === 0 ? (
              <p className="px-2 text-sm text-muted-foreground">Sin categorías</p>
            ) : (
              categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/categoria/${category.slug}`}
                  className="rounded-md px-2 py-1.5 text-sm hover:bg-muted"
                >
                  {category.name}
                </Link>
              ))
            )}
          </div>

          <Separator />

          {user ? (
            <div className="flex flex-col gap-1">
              <Link href="/pedidos" className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted">
                <Package className="size-4" aria-hidden="true" /> Mis pedidos
              </Link>
              <Link href="/favoritos" className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted">
                <Heart className="size-4" aria-hidden="true" /> Favoritos
              </Link>
              {(user.role === "seller" || user.role === "admin") && (
                <Link
                  href="/vendedor/productos"
                  className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted"
                >
                  <Store className="size-4" aria-hidden="true" /> Panel de vendedor
                </Link>
              )}
              <button
                onClick={onLogout}
                className="flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-destructive hover:bg-muted"
              >
                <LogOut className="size-4" aria-hidden="true" /> Cerrar sesión
              </button>
            </div>
          ) : (
            <Button nativeButton={false} render={<Link href="/login">Iniciar sesión</Link>} />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
