import { createFileRoute, Link } from "@tanstack/react-router";
import { Wordmark } from "@/components/brand";
import { Footer } from "@/components/Footer";
import { BookOpen, GitBranch, Users, Map, FlaskConical, Download } from "lucide-react";

export const Route = createFileRoute("/how-to-use")({
  head: () => ({
    meta: [
      { title: "How to Use — Earnest Writing" },
      { name: "description", content: "A guide to getting the most out of Earnest Writing." },
    ],
  }),
  component: HowToUse,
});

const features = [
  {
    icon: BookOpen,
    title: "Chapters",
    desc: "Create chapters and write directly in the editor. Your work is saved automatically as you type. Each chapter tracks your word count against a target, and the status updates from 'not started' to 'in progress' to 'done' as you write.",
  },
  {
    icon: GitBranch,
    title: "Plot arcs",
    desc: "Map your story structure using Three Act, Save the Cat, or Hero's Journey frameworks — or build your own. Create plot arcs that span your chapters, and visualise tension with the interactive graph view.",
  },
  {
    icon: Users,
    title: "Characters",
    desc: "Build character profiles with motivations, traits, and backstory. Connect characters to each other and to the chapters they appear in. The relationship map shows how everyone is linked.",
  },
  {
    icon: Map,
    title: "Planning",
    desc: "Use the calendar to schedule writing sessions and set chapter deadlines. Track your progress against a weekly word target and see your overall completion at a glance.",
  },
  {
    icon: FlaskConical,
    title: "Research",
    desc: "Save research questions and answers alongside your project. Use the AI assistant to look things up without leaving your writing environment.",
  },
  {
    icon: Download,
    title: "Export",
    desc: "Download any chapter as a Word (.docx) file from the chapter editor toolbar. Your writing is always portable — you are never locked in.",
  },
];

function HowToUse() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-6 py-6">
        <Wordmark />
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">← Home</Link>
      </header>

      <main className="mx-auto max-w-3xl px-6 pb-20">
        <div className="rounded-2xl border border-border/70 bg-card p-8 md:p-12">
          <h1 className="font-serif text-4xl font-semibold tracking-tight">How to Use Earnest Writing</h1>
          <p className="mt-4 text-muted-foreground">
            Everything you need to know to get the most out of the app.
          </p>

          <section className="mt-8">
            <h2 className="font-serif text-2xl font-semibold">Getting started</h2>
            <ol className="mt-4 space-y-3 text-sm leading-relaxed text-foreground/80">
              <li className="flex gap-3"><span className="flex-shrink-0 font-semibold text-accent">1.</span><span>Create an account — your writing is saved to the cloud and accessible from any device.</span></li>
              <li className="flex gap-3"><span className="flex-shrink-0 font-semibold text-accent">2.</span><span>Start a new project and choose the category that fits your writing (or skip and decide later).</span></li>
              <li className="flex gap-3"><span className="flex-shrink-0 font-semibold text-accent">3.</span><span>Give your project a working title. Don't agonise over it — titles are easy to change.</span></li>
              <li className="flex gap-3"><span className="flex-shrink-0 font-semibold text-accent">4.</span><span>Set an overall word count target, then create chapters and start writing.</span></li>
            </ol>
          </section>

          <section className="mt-10">
            <h2 className="font-serif text-2xl font-semibold">Features</h2>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              {features.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="rounded-xl border border-border/70 bg-background p-5">
                  <div className="flex items-center gap-2.5">
                    <Icon className="h-4 w-4 text-accent" />
                    <h3 className="font-serif text-base font-semibold">{title}</h3>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{desc}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-10">
            <h2 className="font-serif text-2xl font-semibold">Tips</h2>
            <ul className="mt-4 space-y-3 text-sm leading-relaxed text-foreground/80">
              <li className="flex gap-3"><span className="flex-shrink-0 text-accent">→</span><span>The amber dot in the chapter editor means your work is saving. Green means it's saved. You don't need to do anything manually.</span></li>
              <li className="flex gap-3"><span className="flex-shrink-0 text-accent">→</span><span>You can create chapters from the Plot arcs section as well as the Chapters section — they feed into each other.</span></li>
              <li className="flex gap-3"><span className="flex-shrink-0 text-accent">→</span><span>Use the Notes panel inside the chapter editor for continuity reminders and things to check — they're saved with the chapter.</span></li>
              <li className="flex gap-3"><span className="flex-shrink-0 text-accent">→</span><span>Export your chapters as Word documents regularly. Your writing is always yours and always portable.</span></li>
              <li className="flex gap-3"><span className="flex-shrink-0 text-accent">→</span><span>The dashboard updates automatically as you write — word counts, chapter status, and overall progress are always current.</span></li>
            </ul>
          </section>

          <div className="mt-10">
            <Link
              to="/onboarding"
              className="inline-flex items-center rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-accent-foreground hover:bg-accent/90 transition-colors"
            >
              Start your first project
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
