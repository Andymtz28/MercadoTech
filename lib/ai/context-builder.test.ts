import { describe, expect, it } from "vitest";
import { buildContext, type ContextCandidate } from "./context-builder";
import { CONTEXT_BUILDER_DEFAULT_MAX_SOURCES, CONTEXT_BUILDER_DEFAULT_MIN_SIMILARITY } from "@/lib/constants/ai";

function candidate(overrides: Partial<ContextCandidate> = {}): ContextCandidate {
  return {
    sourceType: "producto",
    sourceId: "id",
    title: "Título",
    content: "Contenido de prueba con longitud suficiente para pasar el mínimo.",
    similarity: 0.5,
    ...overrides,
  };
}

describe("buildContext — selección", () => {
  it("filtra candidatos bajo la similitud mínima", () => {
    const result = buildContext("q", [candidate({ sourceId: "a", similarity: 0.1 })], { minSimilarity: 0.3 });
    expect(result.sources).toHaveLength(0);
  });

  it("filtra candidatos con contenido más corto que el mínimo", () => {
    const result = buildContext("q", [candidate({ sourceId: "a", content: "corto" })], { minContentLength: 20 });
    expect(result.sources).toHaveLength(0);
  });

  it("respeta maxSources aunque haya más candidatos válidos", () => {
    const candidates = [
      candidate({ sourceId: "a", similarity: 0.9 }),
      candidate({ sourceId: "b", similarity: 0.8 }),
      candidate({ sourceId: "c", similarity: 0.7 }),
    ];
    const result = buildContext("q", candidates, { maxSources: 2 });
    expect(result.sources.map((s) => s.sourceId)).toEqual(["a", "b"]);
  });

  it("ordena por similitud descendente sin importar el orden de entrada", () => {
    const candidates = [
      candidate({ sourceId: "low", similarity: 0.4 }),
      candidate({ sourceId: "high", similarity: 0.9 }),
      candidate({ sourceId: "mid", similarity: 0.6 }),
    ];
    const result = buildContext("q", candidates);
    expect(result.sources.map((s) => s.sourceId)).toEqual(["high", "mid", "low"]);
  });

  it("lista vacía → sources vacío, sin truncar, 0 caracteres", () => {
    const result = buildContext("q", []);
    expect(result.sources).toEqual([]);
    expect(result.stats).toEqual({ contextTruncated: false, totalChars: 0 });
  });

  it("todos los candidatos bajo el umbral → sources vacío", () => {
    const candidates = [candidate({ similarity: 0.05 }), candidate({ similarity: 0.1 })];
    const result = buildContext("q", candidates, { minSimilarity: 0.3 });
    expect(result.sources).toEqual([]);
  });

  it("usa los valores por defecto de lib/constants/ai cuando no se pasan opciones", () => {
    const justBelowDefault = candidate({ similarity: CONTEXT_BUILDER_DEFAULT_MIN_SIMILARITY - 0.01 });
    expect(buildContext("q", [justBelowDefault]).sources).toHaveLength(0);

    const manyAboveDefault = Array.from({ length: CONTEXT_BUILDER_DEFAULT_MAX_SOURCES + 3 }, (_, i) =>
      candidate({ sourceId: `s${i}`, similarity: 0.9 - i * 0.01 }),
    );
    expect(buildContext("q", manyAboveDefault).sources).toHaveLength(CONTEXT_BUILDER_DEFAULT_MAX_SOURCES);
  });
});

