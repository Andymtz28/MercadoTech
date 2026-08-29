import { cn } from "@/lib/utils";

interface MonogramBadgeProps {
  text: string;
  size?: number;
  className?: string;
}

// El diseño no usa librería de iconos: identidad de categoría/vendedor se
// resuelve con un monograma de 2 letras sobre un cuadro verde suave
// (diseño/README.md → Assets → Iconos).
export function MonogramBadge({ text, size = 38, className }: MonogramBadgeProps) {
  return (
    <div
      className={cn("flex shrink-0 items-center justify-center rounded-lg bg-brand-soft font-heading font-extrabold text-primary", className)}
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {text.slice(0, 2).toUpperCase()}
    </div>
  );
}
