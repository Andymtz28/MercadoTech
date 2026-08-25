import Link from "next/link";
import { Package, PlusCircle, ClipboardList, ArrowLeft } from "lucide-react";
import { NavLink } from "@/components/layout/NavLink";

const LINKS = [
  { href: "/vendedor/productos", label: "Productos", icon: Package },
  { href: "/vendedor/publicar", label: "Publicar producto", icon: PlusCircle },
  { href: "/vendedor/pedidos", label: "Pedidos", icon: ClipboardList },
];

export function SellerSidebar() {
  return (
    <nav className="flex h-full w-56 shrink-0 flex-col gap-1 border-r p-4" aria-label="Panel de vendedor">
      <p className="mb-2 px-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        Panel de vendedor
      </p>
      {LINKS.map(({ href, label, icon: Icon }) => (
        <NavLink key={href} href={href} className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted">
          <Icon className="size-4" aria-hidden="true" />
          {label}
        </NavLink>
      ))}
      <Link
        href="/"
        className="mt-4 flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Volver a la tienda
      </Link>
    </nav>
  );
}