describe("buildContext — presupuesto de caracteres", () => {
  it("acumula fuentes completas mientras entren en el presupuesto", () => {
    const candidates = [
      candidate({ sourceId: "a", content: "a".repeat(100), similarity: 0.9 }),
      candidate({ sourceId: "b", content: "b".repeat(100), similarity: 0.8 }),
    ];
    const result = buildContext("q", candidates, { maxContextChars: 300, minTruncatedSourceChars: 20 });
    expect(result.sources.map((s) => s.sourceId)).toEqual(["a", "b"]);
    expect(result.stats).toEqual({ contextTruncated: false, totalChars: 200 });
  });

  it("descarta ENTERA la fuente que no cabe si el espacio restante es menor al mínimo truncado", () => {
    const candidates = [
      candidate({ sourceId: "a", content: "a".repeat(90), similarity: 0.9 }),
      candidate({ sourceId: "b", content: "b".repeat(50), similarity: 0.8 }),
    ];
    // quedan 10 caracteres de presupuesto tras "a" — menos que minTruncatedSourceChars (20): "b" se descarta entera.
    const result = buildContext("q", candidates, { maxContextChars: 100, minTruncatedSourceChars: 20 });
    expect(result.sources.map((s) => s.sourceId)).toEqual(["a"]);
    expect(result.stats.contextTruncated).toBe(true);
    expect(result.stats.totalChars).toBe(90);
  });

  it("trunca (no descarta) la fuente cuando el espacio restante alcanza el mínimo truncado", () => {
    const candidates = [
      candidate({ sourceId: "a", content: "a".repeat(70), similarity: 0.9 }),
      candidate({ sourceId: "b", content: "b".repeat(50), similarity: 0.8 }),
    ];
    // quedan 30 caracteres tras "a" — alcanza minTruncatedSourceChars (20): "b" entra truncada a 30.
    const result = buildContext("q", candidates, { maxContextChars: 100, minTruncatedSourceChars: 20 });
    expect(result.sources.map((s) => s.sourceId)).toEqual(["a", "b"]);
    expect(result.stats.contextTruncated).toBe(true);
    expect(result.stats.totalChars).toBe(100);
  });

  it("descarta toda fuente adicional una vez que el presupuesto llega exactamente a 0", () => {
    const candidates = [
      candidate({ sourceId: "a", content: "a".repeat(100), similarity: 0.9 }),
      // 25 chars: por encima del CONTEXT_BUILDER_MIN_CONTENT_LENGTH real
      // (20) para que sobreviva la selección y llegue al presupuesto.
      candidate({ sourceId: "b", content: "b".repeat(25), similarity: 0.8 }),
    ];
    // "a" consume el presupuesto completo (100/100): al llegar a "b" el
    // remaining ya es 0, se descarta sin intentar truncarla.
    const result = buildContext("q", candidates, { maxContextChars: 100, minTruncatedSourceChars: 5 });
    expect(result.sources.map((s) => s.sourceId)).toEqual(["a"]);
    expect(result.stats).toEqual({ contextTruncated: true, totalChars: 100 });
  });

  it("contextTruncated es false cuando todo cupo sin recortes", () => {
    const result = buildContext("q", [candidate({ content: "corto pero suficiente" })], { maxContextChars: 8000 });
    expect(result.stats.contextTruncated).toBe(false);
  });

  it("el userMessage numera las fuentes en el orden final y contiene la query", () => {
    const candidates = [
      candidate({ sourceId: "a", content: "Contenido A largo y suficiente.", similarity: 0.9 }),
      candidate({ sourceId: "b", content: "Contenido B largo y suficiente.", similarity: 0.8 }),
    ];
    const result = buildContext("¿qué laptop me recomiendas?", candidates);
    expect(result.userMessage).toContain("¿qué laptop me recomiendas?");
    expect(result.userMessage).toContain("[1] Contenido A largo y suficiente.");
    expect(result.userMessage).toContain("[2] Contenido B largo y suficiente.");
  });

  it("sources conserva sourceType, sourceId, title y similarity", () => {
    const result = buildContext("q", [
      candidate({ sourceType: "articulo_soporte", sourceId: "art-1", title: "Devoluciones", similarity: 0.42 }),
    ]);
    expect(result.sources[0]).toEqual({
      sourceType: "articulo_soporte",
      sourceId: "art-1",
      title: "Devoluciones",
      similarity: 0.42,
    });
  });
});
