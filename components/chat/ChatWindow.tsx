"use client";

import { useEffect, useRef } from "react";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { LoadingMessage } from "@/components/chat/LoadingMessage";
import type { ChatMessage as ChatMessageType } from "@/types/chat";

interface ChatWindowProps {
  messages: ChatMessageType[];
  loading: boolean;
  emptyState?: React.ReactNode;
}

export function ChatWindow({ messages, loading, emptyState }: ChatWindowProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  return (
    <div className="flex-1 space-y-3 overflow-y-auto p-3">
      {messages.length === 0 && !loading ? (
        emptyState
      ) : (
        <>
          {messages.map((message, index) => (
            <ChatMessage key={index} message={message} />
          ))}
          {loading && <LoadingMessage />}
        </>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
