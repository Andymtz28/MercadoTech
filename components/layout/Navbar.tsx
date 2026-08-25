import Link from "next/link";
import { Container } from "@/components/shared/Container";
import { SearchBar } from "@/components/layout/SearchBar";
import { CategoriesMenu, type CategoryLink } from "@/components/layout/CategoriesMenu";
import { CartIndicator } from "@/components/layout/CartIndicator";
import { UserMenu, type NavUser } from "@/components/layout/UserMenu";
import { MobileNav } from "@/components/layout/MobileNav";

interface NavbarProps {
  categories: CategoryLink[];
  user: NavUser | null;
  cartCount: number;
  onLogout?: () => void;
}

export function Navbar({ categories, user, cartCount, onLogout }: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <Container className="flex h-16 items-center gap-4">
        <MobileNav categories={categories} user={user} onLogout={onLogout} />

        <Link href="/" className="text-lg font-bold whitespace-nowrap">
          MercadoTech
        </Link>

        <div className="hidden md:block">
          <CategoriesMenu categories={categories} />
        </div>

        <div className="hidden flex-1 md:block">
          <SearchBar className="max-w-md" />
        </div>

        <div className="ml-auto flex items-center gap-2">
          <CartIndicator count={cartCount} />
          <div className="hidden md:block">
            <UserMenu user={user} onLogout={onLogout} />
          </div>
        </div>
      </Container>
    </header>
  );
}
