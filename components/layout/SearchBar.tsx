import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface SearchBarProps {
  defaultValue?: string;
  className?: string;
}

// Formulario GET nativo: navega a /buscar?q=... sin JS. La página /buscar
// (Fase 3.4) lee el searchParam y ejecuta la búsqueda.
export function SearchBar({ defaultValue, className }: SearchBarProps) {
  return (
    <form action="/buscar" method="GET" role="search" className={className}>
      <div className="relative">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          type="search"
          name="q"
          defaultValue={defaultValue}
          placeholder="Buscar productos…"
          aria-label="Buscar productos"
          className="pl-9"
        />
      </div>
    </form>
  );
}
