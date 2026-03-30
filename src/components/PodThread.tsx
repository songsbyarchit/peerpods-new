"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { formatTimeRemaining, isPodExpired, formatMessageTime } from "@/lib/utils";
import MessageInput from "@/components/MessageInput";
import type { Message, Pod } from "@/lib/types";

interface PodThreadProps {
  pod: Pod;
  initialMessages: Message[];
  memberCount: number;
  userId: string | null;
  isMember: boolean;
}

export default function PodThread({
  pod,
  initialMessages,
  memberCount,
  userId,
  isMember,
}: PodThreadProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [timeLeft, setTimeLeft] = useState(() => formatTimeRemaining(pod.expires_at));
  const [expired, setExpired] = useState(() => isPodExpired(pod.expires_at));
  const [currentMemberCount, setCurrentMemberCount] = useState(memberCount);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isInitialLoad = useRef(true);
  const supabase = createClient();

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(formatTimeRemaining(pod.expires_at));
      setExpired(isPodExpired(pod.expires_at));
    }, 60000);
    return () => clearInterval(timer);
  }, [pod.expires_at]);

  // Scroll to bottom — instant on load, smooth for new messages
  useEffect(() => {
    if (isInitialLoad.current) {
      messagesEndRef.current?.scrollIntoView();
      isInitialLoad.current = false;
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`pod-messages-${pod.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `pod_id=eq.${pod.id}`,
        },
        async (payload) => {
          const newMsg = payload.new as {
            id: string;
            pod_id: string;
            user_id: string;
            content: string;
            created_at: string;
          };

          const { data: profile } = await supabase
            .from("profiles")
            .select("username")
            .eq("id", newMsg.user_id)
            .single();

          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [
              ...prev,
              { ...newMsg, profiles: profile ? { username: profile.username } : null },
            ];
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "pod_members",
          filter: `pod_id=eq.${pod.id}`,
        },
        () => setCurrentMemberCount((c) => c + 1)
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [pod.id, supabase]);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 border-b border-border bg-background px-4 py-3">
        <div className="mx-auto max-w-2xl">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="mb-0.5 flex items-center gap-2">
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  {pod.tag}
                </span>
                {expired && (
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    Ended
                  </span>
                )}
              </div>
              <h1 className="truncate text-base font-semibold">{pod.title}</h1>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-xs text-muted-foreground">
                {currentMemberCount}/{pod.max_members} members
              </p>
              <p className={`text-xs font-medium ${expired ? "text-muted-foreground" : "text-primary"}`}>
                {timeLeft}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Expired banner */}
      {expired && (
        <div className="shrink-0 bg-muted/60 py-1.5 text-center text-xs text-muted-foreground">
          This Pod has ended — read only.
        </div>
      )}

      {/* Messages — scrollable area */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-2xl px-4 py-4">
          {messages.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
              {isMember ? "No messages yet — say something!" : "No messages yet."}
            </div>
          ) : (
            <div className="space-y-0.5">
              {messages.map((msg, i) => {
                const isOwn = msg.user_id === userId;
                const prevMsg = messages[i - 1];
                const isFirstInGroup =
                  !prevMsg || prevMsg.user_id !== msg.user_id;

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isOwn ? "items-end" : "items-start"} ${isFirstInGroup ? "mt-4 first:mt-0" : "mt-0.5"}`}
                  >
                    {/* Meta: username + time — only on first of a group */}
                    {isFirstInGroup && (
                      <div className={`mb-1 flex items-baseline gap-1.5 px-1 text-xs text-muted-foreground ${isOwn ? "flex-row-reverse" : ""}`}>
                        {!isOwn && (
                          <span className="font-medium text-foreground/70">
                            @{msg.profiles?.username ?? "Unknown"}
                          </span>
                        )}
                        <span>{formatMessageTime(msg.created_at)}</span>
                      </div>
                    )}

                    {/* Bubble */}
                    <div
                      className={[
                        "max-w-[75%] break-words px-3.5 py-2 text-sm leading-relaxed",
                        "rounded-2xl",
                        isOwn
                          ? "rounded-br-md bg-primary text-primary-foreground"
                          : "rounded-bl-md bg-card text-foreground ring-1 ring-border",
                      ].join(" ")}
                    >
                      {msg.content}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Bottom bar — always pinned */}
      <div className="shrink-0 border-t border-border bg-background">
        <div className="mx-auto max-w-2xl">
          {!expired && isMember ? (
            <MessageInput podId={pod.id} />
          ) : !expired && userId ? (
            <JoinPrompt podId={pod.id} isFull={currentMemberCount >= pod.max_members} />
          ) : !expired ? (
            <div className="px-4 py-3 text-center text-sm text-muted-foreground">
              <Link href="/login" className="text-primary hover:underline">
                Sign in
              </Link>{" "}
              to join this pod.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function JoinPrompt({ podId, isFull }: { podId: string; isFull: boolean }) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleJoin() {
    setIsPending(true);
    setError(null);
    try {
      const { joinPod } = await import("@/app/actions");
      const result = await joinPod(podId);
      if (result?.error) setError(result.error);
    } finally {
      setIsPending(false);
    }
  }

  if (isFull) {
    return (
      <div className="px-4 py-3 text-center text-sm text-muted-foreground">
        This pod is full.{" "}
        <Link href="/" className="text-primary hover:underline">
          Browse others →
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3">
      <p className="text-sm text-muted-foreground">You&apos;re not in this pod yet.</p>
      <div className="flex items-center gap-2">
        {error && <span className="text-xs text-destructive">{error}</span>}
        <button
          onClick={handleJoin}
          disabled={isPending}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {isPending ? "Joining…" : "Join Pod"}
        </button>
      </div>
    </div>
  );
}
