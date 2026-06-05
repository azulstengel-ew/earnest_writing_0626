import { useEffect, useState } from "react";

const CYCLE = [
  "copy", "screen", "play", "book", "prose", "poem", "script", "ghost",
  "letter", "verse", "story", "stage", "song", "draft", "scene", "essay",
  "earnest",
];

interface Props {
  onLanded?: () => void;
}

export function AnimatedHeadline({ onLanded }: Props) {
  const [index, setIndex] = useState(0);
  const landed = index >= CYCLE.length - 1;

  useEffect(() => {
    if (landed) return;
    const id = setTimeout(() => setIndex((i) => i + 1), 700);
    return () => clearTimeout(id);
  }, [index, landed]);

  useEffect(() => {
    if (landed) onLanded?.();
  }, [landed, onLanded]);

  const word = CYCLE[index];

  return (
    <>
      <style>{`
        @keyframes cursor-sync {
          0%   { opacity: 1; }
          70%  { opacity: 1; }
          85%  { opacity: 0; }
          100% { opacity: 0; }
        }
      `}</style>
      <h1 className="font-serif font-semibold tracking-tight text-foreground">
        <div className="text-2xl md:text-3xl font-light text-muted-foreground">
          The importance of
        </div>
        <div className="mt-1 flex items-baseline text-4xl md:text-5xl">
          <span
            className="relative inline-block text-left overflow-hidden"
            style={{ width: "5.4ch", paddingBottom: "0.15em" }}
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
          <span
            key={`cursor-${word}`}
            className="inline-block w-[2px] mb-[0.05em] mx-1 rounded-full"
            style={{
              height: "0.85em",
              backgroundColor: "var(--ink)",
              opacity: landed ? 0 : 1,
              animation: landed ? "none" : "cursor-sync 700ms ease-out forwards",
              transition: "opacity 500ms ease-out",
            }}
          />
          <span className="italic">writing</span>
        </div>
      </h1>
    </>
  );
}
