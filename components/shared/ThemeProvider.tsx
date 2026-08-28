"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ComponentProps } from "react";

// Respeta prefers-color-scheme del sistema operativo (sin toggle todavía;
// el proyecto de shadcn ya trae next-themes como dependencia, solo faltaba
// conectarlo — sin esto, la clase "dark" que define app/globals.css nunca
// se activaba).
export function ThemeProvider({ children, ...props }: ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem {...props}>
      {children}
    </NextThemesProvider>
  );
}
