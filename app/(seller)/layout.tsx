import { SellerSidebar } from "@/components/layout/SellerSidebar";
import { Container } from "@/components/shared/Container";

// Punto de extensión (Fase 3.3): aquí se conecta el guard de rol —
// redirigir a "/" con un toast si el usuario autenticado no es
// seller/admin. No implementado todavía, solo el layout visual.
export default function SellerLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-full flex-1">
      <SellerSidebar />
      <main className="flex-1 overflow-x-hidden">
        <Container className="py-8">{children}</Container>
      </main>
    </div>
  );
}
