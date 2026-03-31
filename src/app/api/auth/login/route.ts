import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

export async function POST(request: Request) {
  const formData = await request.formData();
  const email = (formData.get("email") as string)?.trim();

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${siteUrl}/auth/callback`,
    },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ sent: true });
}
