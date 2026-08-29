"use client";

import { useEffect, useState } from "react";
import { getHomeStats, type HomeStats } from "@/services/home.service";

export function useHomeStats() {
  const [stats, setStats] = useState<HomeStats | null>(null);

  useEffect(() => {
    let active = true;
    getHomeStats()
      .then((data) => {
        if (active) setStats(data);
      })
      .catch(() => {
        // El hero degrada a "—" en vez de romper la página por un dato
        // decorativo.
      });
    return () => {
      active = false;
    };
  }, []);

  return stats;
}
