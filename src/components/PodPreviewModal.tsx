"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { formatTimeRemaining, formatMessageTime } from "@/lib/utils";
import { getPreviewMessages, joinPod } from "@/app/actions";
import type { PodWithCount, PreviewMessage } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

interface PodPreviewModalProps {
  pod: PodWithCount;
  isJoined: boolean;
  userId: string | null;
  onClose: () => void;
}

export default function PodPreviewModal({
  pod,
  isJoined,
  userId,
  onClose,
}: PodPreviewModalProps) {
  const [visible, setVisible] = useState(false);
  const [messages, setMessages] = useState<PreviewMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joinPending, startJoinTransition] = useTransition();

  const memberCount = pod.pod_members?.[0]?.count ?? 0;
  const isFull = memberCount >= pod.max_members;
  const timeLeft = formatTimeRemaining(pod.expires_at);

  // Entrance animation on next frame
  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // Escape to close
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") dismiss();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch first 3 messages
  useEffect(() => {
    getPreviewMessages(pod.id).then((result) => {
      setMessages(result.messages);
      setLoading(false);
    });
  }, [pod.id]);

  function dismiss() {
    setVisible(false);
    setTimeout(onClose, 150);
  }

  function handleJoin() {
    setJoinError(null);
    startJoinTransition(async () => {
      const result = await joinPod(pod.id);
      if (result?.error) setJoinError(result.error);
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        backgroundColor: visible ? "rgba(0,0,0,0.65)" : "rgba(0,0,0,0)",
        backdropFilter: visible ? "blur(6px)" : "blur(0px)",
        transition: "background-color 150ms ease, backdrop-filter 150ms ease",
      }}
      onClick={dismiss}
    >
      <div
        className="w-full max-w-sm overflow-hidden rounded-2xl bg-card shadow-2xl ring-1 ring-border"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "scale(1) translateY(0)" : "scale(0.96) translateY(10px)",
          transition: "opacity 150ms ease, transform 150ms ease",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 pb-4">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <Badge variant="default">{pod.tag}</Badge>
              <span className="text-xs font-medium text-primary">{timeLeft}</span>
            </div>
            <button
              onClick={dismiss}
              aria-label="Close preview"
              className="rounded-md p-0.5 text-muted-foreground/40 transition-colors hover:text-foreground"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4">
                <path d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22Z" />
              </svg>
            </button>
          </div>
          <h2 className="text-base font-semibold leading-snug">{pod.title}</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {memberCount}/{pod.max_members} members
          </p>
        </div>

        {/* Message preview — fixed height with frosted gradient over bottom */}
        <div className="relative h-48 overflow-hidden border-y border-border px-5 py-4">
          {loading ? (
            <div className="space-y-4">
              {([65, 80, 50] as const).map((w, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="h-2.5 w-12 animate-pulse rounded bg-muted" />
                  <div
                    className="h-4 animate-pulse rounded bg-muted"
                    style={{ width: `${w}%` }}
                  />
                </div>
              ))}
            </div>
          ) : messages.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-sm italic text-muted-foreground/60">
                No messages yet — be the first.
              </p>
            </div>
          ) : (
            <div>
              {messages.map((msg) => (
                <div key={msg.id} className="mb-4 last:mb-0">
                  <p className="mb-0.5 text-[11px] font-medium text-muted-foreground/60">
                    @{msg.profiles?.username ?? "Unknown"}&nbsp;&middot;&nbsp;
                    {formatMessageTime(msg.created_at)}
                  </p>
                  <p className="text-sm leading-relaxed text-foreground/80">
                    {msg.content}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Frosted gradient — covers lower ~60% of message area */}
          {!loading && messages.length > 0 && (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-card" />
          )}
        </div>

        {/* CTA */}
        <div className="p-4">
          {joinError && (
            <p className="mb-2 text-center text-xs text-destructive">{joinError}</p>
          )}
          {isJoined ? (
            <Link
              href={`/pods/${pod.id}`}
              className="flex w-full items-center justify-center rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/80"
            >
              Open Pod →
            </Link>
          ) : isFull ? (
            <p className="py-1 text-center text-sm text-muted-foreground">
              Pod is full
            </p>
          ) : userId ? (
            <button
              onClick={handleJoin}
              disabled={joinPending}
              className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {joinPending ? "Joining…" : "Join this Pod"}
            </button>
          ) : (
            <Link
              href="/login"
              className="flex w-full items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              Sign in to join
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
