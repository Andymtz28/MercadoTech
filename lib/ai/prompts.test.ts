import { describe, expect, it } from "vitest";
import { buildRagUserMessage, SHOPPING_SYSTEM_INSTRUCTIONS, SUPPORT_SYSTEM_INSTRUCTIONS } from "./prompts";

describe("buildRagUserMessage", () => {
  it("incluye la pregunta del usuario", () => {
    const message = buildRagUserMessage("¿cómo devuelvo un producto?", []);
    expect(message).toContain("¿cómo devuelvo un producto?");
  });

  it("numera las fuentes en el orden recibido", () => {
    const message = buildRagUserMessage("q", [
      { index: 1, content: "Primera fuente." },
      { index: 2, content: "Segunda fuente." },
    ]);
    expect(message).toContain("[1] Primera fuente.");
    expect(message).toContain("[2] Segunda fuente.");
  });

  it("sin fuentes, avisa que no hay contexto relevante en vez de omitirlo en silencio", () => {
    const message = buildRagUserMessage("q", []);
    expect(message.toLowerCase()).toContain("no hay fuentes relevantes");
  });
});

describe("SHOPPING_SYSTEM_INSTRUCTIONS", () => {
  it("prohíbe recomendar fuera del contexto dado", () => {
    expect(SHOPPING_SYSTEM_INSTRUCTIONS).toMatch(/ÚNICAMENTE/);
  });
});

describe("SUPPORT_SYSTEM_INSTRUCTIONS", () => {
  it("incluye la instrucción de sugerir un ticket cuando el contexto no responde", () => {
    expect(SUPPORT_SYSTEM_INSTRUCTIONS.toLowerCase()).toContain("ticket");
  });
});
