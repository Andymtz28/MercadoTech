import { describe, expect, it } from "vitest";
import { cn, formatPrice, getErrorMessage, getMonogram } from "./utils";

describe("cn", () => {
  it("combina clases básicas", () => {
    expect(cn("a", "b")).toBe("a b");
  });

  it("resuelve conflictos de Tailwind quedándose con la última", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });

  it("ignora valores falsy", () => {
    expect(cn("a", false, null, undefined, "b")).toBe("a b");
  });
});

describe("formatPrice", () => {
  it("formatea 0", () => {
    expect(formatPrice(0)).toBe("$0.00");
  });

  it("redondea a 2 decimales", () => {
    expect(formatPrice(19.999)).toBe("$20.00");
  });

  it("agrega separador de miles", () => {
    expect(formatPrice(18999)).toBe("$18,999.00");
  });

  it("acepta un string numérico (como llega de PostgREST)", () => {
    expect(formatPrice("219.00")).toBe("$219.00");
  });

  it("acepta un number directo", () => {
    expect(formatPrice(219)).toBe("$219.00");
  });
});

describe("getMonogram", () => {
  it("toma las dos primeras letras de una sola palabra", () => {
    expect(getMonogram("Laptops")).toBe("LA");
  });

  it("toma la inicial de las dos primeras palabras significativas", () => {
    expect(getMonogram("Componentes de PC")).toBe("CP");
  });

  it("ignora conectores cortos como 'de'", () => {
    expect(getMonogram("Smart de home")).toBe("SH");
  });

  it("siempre devuelve mayúsculas", () => {
    expect(getMonogram("audio")).toBe("AU");
  });
});

describe("getErrorMessage", () => {
  it("lee .message de un objeto que no es instancia de Error (PostgrestError)", () => {
    const fakePostgrestError = { message: "duplicate key value", code: "23505" };
    expect(getErrorMessage(fakePostgrestError)).toBe("duplicate key value");
  });

  it("lee .message de un Error real", () => {
    expect(getErrorMessage(new Error("algo falló"))).toBe("algo falló");
  });

  it("devuelve el fallback si no hay .message", () => {
    expect(getErrorMessage({}, "mensaje por defecto")).toBe("mensaje por defecto");
  });

  it("devuelve el fallback por defecto si no se especifica uno", () => {
    expect(getErrorMessage(null)).toBe("Ocurrió un error inesperado.");
  });

  it("devuelve el fallback si .message no es string", () => {
    expect(getErrorMessage({ message: 123 })).toBe("Ocurrió un error inesperado.");
  });

  it("devuelve el fallback si .message es string vacío", () => {
    expect(getErrorMessage({ message: "" }, "fallback")).toBe("fallback");
  });
});
