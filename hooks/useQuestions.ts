"use client";

import { useCallback, useEffect, useState } from "react";
import { getErrorMessage } from "@/lib/utils";
import { answerQuestion, askQuestion, listQuestions } from "@/services/question.service";
import type { Question } from "@/types/question";

export function useQuestions(productId: string) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listQuestions(productId);
      setQuestions(data);
    } catch (err) {
      setError(getErrorMessage(err, "No se pudieron cargar las preguntas."));
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    reload();
  }, [reload]);

  const ask = useCallback(
    async (userId: string, question: string) => {
      await askQuestion({ productId, userId, question });
      await reload();
    },
    [productId, reload],
  );

  const answer = useCallback(
    async (questionId: string, answerText: string) => {
      await answerQuestion(questionId, answerText);
      await reload();
    },
    [reload],
  );

  return { questions, loading, error, ask, answer, reload };
}
