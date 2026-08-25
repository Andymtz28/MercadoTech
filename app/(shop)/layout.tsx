import { Navbar } from "@/components/layout/Navbar";
import { Container } from "@/components/shared/Container";

// Navbar recibe valores estáticos por ahora (categories=[], user=null,
// cartCount=0); useCategories/useAuth/useCart lo conectan en las fases
// siguientes (3.3, 3.4 y 3.6).
export default function ShopLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-full flex-col">
      <Navbar categories={[]} user={null} cartCount={0} />
      <main className="flex-1">{children}</main>
      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        <Container>MercadoTech — laboratorio del curso Claude Code for Developers</Container>
      </footer>
    </div>
  );
}
