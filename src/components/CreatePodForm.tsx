"use client";

import { useActionState } from "react";
import { createPod } from "@/app/actions";
import { TOPIC_TAGS } from "@/lib/types";

const DURATIONS = [
  { value: "24h", label: "24 hours" },
  { value: "48h", label: "48 hours" },
  { value: "7d", label: "7 days" },
];

export default function CreatePodForm() {
  const [state, action, pending] = useActionState(createPod, null);

  return (
    <form action={action} className="space-y-5">
      {state?.error && (
        <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {state.error}
        </div>
      )}

      <div>
        <label htmlFor="title" className="mb-1.5 block text-sm font-medium">
          Title <span className="text-destructive">*</span>
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          maxLength={100}
          placeholder="e.g. What would you give up for total freedom?"
          className="h-10 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </div>

      <div>
        <label htmlFor="tag" className="mb-1.5 block text-sm font-medium">
          Topic <span className="text-destructive">*</span>
        </label>
        <select
          id="tag"
          name="tag"
          required
          defaultValue=""
          className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <option value="" disabled>
            Select a topic…
          </option>
          {TOPIC_TAGS.map((tag) => (
            <option key={tag} value={tag}>
              {tag}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor="description"
          className="mb-1.5 block text-sm font-medium"
        >
          Description{" "}
          <span className="text-muted-foreground font-normal">(optional)</span>
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          maxLength={300}
          placeholder="A bit more context for what you want to explore…"
          className="w-full resize-none rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </div>

      <div>
        <p className="mb-2 text-sm font-medium">
          Duration <span className="text-destructive">*</span>
        </p>
        <div className="flex gap-2">
          {DURATIONS.map((d, i) => (
            <label
              key={d.value}
              className="flex flex-1 cursor-pointer items-center justify-center rounded-lg border border-input px-3 py-2 text-sm transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/10 has-[:checked]:text-primary hover:bg-muted"
            >
              <input
                type="radio"
                name="duration"
                value={d.value}
                defaultChecked={i === 0}
                className="sr-only"
              />
              {d.label}
            </label>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="h-10 w-full rounded-lg bg-primary text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Creating pod…" : "Create Pod"}
      </button>
    </form>
  );
}
