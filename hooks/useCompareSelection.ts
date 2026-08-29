"use client";

import { useCallback, useState } from "react";

// Máximo 3 productos: al marcar un cuarto se descarta el más antiguo
// (diseño/README.md § Comparación).
const MAX_COMPARE = 3;

export function useCompareSelection() {
  const [ids, setIds] = useState<string[]>([]);

  const toggle = useCallback((id: string) => {
    setIds((prev) => {
      if (prev.includes(id)) return prev.filter((existing) => existing !== id);
      const next = [...prev, id];
      return next.length > MAX_COMPARE ? next.slice(next.length - MAX_COMPARE) : next;
    });
  }, []);

  const clear = useCallback(() => setIds([]), []);

  return { ids, toggle, clear };
}
