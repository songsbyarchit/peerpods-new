"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { formatTimeRemaining, isPodExpired, cn } from "@/lib/utils";
import { joinPod } from "@/app/actions";
import type { PodWithCount } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import PodPreviewModal from "@/components/PodPreviewModal";

interface PodCardProps {
  pod: PodWithCount;
  isJoined?: boolean;
  userId?: string | null;
}

export default function PodCard({ pod, isJoined, userId }: PodCardProps) {
  const [timeLeft, setTimeLeft] = useState(() => formatTimeRemaining(pod.expires_at));
  const [expired, setExpired] = useState(() => isPodExpired(pod.expires_at));
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [previewOpen, setPreviewOpen] = useState(false);

  const memberCount = pod.pod_members?.[0]?.count ?? 0;

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(formatTimeRemaining(pod.expires_at));
      setExpired(isPodExpired(pod.expires_at));
    }, 60000);
    return () => clearInterval(timer);
  }, [pod.expires_at]);

  function handleJoin() {
    setError(null);
    startTransition(async () => {
      const result = await joinPod(pod.id);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <>
    <Card
      className={cn(
        "transition-shadow hover:shadow-md",
        expired && "opacity-60"
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <Badge variant={expired ? "secondary" : "default"} className="shrink-0">
            {pod.tag}
          </Badge>
          <span
            className={cn(
              "text-xs font-medium",
              expired ? "text-muted-foreground" : "text-primary"
            )}
          >
            {timeLeft}
          </span>
        </div>
        <CardTitle className="mt-1 line-clamp-2 text-base">
          {pod.title}
        </CardTitle>
      </CardHeader>

      {pod.description && (
        <CardContent className="py-0">
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {pod.description}
          </p>
        </CardContent>
      )}

      <CardFooter className="mt-auto flex items-center justify-between border-t-0 bg-transparent pt-3">
        <span className="text-xs text-muted-foreground">
          {memberCount}/{pod.max_members} members
        </span>

        <div className="flex items-center gap-2">
          {error && (
            <span className="text-xs text-destructive">{error}</span>
          )}

          {expired ? (
            <Link
              href={`/pods/${pod.id}`}
              className="rounded-md px-3 py-1 text-xs font-medium text-muted-foreground ring-1 ring-border transition-colors hover:bg-muted"
            >
              View (ended)
            </Link>
          ) : isJoined ? (
            <Link
              href={`/pods/${pod.id}`}
              className="rounded-md bg-accent px-3 py-1 text-xs font-medium text-accent-foreground transition-colors hover:bg-accent/80"
            >
              Open pod
            </Link>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => setPreviewOpen(true)}
                className="rounded-md px-3 py-1 text-xs font-medium text-muted-foreground ring-1 ring-border transition-colors hover:bg-muted"
              >
                Preview
              </button>
              {userId && memberCount < pod.max_members && (
                <button
                  onClick={handleJoin}
                  disabled={isPending}
                  className="rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
                >
                  {isPending ? "Joining…" : "Join"}
                </button>
              )}
              {!userId && (
                <Link
                  href="/login"
                  className="rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90"
                >
                  Join
                </Link>
              )}
              {userId && memberCount >= pod.max_members && (
                <span className="rounded-md px-3 py-1 text-xs font-medium text-muted-foreground ring-1 ring-border">
                  Pod is full
                </span>
              )}
            </div>
          )}
        </div>
      </CardFooter>
    </Card>

    {previewOpen && (
      <PodPreviewModal
        pod={pod}
        isJoined={!!isJoined}
        userId={userId ?? null}
        onClose={() => setPreviewOpen(false)}
      />
    )}
    </>
  );
}
