import { describe, expect, it } from "vitest";
import { canAdvance } from "./useSellerOrders";

describe("canAdvance", () => {
  it("acepta los 3 pasos válidos del flujo", () => {
    expect(canAdvance("pendiente", "pagado")).toBe(true);
    expect(canAdvance("pagado", "enviado")).toBe(true);
    expect(canAdvance("enviado", "entregado")).toBe(true);
  });

  it("rechaza saltos hacia adelante (más de un paso)", () => {
    expect(canAdvance("pendiente", "enviado")).toBe(false);
    expect(canAdvance("pendiente", "entregado")).toBe(false);
    expect(canAdvance("pagado", "entregado")).toBe(false);
  });

  it("rechaza retrocesos", () => {
    expect(canAdvance("pagado", "pendiente")).toBe(false);
    expect(canAdvance("entregado", "enviado")).toBe(false);
  });

  it("rechaza quedarse en el mismo estado", () => {
    expect(canAdvance("pagado", "pagado")).toBe(false);
  });

  it("'cancelado' nunca es un destino válido para el vendedor", () => {
    expect(canAdvance("pendiente", "cancelado")).toBe(false);
    expect(canAdvance("pagado", "cancelado")).toBe(false);
    expect(canAdvance("entregado", "cancelado")).toBe(false);
  });

  // comportamiento actual, revisar (hallazgo de la Fase 6.3): la función
  // usa ORDER_STATUS_FLOW.indexOf(to) === ORDER_STATUS_FLOW.indexOf(from) + 1.
  // indexOf devuelve -1 para cualquier valor fuera de ORDER_STATUS_FLOW
  // (incluido "cancelado", que no está en el arreglo) — y -1 + 1 = 0, que es
  // exactamente el índice de "pendiente". Resultado: un pedido cancelado (o
  // con cualquier status desconocido) SÍ "avanza" a "pendiente" según este
  // helper, contradiciendo la intención documentada ("cancelado no se
  // reactiva"). No se corrige en esta fase (Restricciones de la sesión):
  // se documenta aquí y en la bitácora.
  it("comportamiento actual: 'cancelado' → 'pendiente' se acepta por un artefacto de indexOf (bug real, no corregido en esta fase)", () => {
    expect(canAdvance("cancelado", "pendiente")).toBe(true);
  });

  it("comportamiento actual: un status desconocido → 'pendiente' también se acepta por el mismo artefacto", () => {
    expect(canAdvance("desconocido" as never, "pendiente")).toBe(true);
  });

  it("un status desconocido hacia cualquier otro destino válido SÍ se rechaza", () => {
    expect(canAdvance("desconocido" as never, "pagado")).toBe(false);
    expect(canAdvance("desconocido" as never, "enviado")).toBe(false);
  });
});
