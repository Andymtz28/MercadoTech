import { afterEach, describe, expect, it, vi } from "vitest";
import { triggerReindex } from "./indexing-trigger.service";

// No usa el cliente de Supabase (fetch directo al propio endpoint) — el
// único mock de esta suite es fetch, no lib/ai ni Supabase.
describe("triggerReindex", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("POSTea sourceType y sourceId a /api/v1/reindex", async () => {
    const fetchMock = vi.fn(async () => new Response(null, { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await triggerReindex("producto", "p1");

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/reindex",
      expect.objectContaining({ method: "POST", body: JSON.stringify({ sourceType: "producto", sourceId: "p1" }) }),
    );
  });

  it("nunca lanza si la respuesta no es ok (solo advierte)", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 500 })));
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    await expect(triggerReindex("producto", "p1")).resolves.toBeUndefined();
    expect(warnSpy).toHaveBeenCalled();
  });

  it("nunca lanza si fetch rechaza (red caída) — solo advierte", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("network error");
      }),
    );
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    await expect(triggerReindex("articulo_soporte", "a1")).resolves.toBeUndefined();
    expect(warnSpy).toHaveBeenCalled();
  });
});
