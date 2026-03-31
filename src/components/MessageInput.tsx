"use client";

import { useState, useTransition, useRef } from "react";
import { sendMessage } from "@/app/actions";

const MIN_LENGTH = 50;

interface MessageInputProps {
  podId: string;
  onSend?: (content: string) => void;
  consecutiveBlocked?: boolean;
}

export default function MessageInput({
  podId,
  onSend,
  consecutiveBlocked = false,
}: MessageInputProps) {
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const trimmedLength = content.trim().length;
  const isLengthOk = trimmedLength >= MIN_LENGTH;
  const canSend = isLengthOk && !consecutiveBlocked && !isPending;

  function handleSend() {
    if (!canSend) return;

    setError(null);
    const snapshot = content.trim();
    setContent("");
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
      {/* Server error */}
      {error && <p className="mb-1.5 text-xs text-destructive">{error}</p>}

      {/* Consecutive blocked notice */}
      {consecutiveBlocked && (
        <p className="mb-1.5 text-xs text-muted-foreground/70">
          let someone else jump in first
        </p>
      )}

      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message…"
          rows={1}
          disabled={isPending || consecutiveBlocked}
          className="max-h-32 min-h-[38px] flex-1 resize-none rounded-xl border border-input bg-card px-3.5 py-2 text-sm leading-relaxed outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 disabled:opacity-60 dark:bg-muted/30"
          onInput={(e) => {
            const el = e.currentTarget;
            el.style.height = "auto";
            el.style.height = Math.min(el.scrollHeight, 128) + "px";
          }}
        />
        <button
          onClick={handleSend}
          disabled={!canSend}
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

      {/* Character counter / length hint — shown while typing */}
      {content.length > 0 && !consecutiveBlocked && (
        <div className="mt-1.5 flex items-center justify-between px-0.5">
          <span
            className="text-xs text-muted-foreground/60 transition-opacity"
            style={{ opacity: isLengthOk ? 0 : 1 }}
          >
            add a little more…
          </span>
          <span
            className={`text-xs tabular-nums transition-colors ${
              isLengthOk ? "text-muted-foreground/40" : "text-destructive/70"
            }`}
          >
            {trimmedLength} / {MIN_LENGTH}
          </span>
        </div>
      )}
    </div>
  );
}
