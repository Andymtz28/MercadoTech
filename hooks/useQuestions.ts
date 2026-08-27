"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { answerQuestion, askQuestion, listQuestions } from "@/services/question.service";
import type { Question } from "@/types/question";

export function useQuestions(productId: string) {
  const supabase = useRef(createClient()).current;
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listQuestions(productId, supabase);
      setQuestions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar las preguntas.");
    } finally {
      setLoading(false);
    }
  }, [productId, supabase]);

  useEffect(() => {
    reload();
  }, [reload]);

  const ask = useCallback(
    async (userId: string, question: string) => {
      await askQuestion({ productId, userId, question }, supabase);
      await reload();
    },
    [productId, supabase, reload],
  );

  const answer = useCallback(
    async (questionId: string, answerText: string) => {
      await answerQuestion(questionId, answerText, supabase);
      await reload();
    },
    [supabase, reload],
  );

  return { questions, loading, error, ask, answer, reload };
}
