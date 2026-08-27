"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/shared/EmptyState";
import type { Question } from "@/types/question";

interface QuestionsSectionProps {
  questions: Question[];
  isAuthenticated: boolean;
  isProductOwner: boolean;
  onAsk: (question: string) => Promise<void>;
  onAnswer: (questionId: string, answer: string) => Promise<void>;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" });
}

export function QuestionsSection({
  questions,
  isAuthenticated,
  isProductOwner,
  onAsk,
  onAnswer,
}: QuestionsSectionProps) {
  const [newQuestion, setNewQuestion] = useState("");
  const [asking, setAsking] = useState(false);
  const [answeringId, setAnsweringId] = useState<string | null>(null);
  const [answerText, setAnswerText] = useState("");
  const [submittingAnswer, setSubmittingAnswer] = useState(false);

  async function handleAsk() {
    if (!newQuestion.trim()) return;
    setAsking(true);
    try {
      await onAsk(newQuestion.trim());
      setNewQuestion("");
    } finally {
      setAsking(false);
    }
  }

  async function handleAnswer(questionId: string) {
    if (!answerText.trim()) return;
    setSubmittingAnswer(true);
    try {
      await onAnswer(questionId, answerText.trim());
      setAnsweringId(null);
      setAnswerText("");
    } finally {
      setSubmittingAnswer(false);
    }
  }

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">Preguntas</h2>

      {isAuthenticated && !isProductOwner && (
        <div className="space-y-2">
          <Textarea
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            placeholder="Escribe tu pregunta sobre este producto…"
            aria-label="Nueva pregunta"
          />
          <Button size="sm" onClick={handleAsk} disabled={asking || !newQuestion.trim()}>
            {asking ? "Enviando…" : "Preguntar"}
          </Button>
        </div>
      )}

      {questions.length === 0 ? (
        <EmptyState title="Todavía no hay preguntas" description="Sé el primero en preguntar." />
      ) : (
        <ul className="space-y-4">
          {questions.map((q) => (
            <li key={q.id} className="space-y-1 border-b pb-4 last:border-b-0">
              <p className="text-sm">
                <span className="font-medium">Usuario</span> · {formatDate(q.created_at)}
              </p>
              <p className="text-sm">{q.question}</p>
              {q.answer ? (
                <p className="rounded-md bg-muted p-2 text-sm">
                  <span className="font-medium">Vendedor:</span> {q.answer}
                </p>
              ) : isProductOwner ? (
                answeringId === q.id ? (
                  <div className="space-y-2 pt-1">
                    <Textarea
                      value={answerText}
                      onChange={(e) => setAnswerText(e.target.value)}
                      placeholder="Escribe tu respuesta…"
                      aria-label="Responder pregunta"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleAnswer(q.id)} disabled={submittingAnswer}>
                        {submittingAnswer ? "Guardando…" : "Responder"}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setAnsweringId(null)}>
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => setAnsweringId(q.id)}>
                    Responder
                  </Button>
                )
              ) : (
                <p className="text-sm text-muted-foreground">Sin responder todavía</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
