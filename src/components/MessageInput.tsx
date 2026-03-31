"use client";

import { useState, useTransition, useRef } from "react";
import { sendMessage } from "@/app/actions";

interface MessageInputProps {
  podId: string;
  onSend?: (content: string) => void;
}

export default function MessageInput({ podId, onSend }: MessageInputProps) {
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleSend() {
    const trimmed = content.trim();
    if (!trimmed || isPending) return;

    setError(null);
    const snapshot = trimmed;
    setContent("");
    // Reset height
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    onSend?.(snapshot);

    startTransition(async () => {
      const result = await sendMessage(podId, snapshot);
      if (result?.error) {
        setError(result.error);
        setContent(snapshot);
      }
    });

    textareaRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="px-4 py-3">
      {error && <p className="mb-1.5 text-xs text-destructive">{error}</p>}
      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message…"
          rows={1}
          disabled={isPending}
          className="max-h-32 min-h-[38px] flex-1 resize-none rounded-xl border border-input bg-card px-3.5 py-2 text-sm leading-relaxed outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 disabled:opacity-60 dark:bg-muted/30"
          onInput={(e) => {
            const el = e.currentTarget;
            el.style.height = "auto";
            el.style.height = Math.min(el.scrollHeight, 128) + "px";
          }}
        />
        <button
          onClick={handleSend}
          disabled={isPending || !content.trim()}
          className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-35"
          aria-label="Send message"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="size-4"
          >
            <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
