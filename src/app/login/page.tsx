"use client";

import { useState, useTransition } from "react";

type LoginState = { error?: string; sent?: boolean } | null;

export default function LoginPage() {
  const [state, setState] = useState<LoginState>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await fetch("/api/auth/login", { method: "POST", body: formData });
      const data = await res.json();
      setState(data);
    });
  }

  if (state?.sent) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="mb-4 text-4xl">✉️</div>
          <h2 className="mb-2 text-xl font-semibold">Check your email</h2>
          <p className="text-sm text-muted-foreground">
            We sent a magic link to your inbox. Click it to sign in.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold tracking-tight text-primary">
            PeerPods
          </h1>
          <p className="text-muted-foreground">
            Focused conversations with curious strangers.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-sm font-medium"
            >
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoFocus
              placeholder="you@example.com"
              className="h-10 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </div>

          {state?.error && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="h-10 w-full rounded-lg bg-primary text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {isPending ? "Sending…" : "Send magic link"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          No password needed. We&apos;ll email you a sign-in link.
        </p>
      </div>
    </div>
  );
}
