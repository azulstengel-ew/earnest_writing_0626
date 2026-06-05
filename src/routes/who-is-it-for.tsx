import { createFileRoute, Link } from "@tanstack/react-router";
import { Wordmark } from "@/components/brand";
import { BookOpen, Film, Feather, PenTool, GraduationCap, FileText, Smartphone, NotebookPen, Lightbulb } from "lucide-react";
import { Footer } from "@/components/Footer";

export const Route = createFileRoute("/who-is-it-for")({
  head: () => ({
    meta: [
      { title: "Who is it for — Earnest Writing" },
      { name: "description", content: "Earnest Writing is for anyone who writes seriously." },
    ],
  }),
  component: WhoIsItFor,
});

const WRITERS = [
  {
    title: "The novelist",
    icon: BookOpen,
    description: "You have chapters, characters, timelines, and a world that keeps expanding in your head. You need somewhere to hold it all — not just the words, but the people, the places, the rules of the universe you are building. Earnest gives you chapters, a character web, plot arcs, a world-building bible, and a story timeline. Everything in one place, nothing in the way.",
    accent: "#F47920",
    detail: "Books & memoir",
  },
  {
    title: "The screenwriter",
    icon: Film,
    description: "You think in scenes, not chapters. In INT. and EXT., in sluglines and action lines. Your editor should know the difference between dialogue and direction. Earnest formats your pages correctly, estimates your runtime, and keeps your scenes and characters organised the way a working script demands.",
    accent: "#F5C518",
    detail: "Screenplays & TV",
  },
  {
    title: "The poet",
    icon: Feather,
    description: "Every syllable is a decision. You need to see the rhythm as you write — the count beside each line, the rhyme that might be one word away. Earnest counts syllables in real time, suggests rhymes as you select a word, and offers form templates for the structures you love or are learning to break.",
    accent: "#C8394A",
    detail: "Poetry & verse",
  },
  {
    title: "The copywriter",
    icon: PenTool,
    description: "You write for clients, briefs, and deadlines. Every piece starts with an objective and ends with a reader who either acts or does not. Earnest gives you a brief field for every piece, A/B version tracking, and an audience persona library — so you always know who you are writing for and what you are trying to do.",
    accent: "#2E6DA4",
    detail: "Copywriting",
  },
  {
    title: "The academic",
    icon: GraduationCap,
    description: "Your argument is everything. Evidence, counter-argument, response — the structure of a dissertation or essay is its own kind of architecture. Earnest gives you a hierarchical outline, an argument tracker per chapter, and a citation manager that formats in APA, MLA, Harvard, or Chicago. One less thing to get wrong.",
    accent: "#4A7C3F",
    detail: "Dissertation & essays",
  },
  {
    title: "The content creator",
    icon: Smartphone,
    description: "You write for platforms that count characters and algorithms that reward consistency. You need to plan ahead, track what is going out, and stay coherent across Instagram, TikTok, LinkedIn, and everything else. Earnest gives you a content calendar, platform-aware character limits, and a hashtag library.",
    accent: "#00C2A8",
    detail: "Social media",
  },
  {
    title: "The journal keeper",
    icon: NotebookPen,
    description: "You write for yourself. No audience, no brief, no argument to win. Just the page and what happened today, or what you are feeling, or what you are trying to work out. Earnest gives you a private space with a mood tracker, a calendar of entries, and the option to lock individual days. It never judges. It never reads.",
    accent: "#7B5EA7",
    detail: "Journaling",
  },
  {
    title: "The one with an idea",
    icon: Lightbulb,
    description: "You do not know what it is yet. It is not a book or a script or a poem. It is something that keeps appearing in your thoughts and needs somewhere to go. Earnest Ideating workspace is a freeform canvas — post-its, connections, fragments. A place for the thing before the thing.",
    accent: "#6BAED6",
    detail: "Ideating",
  },
];

function WhoIsItFor() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-6 py-6">
        <Wordmark />
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">← Home</Link>
      </header>

      <main className="mx-auto max-w-3xl px-6 pb-20">
        <div className="mb-12">
          <h1 className="font-serif text-4xl font-semibold tracking-tight md:text-5xl">
            Who is Earnest Writing for?
          </h1>
          <p className="mt-4 font-serif text-xl leading-relaxed text-foreground/70 max-w-xl">
            Anyone who writes seriously. Which is a longer list than most writing tools assume.
          </p>
        </div>

        <div className="space-y-5">
          {WRITERS.map((w) => (
            <div key={w.title} className="rounded-2xl border border-border/70 bg-card p-7 md:p-9 transition-colors hover:border-border">
              <div className="flex items-start gap-4 mb-4">
                <div className="flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-xl mt-1" style={{ background: w.accent + "18" }}>
                  <w.icon className="h-5 w-5" style={{ color: w.accent }} />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="font-serif text-2xl font-semibold tracking-tight">{w.title}</h2>
                    <span className="flex-shrink-0 rounded-full px-3 py-1 text-xs font-medium mt-1" style={{ background: w.accent + "18", color: w.accent }}>{w.detail}</span>
                  </div>
                </div>
              </div>
              <div className="mb-4 h-px w-12 rounded-full" style={{ background: w.accent }} />
              <p className="text-sm leading-relaxed text-foreground/75">{w.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-14 rounded-2xl border border-border/70 bg-card p-8 text-center">
          <h2 className="font-serif text-2xl font-semibold">Sound like you?</h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
            Earnest Writing is free to start. No credit card, no setup, no noise.
          </p>
          <div className="mt-6 flex flex-wrap gap-3 justify-center">
            <Link to="/" className="inline-flex items-center rounded-lg bg-accent px-6 py-2.5 text-sm font-medium text-accent-foreground hover:bg-accent/90 transition-colors">
              Start writing
            </Link>
            <Link to="/about" className="inline-flex items-center rounded-lg border border-border px-6 py-2.5 text-sm font-medium text-foreground hover:bg-secondary transition-colors">
              Read about us
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
