"use client";

import { useActionState } from "react";
import { setupUsername } from "@/app/actions";

export default function SetupUsernamePage() {
  const [state, action, pending] = useActionState(setupUsername, null);

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-2xl font-bold tracking-tight">
            Choose your username
          </h1>
          <p className="text-sm text-muted-foreground">
            This is how others will see you in pods.
          </p>
        </div>

        <form action={action} className="space-y-4">
          <div>
            <label
              htmlFor="username"
              className="mb-1.5 block text-sm font-medium"
            >
              Username
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                @
              </span>
              <input
                id="username"
                name="username"
                type="text"
                required
                autoFocus
                minLength={3}
                maxLength={20}
                pattern="[a-zA-Z0-9_]+"
                placeholder="yourname"
                className="h-10 w-full rounded-lg border border-input bg-transparent pl-7 pr-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              3–20 characters. Letters, numbers, underscores.
            </p>
          </div>

          {state?.error && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="h-10 w-full rounded-lg bg-primary text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {pending ? "Setting up…" : "Get started"}
          </button>
        </form>
      </div>
    </div>
  );
}
