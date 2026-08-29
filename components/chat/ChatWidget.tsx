"use client";

import { useState } from "react";
import { Bot, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useChat } from "@/hooks/useChat";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { ChatInput } from "@/components/chat/ChatInput";
import { cn } from "@/lib/utils";
import type { ChatMode } from "@/types/chat";

const MODES: { value: ChatMode; label: string; placeholder: string; empty: string }[] = [
  {
    value: "compras",
    label: "Comprar",
    placeholder: "¿Qué producto buscas?",
    empty: "Pregúntame qué producto te conviene, por ejemplo: “laptop liviana para la universidad”.",
  },
  {
    value: "soporte",
    label: "Soporte",
    placeholder: "¿En qué necesitas ayuda?",
    empty: "Pregúntame sobre envíos, devoluciones o garantías.",
  },
];

// Widget flotante disponible en toda la tienda (no páginas dedicadas): un
// botón fijo abajo a la derecha abre un panel chico sin cubrir la pantalla.
// La IA exige sesión (decisión 1) — sin usuario, no se renderiza nada.
export function ChatWidget() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<ChatMode>("compras");
  const chats = {
    compras: useChat("compras"),
    soporte: useChat("soporte"),
  };
  const active = chats[mode];
  const activeMode = MODES.find((m) => m.value === mode)!;

  if (!user) return null;

  return (
    <div className="fixed right-4 bottom-4 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="flex h-[520px] max-h-[75vh] w-[360px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
          <div className="flex items-center justify-between border-b border-border p-3">
            <div className="flex items-center gap-2">
              <Bot className="size-5 text-primary" />
              <span className="text-sm font-semibold">Asistente IA</span>
            </div>
            <Button variant="ghost" size="icon-sm" onClick={() => setOpen(false)} aria-label="Cerrar asistente">
              <X />
            </Button>
          </div>

          <div className="flex gap-1 border-b border-border p-2">
            {MODES.map((m) => (
              <button
                key={m.value}
                type="button"
                onClick={() => setMode(m.value)}
                className={cn(
                  "flex-1 rounded-md px-2 py-1 text-xs font-medium transition-colors",
                  mode === m.value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted",
                )}
              >
                {m.label}
              </button>
            ))}
          </div>

          <ChatWindow
            messages={active.messages}
            loading={active.loading}
            emptyState={<p className="p-2 text-center text-sm text-muted-foreground">{activeMode.empty}</p>}
          />
          <ChatInput onSend={active.sendMessage} disabled={active.loading} placeholder={activeMode.placeholder} />
        </div>
      )}

      <Button
        onClick={() => setOpen((v) => !v)}
        className="gap-2 rounded-full px-4 py-5 shadow-lg"
        aria-label={open ? "Cerrar Asistente IA" : "Abrir Asistente IA"}
      >
        <Bot />
        Asistente IA
      </Button>
    </div>
  );
}
