"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const LINES = [
  "Some thoughts need a stranger.",
  "No audience. No algorithm.",
  "Just someone curious.",
  "Right now.",
  "PeerPods.",
];

// Each line fades in over FADE_MS, then waits PAUSE_MS before the next starts
const FADE_MS = 1500;
const PAUSE_MS = 1800;
const STEP_MS = FADE_MS + PAUSE_MS;

export default function WelcomePage() {
  const [revealed, setRevealed] = useState(0);
  const [showCTA, setShowCTA] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const timers = LINES.map((_, i) =>
      setTimeout(() => setRevealed((n) => n + 1), i * STEP_MS)
    );
    const ctaTimer = setTimeout(
      () => setShowCTA(true),
      LINES.length * STEP_MS
    );
    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(ctaTimer);
    };
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center overflow-hidden bg-black px-8 py-16">
      <div className="flex flex-col items-center gap-10 text-center">
        {LINES.map((line, i) => (
          <p
            key={i}
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: "28px",
              lineHeight: "1.6",
              letterSpacing: "0.01em",
              color: "white",
              opacity: revealed > i ? 1 : 0,
              transition: `opacity ${FADE_MS}ms ease`,
              // "PeerPods." gets a touch of italic weight to feel like a title card
              fontStyle: i === LINES.length - 1 ? "italic" : "normal",
            }}
          >
            {line}
          </p>
        ))}

        {/* CTA */}
        <div
          className="mt-6"
          style={{
            opacity: showCTA ? 1 : 0,
            transition: `opacity ${FADE_MS}ms ease`,
          }}
        >
          <button
            onClick={() => router.push("/")}
            style={{ fontFamily: "var(--font-sans)" }}
            className="cursor-pointer border-b border-white/20 pb-px text-sm tracking-[0.18em] text-white/50 transition-colors duration-500 hover:border-white/50 hover:text-white/90"
          >
            come in
          </button>
        </div>
      </div>
    </div>
  );
}
