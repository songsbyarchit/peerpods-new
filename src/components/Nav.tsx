"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import ThemeToggle from "@/components/ThemeToggle";

interface NavProps {
  userId: string | null;
  username: string | null;
}

export default function Nav({ userId, username }: NavProps) {
  const pathname = usePathname();
  const router = useRouter();

  // Welcome screen owns the full viewport — no nav
  if (pathname === "/welcome") return null;
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="text-base font-bold tracking-tight text-primary"
          >
            PeerPods
          </Link>
          <nav className="flex items-center gap-1">
            <Link
              href="/"
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                pathname === "/"
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Browse
            </Link>
            {userId && (
              <Link
                href="/my-pods"
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  pathname === "/my-pods"
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                My Pods
              </Link>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            href="/welcome"
            title="Re-experience the intro"
            className="text-[11px] text-muted-foreground/30 transition-colors hover:text-muted-foreground/70"
          >
            intro
          </Link>
          {userId ? (
            <>
              <Link
                href="/pods/new"
                className={cn(
                  "rounded-lg border border-primary/30 px-3 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
                )}
              >
                + New Pod
              </Link>
              <span className="text-sm text-muted-foreground">
                @{username}
              </span>
              <button
                onClick={handleSignOut}
                className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Sign out
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-lg bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
