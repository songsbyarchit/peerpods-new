import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase";
import PodThread from "@/components/PodThread";
import type { Message, Pod } from "@/lib/types";
import Link from "next/link";

export default async function PodPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch the pod
  const { data: pod } = await supabase
    .from("pods")
    .select("*")
    .eq("id", id)
    .single();

  if (!pod) notFound();

  // Fetch messages with usernames
  const { data: messages } = await supabase
    .from("messages")
    .select("*, profiles(username)")
    .eq("pod_id", id)
    .order("created_at", { ascending: true });

  // Fetch member count
  const { count: memberCount } = await supabase
    .from("pod_members")
    .select("*", { count: "exact", head: true })
    .eq("pod_id", id);

  // Check if user is a member
  let isMember = false;
  if (user) {
    const { data: membership } = await supabase
      .from("pod_members")
      .select("pod_id")
      .eq("pod_id", id)
      .eq("user_id", user.id)
      .single();
    isMember = !!membership;
  }

  return (
    <div className="flex h-[calc(100vh-56px)] flex-col">
      <div className="border-b border-border px-4 py-2">
        <div className="mx-auto max-w-3xl">
          <Link
            href="/"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            ← Browse
          </Link>
        </div>
      </div>

      <PodThread
        pod={pod as Pod}
        initialMessages={(messages as Message[]) ?? []}
        memberCount={memberCount ?? 0}
        userId={user?.id ?? null}
        isMember={isMember}
      />
    </div>
  );
}
