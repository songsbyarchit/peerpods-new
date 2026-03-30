import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase";
import CreatePodForm from "@/components/CreatePodForm";
import Link from "next/link";

export default async function NewPodPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <div className="mb-6">
        <Link
          href="/"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to browse
        </Link>
      </div>

      <h1 className="mb-1 text-2xl font-bold tracking-tight">
        Start a new Pod
      </h1>
      <p className="mb-6 text-sm text-muted-foreground">
        You&apos;ll auto-join as the first member. Up to 8 people can join.
      </p>

      <CreatePodForm />
    </div>
  );
}
