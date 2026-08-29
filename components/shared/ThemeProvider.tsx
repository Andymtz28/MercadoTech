"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ComponentProps } from "react";

// El diseño de la Fase de UX es 100% oscuro (no define modo claro) — se
// fuerza "dark" siempre. Se mantiene next-themes (en vez de solo la clase
// "dark" en <html>) porque el Toaster de sonner lee su tema vía useTheme().
export function ThemeProvider({ children, ...props }: ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider attribute="class" forcedTheme="dark" {...props}>
      {children}
    </NextThemesProvider>
  );
}
