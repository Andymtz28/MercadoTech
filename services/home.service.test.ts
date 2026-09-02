import { describe, expect, it } from "vitest";
import { getHomeStats } from "./home.service";
import { createSupabaseMock } from "./test-utils/supabase-mock";

describe("getHomeStats", () => {
  it("cuenta vendedores DISTINTOS entre los productos activos (no filas)", async () => {
    const supabase = createSupabaseMock({
      tables: {
        products: {
          data: [{ seller_id: "s1" }, { seller_id: "s1" }, { seller_id: "s2" }],
          count: 3,
        },
      },
    });

    const stats = await getHomeStats(supabase);

    expect(stats).toEqual({ activeProductCount: 3, verifiedSellerCount: 2 });
  });

  it("propaga el error", async () => {
    const supabase = createSupabaseMock({ tables: { products: { data: null, error: { message: "falló" } } } });
    await expect(getHomeStats(supabase)).rejects.toEqual({ message: "falló" });
  });
});
