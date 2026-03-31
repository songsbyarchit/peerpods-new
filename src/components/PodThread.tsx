"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { formatTimeRemaining, isPodExpired, formatMessageTime } from "@/lib/utils";
import MessageInput from "@/components/MessageInput";
import { leavePod, editMessage } from "@/app/actions";
import type { Message, Pod } from "@/lib/types";

interface PodThreadProps {
  pod: Pod;
  initialMessages: Message[];
  memberCount: number;
  userId: string | null;
  isMember: boolean;
  isCreator: boolean;
}

const EDIT_WINDOW_MS = 5 * 60 * 1000;

export default function PodThread({
  pod,
  initialMessages,
  memberCount,
  userId,
  isMember,
  isCreator,
}: PodThreadProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [timeLeft, setTimeLeft] = useState(() => formatTimeRemaining(pod.expires_at));
  const [expired, setExpired] = useState(() => isPodExpired(pod.expires_at));
  const [currentMemberCount, setCurrentMemberCount] = useState(memberCount);
  const [leaveError, setLeaveError] = useState<string | null>(null);
  const [isLeavePending, startLeaveTransition] = useTransition();

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editError, setEditError] = useState<string | null>(null);
  const [editSaving, setEditSaving] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isInitialLoad = useRef(true);
  const supabase = createClient();

  // Consecutive message block — based on confirmed messages only
  const confirmedMessages = messages.filter((m) => !m.id.startsWith("optimistic-"));
  const lastTwo = confirmedMessages.slice(-2);
  const consecutiveBlocked =
    !!userId &&
    lastTwo.length >= 2 &&
    lastTwo.every((m) => m.user_id === userId);

  function handleOptimisticSend(content: string) {
    setMessages((prev) => [
      ...prev,
      {
        id: `optimistic-${Date.now()}`,
        pod_id: pod.id,
        user_id: userId!,
        content,
        created_at: new Date().toISOString(),
        is_edited: false,
        edited_at: null,
        profiles: null,
      },
    ]);
  }

  function startEdit(msg: Message) {
    setEditingId(msg.id);
    setEditContent(msg.content);
    setEditError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditContent("");
    setEditError(null);
  }

  async function saveEdit(messageId: string) {
    setEditSaving(true);
    setEditError(null);
    const result = await editMessage(messageId, editContent);
    setEditSaving(false);
    if (result?.error) {
      setEditError(result.error);
    } else {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? {
                ...m,
                content: editContent.trim(),
                is_edited: true,
                edited_at: new Date().toISOString(),
              }
            : m
        )
      );
      setEditingId(null);
      setEditContent("");
    }
  }

  function handleLeave() {
    setLeaveError(null);
    startLeaveTransition(async () => {
      const result = await leavePod(pod.id);
      if (result?.error) setLeaveError(result.error);
    });
  }

  // Countdown timer — also drives the 5-min edit window re-evaluation
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
            is_edited: boolean;
            edited_at: string | null;
          };

          const { data: profile } = await supabase
            .from("profiles")
            .select("username")
            .eq("id", newMsg.user_id)
            .single();

          const confirmed = {
            ...newMsg,
            profiles: profile ? { username: profile.username } : null,
          };

          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            // Replace the optimistic placeholder for the current user's message
            if (newMsg.user_id === userId) {
              const optimisticIdx = prev.findLastIndex(
                (m) => m.id.startsWith("optimistic-") && m.content === newMsg.content
              );
              if (optimisticIdx !== -1) {
                const updated = [...prev];
                updated[optimisticIdx] = confirmed;
                return updated;
              }
            }
            return [...prev, confirmed];
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `pod_id=eq.${pod.id}`,
        },
        (payload) => {
          const updatedMsg = payload.new as {
            id: string;
            content: string;
            is_edited: boolean;
            edited_at: string | null;
          };
          setMessages((prev) =>
            prev.map((m) =>
              m.id === updatedMsg.id
                ? {
                    ...m,
                    content: updatedMsg.content,
                    is_edited: updatedMsg.is_edited,
                    edited_at: updatedMsg.edited_at,
                  }
                : m
            )
          );
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
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "pod_members",
          filter: `pod_id=eq.${pod.id}`,
        },
        () => setCurrentMemberCount((c) => Math.max(0, c - 1))
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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
            <div className="shrink-0 flex items-center gap-3">
              <div className="text-right">
                <p className="text-xs text-muted-foreground">
                  {currentMemberCount}/{pod.max_members} members
                </p>
                <p className={`text-xs font-medium ${expired ? "text-muted-foreground" : "text-primary"}`}>
                  {timeLeft}
                </p>
              </div>
              {isMember && !isCreator && !expired && (
                <div className="flex flex-col items-end gap-0.5">
                  <button
                    onClick={handleLeave}
                    disabled={isLeavePending}
                    className="rounded-md px-3 py-1 text-xs font-medium text-muted-foreground ring-1 ring-border transition-colors hover:bg-destructive/10 hover:text-destructive hover:ring-destructive/30 disabled:opacity-60"
                  >
                    {isLeavePending ? "Leaving…" : "Leave"}
                  </button>
                  {leaveError && (
                    <span className="text-xs text-destructive">{leaveError}</span>
                  )}
                </div>
              )}
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
                const isOptimistic = msg.id.startsWith("optimistic-");
                const isEditing = editingId === msg.id;
                const canEdit =
                  isOwn &&
                  !isOptimistic &&
                  !expired &&
                  Date.now() - new Date(msg.created_at).getTime() < EDIT_WINDOW_MS;

                const prevMsg = messages[i - 1];
                const isFirstInGroup =
                  !prevMsg || prevMsg.user_id !== msg.user_id;

                return (
                  <div
                    key={msg.id}
                    className={`group flex flex-col ${isOwn ? "items-end" : "items-start"} ${isFirstInGroup ? "mt-4 first:mt-0" : "mt-0.5"}`}
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

                    {/* Bubble row: edit icon + bubble (or inline edit form) */}
                    <div className="flex items-end gap-1.5">
                      {/* Pencil icon — left of bubble for own messages */}
                      {canEdit && !isEditing && (
                        <button
                          onClick={() => startEdit(msg)}
                          aria-label="Edit message"
                          className="mb-1 text-transparent transition-colors group-hover:text-muted-foreground/40 hover:!text-muted-foreground/80"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 16 16"
                            fill="currentColor"
                            className="h-3 w-3"
                          >
                            <path d="M13.488 2.513a1.75 1.75 0 0 0-2.475 0L6.75 6.774a2.75 2.75 0 0 0-.596.892l-.848 2.047a.75.75 0 0 0 .98.98l2.047-.848a2.75 2.75 0 0 0 .892-.596l4.261-4.263a1.75 1.75 0 0 0 0-2.474ZM3 14.25a.75.75 0 0 1 0-1.5h10a.75.75 0 0 1 0 1.5H3Z" />
                          </svg>
                        </button>
                      )}

                      {isEditing ? (
                        /* Inline edit form */
                        <div className="flex w-72 flex-col gap-1.5">
                          <textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Escape") cancelEdit();
                            }}
                            autoFocus
                            rows={3}
                            className="w-full resize-none rounded-xl border border-ring bg-card px-3.5 py-2 text-sm leading-relaxed outline-none ring-2 ring-ring/40 dark:bg-muted/30"
                          />
                          {editError && (
                            <p className="px-0.5 text-xs text-destructive">{editError}</p>
                          )}
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={cancelEdit}
                              className="rounded-lg px-3 py-1 text-xs text-muted-foreground ring-1 ring-border transition-colors hover:bg-muted"
                            >
                              cancel
                            </button>
                            <button
                              onClick={() => saveEdit(msg.id)}
                              disabled={editSaving || editContent.trim().length < 50}
                              className="rounded-lg bg-primary px-3 py-1 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
                            >
                              {editSaving ? "saving…" : "save"}
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* Regular bubble */
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
                          {msg.is_edited && (
                            <span className="ml-1.5 text-[10px] opacity-50">edited</span>
                          )}
                        </div>
                      )}
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
            <MessageInput
              podId={pod.id}
              onSend={handleOptimisticSend}
              consecutiveBlocked={consecutiveBlocked}
            />
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
