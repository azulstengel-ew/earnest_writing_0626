import { createFileRoute, Link } from "@tanstack/react-router";
import { FoxLogo, Wordmark } from "@/components/brand";
import { Footer } from "@/components/Footer";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Earnest Writing" },
      { name: "description", content: "What Earnest Writing is and why it exists." },
    ],
  }),
  component: About,
});

function About() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-6 py-6">
        <Wordmark />
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">← Home</Link>
      </header>

      <main className="mx-auto max-w-3xl px-6 pb-20">
        <div className="rounded-2xl border border-border/70 bg-card p-8 md:p-12">
          <FoxLogo className="h-20 w-20" float />
          <h1 className="mt-6 font-serif text-4xl font-semibold tracking-tight">About Earnest Writing</h1>
          <p className="mt-4 font-serif text-xl leading-relaxed text-foreground/80">
            A calm home for every word you mean to write.
          </p>

          <div className="mt-8 space-y-5 text-sm leading-relaxed text-foreground/80">
            <p>
              Earnest Writing was built for writers who take their craft seriously — novelists, screenwriters, essayists, academics, and anyone who sits down to put something real on the page.
            </p>
            <p>
              Most writing tools are either too simple or too noisy. Earnest is different: it gives you the structure you need — chapters, characters, plot arcs, research — without getting in the way of the actual writing.
            </p>
            <p>
              Your writing belongs to you. We store it, sync it, and keep it safe — but the words are always yours. We will never read your work, sell your data, or use your content to train AI systems.
            </p>
            <p>
              The name comes from Oscar Wilde's <em>The Importance of Being Earnest</em> — a reminder that earnestness matters, even when it makes people laugh. Write like you mean it.
            </p>
          </div>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              to="/onboarding"
              className="inline-flex items-center rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-accent-foreground hover:bg-accent/90 transition-colors"
            >
              Start your first project
            </Link>
            <a
              href="mailto:contact@earnestwriting.com"
              className="inline-flex items-center rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-foreground hover:bg-secondary transition-colors"
            >
              Get in touch
            </a>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
