import { HUGGINGFACE_CHAT_MAX_TOKENS, HUGGINGFACE_CHAT_MODEL_DEFAULT } from "@/lib/constants/ai";

const ROUTER_URL = "https://router.huggingface.co/v1/chat/completions";

export interface CompletionResult {
  text: string;
  model: string;
  stopReason: string | null;
}

interface ChatCompletionResponse {
  choices?: { message?: { content?: string }; finish_reason?: string }[];
}

// Único lugar del proyecto que arma la llamada de chat. A diferencia de los
// embeddings, el chat va SOLO por fetch al router OpenAI-compatible — no
// hay soporte de chat completions en el SDK de @huggingface/inference para
// este flujo, y el router sí lo expone directo.
export async function generateCompletion(system: string, user: string): Promise<CompletionResult> {
  const token = process.env.HUGGINGFACEHUB_API_TOKEN;
  if (!token) {
    throw new Error("HUGGINGFACEHUB_API_TOKEN no está configurada.");
  }

  const model = process.env.HUGGINGFACE_CHAT_MODEL || HUGGINGFACE_CHAT_MODEL_DEFAULT;

  const response = await fetch(ROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: HUGGINGFACE_CHAT_MAX_TOKENS,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });

  if (response.status === 401) {
    throw new Error("Hugging Face rechazó el token (401): revisa HUGGINGFACEHUB_API_TOKEN.");
  }

  const bodyText = await response.text();

  if (!response.ok) {
    if (bodyText.toLowerCase().includes("not supported") || bodyText.toLowerCase().includes("no provider")) {
      throw new Error(
        `El modelo "${model}" ya no está disponible en el nivel gratuito. Cambia HUGGINGFACE_CHAT_MODEL por otro candidato.`,
      );
    }
    throw new Error(`Hugging Face devolvió un error (${response.status}): ${bodyText.slice(0, 300)}`);
  }

  let data: ChatCompletionResponse;
  try {
    data = JSON.parse(bodyText);
  } catch {
    throw new Error("Respuesta de Hugging Face inválida: no es JSON.");
  }

  const choice = data.choices?.[0];
  const text = choice?.message?.content;
  if (!text) {
    throw new Error("Respuesta de Hugging Face inválida: sin contenido en choices[0].message.");
  }

  return { text, model, stopReason: choice.finish_reason ?? null };
}
