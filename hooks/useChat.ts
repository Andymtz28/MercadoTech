"use client";

import { useCallback, useState } from "react";
import { getErrorMessage } from "@/lib/utils";
import type { ChatMessage, ChatMode } from "@/types/chat";

interface ApiErrorBody {
  error?: { message?: string };
}

// Historial en memoria (se pierde al cerrar el widget/recargar) — la
// conversación NUNCA se rompe: un error del servidor se convierte en un
// mensaje inline del asistente, nunca en una excepción sin manejar.
export function useChat(mode: ChatMode) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);

  const sendMessage = useCallback(
    async (query: string) => {
      const trimmed = query.trim();
      if (!trimmed || loading) return;

      setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
      setLoading(true);

      try {
        const response = await fetch("/api/v1/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: trimmed, mode }),
        });
        const body = (await response.json()) as {
          answer?: string;
          sources?: ChatMessage["sources"];
        } & ApiErrorBody;

        if (!response.ok) {
          throw new Error(body.error?.message ?? "No pude procesar tu consulta.");
        }

        setMessages((prev) => [...prev, { role: "assistant", content: body.answer ?? "", sources: body.sources }]);
      } catch (err) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: getErrorMessage(err, "No pude procesar tu consulta. Intenta de nuevo en un momento.") },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [mode, loading],
  );

  return { messages, sendMessage, loading };
}
