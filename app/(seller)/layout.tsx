"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { SellerSidebar } from "@/components/layout/SellerSidebar";
import { Container } from "@/components/shared/Container";
import { LoadingState } from "@/components/shared/LoadingState";
import { useAuth } from "@/hooks/useAuth";

// Guard de rol: el middleware ya exige sesión para /vendedor/**, aquí solo
// falta exigir que el rol sea seller/admin (dato que el middleware no puede
// leer sin una consulta extra a profiles).
export default function SellerLayout({ children }: LayoutProps<"/">) {
  const { user, initializing } = useAuth();
  const router = useRouter();

  const allowed = user?.role === "seller" || user?.role === "admin";

  useEffect(() => {
    if (initializing) return;
    if (!allowed) {
      toast.error("Necesitas una cuenta de vendedor para entrar aquí.");
      router.push("/");
    }
  }, [initializing, allowed, router]);

  if (initializing || !allowed) {
    return <LoadingState message="Verificando acceso…" />;
  }

  return (
    <div className="flex min-h-full flex-1">
      <SellerSidebar />
      <main className="flex-1 overflow-x-hidden">
        <Container className="py-8">{children}</Container>
      </main>
    </div>
  );
}
