"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase";
import type { PreviewMessage } from "@/lib/types";

export type ActionState = { error?: string; sent?: boolean } | null;

export async function setupUsername(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const username = (formData.get("username") as string)?.trim();
  if (!username) return { error: "Username is required" };
  if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
    return {
      error:
        "Username must be 3–20 characters using only letters, numbers, and underscores",
    };
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase
    .from("profiles")
    .insert({ id: user.id, username });

  if (error) {
    if (error.code === "23505") return { error: "That username is already taken" };
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect("/welcome");
}

export async function createPod(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const title = (formData.get("title") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  const tag = formData.get("tag") as string;
  const duration = formData.get("duration") as string;

  if (!title) return { error: "Title is required" };
  if (!tag) return { error: "Please select a topic" };

  const durationMap: Record<string, number> = {
    "24h": 24,
    "48h": 48,
    "7d": 168,
  };
  const durationHours = durationMap[duration];
  if (!durationHours) return { error: "Invalid duration" };

  // Check active pod count (pods user is in that haven't expired)
  const { data: memberships } = await supabase
    .from("pod_members")
    .select("pod_id")
    .eq("user_id", user.id);

  if (memberships && memberships.length > 0) {
    const podIds = memberships.map((m) => m.pod_id);
    const { count: activePodCount } = await supabase
      .from("pods")
      .select("*", { count: "exact", head: true })
      .in("id", podIds)
      .gt("expires_at", new Date().toISOString());

    if ((activePodCount ?? 0) >= 5) {
      return { error: "You can only be in 5 active pods at a time" };
    }
  }

  const expiresAt = new Date(
    Date.now() + durationHours * 60 * 60 * 1000
  ).toISOString();

  const { data: pod, error: podError } = await supabase
    .from("pods")
    .insert({ title, description, tag, creator_id: user.id, expires_at: expiresAt, max_members: 6 })
    .select()
    .single();

  if (podError || !pod) return { error: podError?.message ?? "Failed to create pod" };

  // Auto-join the pod creator
  await supabase
    .from("pod_members")
    .insert({ pod_id: pod.id, user_id: user.id });

  revalidatePath("/");
  redirect(`/pods/${pod.id}`);
}

export async function joinPod(
  podId: string
): Promise<{ error: string } | void> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch the pod
  const { data: pod } = await supabase
    .from("pods")
    .select("*")
    .eq("id", podId)
    .single();

  if (!pod) return { error: "Pod not found" };
  if (new Date(pod.expires_at) <= new Date()) return { error: "This pod has already ended" };

  // Check if already a member
  const { data: existing } = await supabase
    .from("pod_members")
    .select("pod_id")
    .eq("pod_id", podId)
    .eq("user_id", user.id)
    .single();

  if (existing) {
    redirect(`/pods/${podId}`);
  }

  // Check member count
  const { count: memberCount } = await supabase
    .from("pod_members")
    .select("*", { count: "exact", head: true })
    .eq("pod_id", podId);

  if ((memberCount ?? 0) >= pod.max_members) {
    return { error: "This pod is full" };
  }

  // Check user's active pod count
  const { data: memberships } = await supabase
    .from("pod_members")
    .select("pod_id")
    .eq("user_id", user.id);

  if (memberships && memberships.length > 0) {
    const podIds = memberships.map((m) => m.pod_id);
    const { count: activePodCount } = await supabase
      .from("pods")
      .select("*", { count: "exact", head: true })
      .in("id", podIds)
      .gt("expires_at", new Date().toISOString());

    if ((activePodCount ?? 0) >= 5) {
      return { error: "You're already in 5 active pods" };
    }
  }

  const { error } = await supabase
    .from("pod_members")
    .insert({ pod_id: podId, user_id: user.id });

  if (error) return { error: error.message };

  revalidatePath(`/pods/${podId}`);
  revalidatePath("/");
  redirect(`/pods/${podId}`);
}

export async function leavePod(
  podId: string
): Promise<{ error: string } | void> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: pod } = await supabase
    .from("pods")
    .select("creator_id")
    .eq("id", podId)
    .single();

  if (!pod) return { error: "Pod not found" };
  if (pod.creator_id === user.id) return { error: "You cannot leave a pod you created" };

  const { error } = await supabase
    .from("pod_members")
    .delete()
    .eq("pod_id", podId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/");
  revalidatePath(`/pods/${podId}`);
  redirect("/");
}

export async function sendMessage(
  podId: string,
  content: string
): Promise<{ error: string } | void> {
  const trimmed = content.trim();
  if (!trimmed) return { error: "Message cannot be empty" };
  if (trimmed.length < 50) return { error: "Message too short" };

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Verify pod is not expired
  const { data: pod } = await supabase
    .from("pods")
    .select("expires_at")
    .eq("id", podId)
    .single();

  if (!pod) return { error: "Pod not found" };
  if (new Date(pod.expires_at) <= new Date()) return { error: "This pod has ended" };

  // Verify membership
  const { data: membership } = await supabase
    .from("pod_members")
    .select("pod_id")
    .eq("pod_id", podId)
    .eq("user_id", user.id)
    .single();

  if (!membership) return { error: "You are not a member of this pod" };

  // Enforce consecutive message limit (max 2 in a row)
  const { data: recentMsgs } = await supabase
    .from("messages")
    .select("user_id")
    .eq("pod_id", podId)
    .order("created_at", { ascending: false })
    .limit(2);

  if (
    recentMsgs &&
    recentMsgs.length >= 2 &&
    recentMsgs.every((m) => m.user_id === user.id)
  ) {
    return { error: "Let someone else jump in first" };
  }

  const { error } = await supabase
    .from("messages")
    .insert({ pod_id: podId, user_id: user.id, content: trimmed });

  if (error) return { error: error.message };
}

export async function editMessage(
  messageId: string,
  content: string
): Promise<{ error: string } | void> {
  const trimmed = content.trim();
  if (!trimmed) return { error: "Message cannot be empty" };
  if (trimmed.length < 50) return { error: "Message too short" };

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: message } = await supabase
    .from("messages")
    .select("user_id, created_at")
    .eq("id", messageId)
    .single();

  if (!message) return { error: "Message not found" };
  if (message.user_id !== user.id) return { error: "Not your message" };

  const messageAge = Date.now() - new Date(message.created_at).getTime();
  if (messageAge > 5 * 60 * 1000) return { error: "Edit window has passed" };

  const { error } = await supabase
    .from("messages")
    .update({
      content: trimmed,
      is_edited: true,
      edited_at: new Date().toISOString(),
    })
    .eq("id", messageId);

  if (error) return { error: error.message };
}

export async function getPreviewMessages(
  podId: string
): Promise<{ messages: PreviewMessage[]; error?: string }> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("messages")
    .select("id, content, user_id, created_at, profiles(username)")
    .eq("pod_id", podId)
    .order("created_at", { ascending: true })
    .limit(3);

  if (error) return { messages: [], error: error.message };
  return { messages: (data as unknown as PreviewMessage[]) ?? [] };
}

export async function signOut() {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect("/login");
}
