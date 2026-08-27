"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Navbar } from "@/components/layout/Navbar";
import { Container } from "@/components/shared/Container";
import { useAuth } from "@/hooks/useAuth";
import { useCategories } from "@/hooks/useCategories";

// cartCount sigue estático (0); useCart (Fase 3.6) lo conecta más adelante.
export default function ShopLayout({ children }: LayoutProps<"/">) {
  const { user, logout } = useAuth();
  const { categories } = useCategories();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    toast.success("Sesión cerrada");
    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex min-h-full flex-col">
      <Navbar
        categories={categories}
        cartCount={0}
        user={user ? { displayName: user.display_name, email: user.email, role: user.role } : null}
        onLogout={handleLogout}
      />
      <main className="flex-1">{children}</main>
      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        <Container>MercadoTech — laboratorio del curso Claude Code for Developers</Container>
      </footer>
    </div>
  );
}
