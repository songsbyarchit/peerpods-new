"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

const LINES = [
  "Some thoughts need a stranger.",
  "No audience. No algorithm.",
  "Just someone curious.",
  "Right now.",
  "PeerPods.",
];

// Each line fades in over FADE_MS, then waits PAUSE_MS before auto-advancing
const FADE_MS = 1500;
const PAUSE_MS = 1800;
const STEP_MS = FADE_MS + PAUSE_MS;

export default function WelcomePage() {
  const [revealed, setRevealed] = useState(0);
  const [hintDismissed, setHintDismissed] = useState(false);
  // Ref mirrors state so click handler never reads a stale closure value
  const revealedRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();

  // Schedule the next auto-advance from whatever revealedRef.current is now
  const scheduleNext = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (revealedRef.current < LINES.length) {
      timerRef.current = setTimeout(() => {
        revealedRef.current += 1;
        setRevealed(revealedRef.current);
        scheduleNext();
      }, STEP_MS);
    }
  }, []);

  useEffect(() => {
    scheduleNext();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [scheduleNext]);

  function handleClick() {
    // Dismiss the hint on the very first click
    if (!hintDismissed) setHintDismissed(true);

    // All lines shown — enter the app
    if (revealedRef.current >= LINES.length) {
      router.push("/");
      return;
    }

    // Cancel pending auto-advance, reveal next line immediately, then
    // reschedule auto-advance from the new position as a fallback
    if (timerRef.current) clearTimeout(timerRef.current);
    revealedRef.current += 1;
    setRevealed(revealedRef.current);
    scheduleNext();
  }

  const allRevealed = revealed >= LINES.length;
  const hintOpacity = allRevealed ? 1 : hintDismissed ? 0 : 1;

  return (
    <div
      className="relative flex min-h-screen cursor-pointer select-none flex-col items-center justify-center overflow-hidden bg-black px-8 py-16 transition-transform duration-75 active:scale-[0.998]"
      onClick={handleClick}
    >
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
              fontStyle: i === LINES.length - 1 ? "italic" : "normal",
            }}
          >
            {line}
          </p>
        ))}
      </div>

      {/* Bottom hint — pulses while waiting, becomes "come in" at the end */}
      <div
        className="pointer-events-none absolute bottom-12 left-1/2 -translate-x-1/2"
        style={{
          opacity: hintOpacity,
          transition: "opacity 600ms ease",
        }}
      >
        {allRevealed ? (
          <span
            style={{ fontFamily: "var(--font-sans)" }}
            className="border-b border-white/20 pb-px text-sm tracking-[0.18em] text-white/50"
          >
            come in
          </span>
        ) : (
          <div className="flex items-center gap-2">
            <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-white/50" />
            <span
              style={{ fontFamily: "var(--font-sans)" }}
              className="text-xs tracking-widest text-white/30"
            >
              tap to continue
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
