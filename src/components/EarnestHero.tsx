import { useEffect, useState } from "react";
import { FoxLogo } from "@/components/brand";

const CYCLE = [
  "copy", "screen", "play", "book", "prose", "poem", "script", "ghost",
  "letter", "verse", "story", "stage", "song", "draft", "scene", "essay",
  "earnest",
];

export function EarnestHero() {
  const [index, setIndex] = useState(0);
  const [landed, setLanded] = useState(false);
  const [showTail, setShowTail] = useState(false);

  useEffect(() => {
    if (index >= CYCLE.length - 1) {
      setLanded(true);
      const t = setTimeout(() => setShowTail(true), 700);
      return () => clearTimeout(t);
    }
    // ease from 200ms -> 1600ms across the cycle
    const t = 200 + (1600 - 200) * Math.pow(index / (CYCLE.length - 1), 2.2);
    const id = setTimeout(() => setIndex((i) => i + 1), t);
    return () => clearTimeout(id);
  }, [index]);

  const word = CYCLE[index];

  return (
    <section className="mx-auto flex max-w-3xl flex-col items-center px-6 pt-10 pb-20 text-center">
      <FoxLogo className="h-72 w-72 md:h-96 md:w-96" />

      <div
        className="mt-6 flex flex-col items-center"
        style={{ fontFamily: '"Cormorant Garamond", "Fraunces", Georgia, serif' }}
      >
        <p
          className="text-2xl md:text-3xl font-light tracking-wide"
          style={{ color: "oklch(0.55 0.025 70)" }}
        >
          The importance of
        </p>

        <h1 className="mt-2 flex items-baseline justify-center font-semibold leading-[1.05] tracking-tight text-foreground text-5xl md:text-7xl">
          <span
            className="relative inline-block text-right overflow-hidden"
            style={{ width: "5.6ch" }}
            aria-live="polite"
          >
            <span
              key={word}
              className="inline-block animate-word-in"
              style={{
                color: landed ? "#F47920" : "var(--ink)",
                transition: "color 500ms ease-out",
              }}
            >
              {word}
            </span>
          </span>
          <span className="ml-3 md:ml-4 italic text-foreground">writing</span>
        </h1>

        <div
          className={`mt-8 flex flex-col items-center transition-opacity duration-700 ${showTail ? "opacity-100" : "opacity-0"}`}
        >
          <span className="block h-px w-24 bg-border" />
          <p className="mt-4 italic text-muted-foreground">
            A place for every word you mean to write.
          </p>
        </div>
      </div>
    </section>
  );
}
