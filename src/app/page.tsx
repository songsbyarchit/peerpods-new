import { createServerSupabaseClient } from "@/lib/supabase";
import PodCard from "@/components/PodCard";
import type { PodWithCount } from "@/lib/types";
import Link from "next/link";

export default async function BrowsePage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const now = new Date().toISOString();

  // Fetch all open pods with member count
  const { data: pods } = await supabase
    .from("pods")
    .select("*, pod_members(count)")
    .gt("expires_at", now)
    .order("created_at", { ascending: false });

  const openPods = (pods as PodWithCount[] | null) ?? [];

  // Get IDs of pods the user has joined
  let joinedPodIds = new Set<string>();
  let userTags: string[] = [];

  if (user) {
    const { data: memberships } = await supabase
      .from("pod_members")
      .select("pod_id")
      .eq("user_id", user.id);

    if (memberships) {
      joinedPodIds = new Set(memberships.map((m) => m.pod_id));
    }

    // Get tags from pods the user has been in (for similar pods)
    if (joinedPodIds.size > 0) {
      const { data: joinedPods } = await supabase
        .from("pods")
        .select("tag")
        .in("id", [...joinedPodIds]);

      if (joinedPods) {
        userTags = [...new Set(joinedPods.map((p) => p.tag))];
      }
    }
  }

  // Similar pods: open pods not joined by user, matching a tag the user has used
  const similarPods =
    userTags.length > 0
      ? openPods.filter(
          (p) => !joinedPodIds.has(p.id) && userTags.includes(p.tag)
        )
      : [];

  const browsePods = openPods.filter((p) => !similarPods.includes(p));

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Hero */}
      {!user && (
        <div className="mb-10 rounded-2xl bg-accent/50 px-6 py-8 text-center">
          <h1 className="mb-2 text-2xl font-bold tracking-tight">
            Focused conversations, time-boxed.
          </h1>
          <p className="mb-4 text-muted-foreground">
            Join a Pod, discuss something real, and let it end. No feed, no
            followers — just honest conversation.
          </p>
          <Link
            href="/login"
            className="inline-flex rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Join PeerPods — it&apos;s free
          </Link>
        </div>
      )}

      {/* Similar pods section */}
      {similarPods.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            You might like
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {similarPods.map((pod) => (
              <PodCard
                key={pod.id}
                pod={pod}
                isJoined={joinedPodIds.has(pod.id)}
                userId={user?.id ?? null}
              />
            ))}
          </div>
        </section>
      )}

      {/* Open pods */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Open Pods</h2>
          {user && (
            <Link
              href="/pods/new"
              className="text-sm font-medium text-primary hover:underline"
            >
              + Start a new pod
            </Link>
          )}
        </div>

        {browsePods.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border py-16 text-center">
            <p className="text-muted-foreground">No open pods right now.</p>
            {user && (
              <Link
                href="/pods/new"
                className="mt-3 inline-block text-sm font-medium text-primary hover:underline"
              >
                Be the first to start one →
              </Link>
            )}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {browsePods.map((pod) => (
              <PodCard
                key={pod.id}
                pod={pod}
                isJoined={joinedPodIds.has(pod.id)}
                userId={user?.id ?? null}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
