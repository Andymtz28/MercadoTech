"use client";

import { useEffect, useState } from "react";
import { listBrandCounts, type BrandCount } from "@/services/product.service";

export function useBrandCounts() {
  const [brands, setBrands] = useState<BrandCount[]>([]);

  useEffect(() => {
    let active = true;
    listBrandCounts()
      .then((data) => {
        if (active) setBrands(data);
      })
      .catch(() => {
        // Sidebar decorativo: si falla, simplemente no se muestran marcas.
      });
    return () => {
      active = false;
    };
  }, []);

  return brands;
}
