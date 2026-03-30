import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase";
import PodCard from "@/components/PodCard";
import type { PodWithCount } from "@/lib/types";
import Link from "next/link";

export default async function MyPodsPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Get pods the user is a member of
  const { data: memberships } = await supabase
    .from("pod_members")
    .select("pod_id")
    .eq("user_id", user.id);

  const podIds = memberships?.map((m) => m.pod_id) ?? [];

  let activePods: PodWithCount[] = [];
  let endedPods: PodWithCount[] = [];

  if (podIds.length > 0) {
    const { data: pods } = await supabase
      .from("pods")
      .select("*, pod_members(count)")
      .in("id", podIds)
      .order("expires_at", { ascending: false });

    const now = new Date().toISOString();
    const allPods = (pods as PodWithCount[] | null) ?? [];
    activePods = allPods.filter((p) => p.expires_at > now);
    endedPods = allPods.filter((p) => p.expires_at <= now);
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">My Pods</h1>
        <Link
          href="/pods/new"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          + New Pod
        </Link>
      </div>

      {podIds.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-16 text-center">
          <p className="mb-2 text-muted-foreground">
            You haven&apos;t joined any pods yet.
          </p>
          <Link
            href="/"
            className="text-sm font-medium text-primary hover:underline"
          >
            Browse open pods →
          </Link>
        </div>
      ) : (
        <div className="space-y-10">
          {activePods.length > 0 && (
            <section>
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Active ({activePods.length}/5)
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {activePods.map((pod) => (
                  <PodCard
                    key={pod.id}
                    pod={pod}
                    isJoined
                    userId={user.id}
                  />
                ))}
              </div>
            </section>
          )}

          {endedPods.length > 0 && (
            <section>
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Ended
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {endedPods.map((pod) => (
                  <PodCard
                    key={pod.id}
                    pod={pod}
                    isJoined
                    userId={user.id}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
