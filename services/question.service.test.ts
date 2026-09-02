import { describe, expect, it } from "vitest";
import { answerQuestion, askQuestion, listQuestions } from "./question.service";
import { createSupabaseMock } from "./test-utils/supabase-mock";

describe("question.service", () => {
  it("listQuestions: caso feliz devuelve las preguntas", async () => {
    const supabase = createSupabaseMock({ tables: { questions: { data: [{ id: "q1" }] } } });
    expect(await listQuestions("p1", supabase)).toEqual([{ id: "q1" }]);
  });

  it("listQuestions: propaga el error", async () => {
    const supabase = createSupabaseMock({ tables: { questions: { data: null, error: { message: "falló" } } } });
    await expect(listQuestions("p1", supabase)).rejects.toEqual({ message: "falló" });
  });

  it("askQuestion: caso feliz, no lanza", async () => {
    const supabase = createSupabaseMock({ tables: { questions: { data: null, error: null } } });
    await expect(askQuestion({ productId: "p1", userId: "u1", question: "¿tiene garantía?" }, supabase)).resolves.toBeUndefined();
  });

  it("askQuestion: propaga el error", async () => {
    const supabase = createSupabaseMock({ tables: { questions: { data: null, error: { message: "no autorizado" } } } });
    await expect(
      askQuestion({ productId: "p1", userId: "u1", question: "¿tiene garantía?" }, supabase),
    ).rejects.toEqual({ message: "no autorizado" });
  });

  it("answerQuestion: caso feliz, no lanza", async () => {
    const supabase = createSupabaseMock({ tables: { questions: { data: null, error: null } } });
    await expect(answerQuestion("q1", "Sí, 1 año.", supabase)).resolves.toBeUndefined();
  });

  it("answerQuestion: propaga el error", async () => {
    const supabase = createSupabaseMock({ tables: { questions: { data: null, error: { message: "no eres el vendedor" } } } });
    await expect(answerQuestion("q1", "Sí", supabase)).rejects.toEqual({ message: "no eres el vendedor" });
  });
});
