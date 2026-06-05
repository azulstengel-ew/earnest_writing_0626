import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { FoxLogo, Wordmark } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Check, ArrowRight, ArrowLeft, Loader2 } from "lucide-react";
import { useProjects, THEME_CONFIGS, type ProjectTheme } from "@/lib/projects-store";
import { useAuth } from "@/hooks/use-auth";

const ONBOARDING_GROUPS = [
  {
    id: "creative-writing",
    title: "Creative writing",
    desc: "Stories, scripts, poetry, and imaginative worlds",
    bg: "#FEF3E8",
    themes: [
      { theme: "books-memoir" as ProjectTheme, color: "#F47920" },
      { theme: "screenplays-tv" as ProjectTheme, color: "#F5C518" },
      { theme: "poetry-verse" as ProjectTheme, color: "#C8394A" },
    ],
  },
  {
    id: "professional-writing",
    title: "Professional writing",
    desc: "Copy, campaigns, content, and communication",
    bg: "#FFF0F0",
    themes: [
      { theme: "copywriting" as ProjectTheme, color: "#2E6DA4" },
      { theme: "ads-campaigns" as ProjectTheme, color: "#FF5050" },
      { theme: "social-media" as ProjectTheme, color: "#00C2A8" },
      { theme: "newsletter" as ProjectTheme, color: "#E8A020" },
    ],
  },
  {
    id: "academic",
    title: "Academic & non-fiction",
    desc: "Research, essays, and knowledge",
    bg: "#EEF6EC",
    themes: [
      { theme: "dissertation" as ProjectTheme, color: "#4A7C3F" },
      { theme: "essays" as ProjectTheme, color: "#7AB648" },
    ],
  },
  {
    id: "personal",
    title: "Personal & other",
    desc: "Journals, ideas, and private thinking",
    bg: "#F0EBF8",
    themes: [
      { theme: "journaling" as ProjectTheme, color: "#7B5EA7" },
      { theme: "ideating" as ProjectTheme, color: "#6BAED6" },
    ],
  },
];

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "Begin a project — Earnest Writing" },
      { name: "description", content: "Set the shape of your next piece of writing." },
    ],
  }),
  component: Onboarding,
});

function Onboarding() {
  const navigate = useNavigate();
  const { createProject } = useProjects();
  const { register, user } = useAuth();

  const isLoggedIn = !!user;

  const [step, setStep] = useState(isLoggedIn ? 2 : 1);
  const [betaCode, setBetaCode] = useState("");
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [theme, setTheme] = useState<ProjectTheme | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [premise, setPremise] = useState("");
  const [target, setTarget] = useState("50000");

  const totalSteps = isLoggedIn ? 3 : 4;
  const displayStep = isLoggedIn ? step - 1 : step;

  const displayNameValid = displayName.trim().length >= 1;
  const betaCodeValid = betaCode.trim().toLowerCase() === "earnest2025";
  const passwordValid = password.length >= 8;
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const canNext =
    (step === 1 && emailValid && displayNameValid && passwordValid && betaCodeValid) ||
    step === 2 ||
    (step === 3 && title.trim()) ||
    step === 4;

  const handleRegisterAndNext = async () => {
    setAuthError("");
    setAuthLoading(true);
    try {
      await register(email.trim(), password, displayName.trim());
      navigate({ to: "/home" });
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setAuthLoading(false);
    }
  };

  const finish = () => {
    const resolvedTheme = theme ?? "books-memoir";
    const project = createProject({
      title: title.trim(),
      theme: resolvedTheme,
      premise: premise.trim(),
      target: Number(target) || 50000,
    });
    navigate({ to: "/project/$projectId", params: { projectId: project.id } });
  };

  const skipTheme = () => {
    if (!theme) setTheme("books-memoir");
    setStep(3);
  };

  const next = async () => {
    if (step === 1 && !isLoggedIn) {
      await handleRegisterAndNext();
      return;
    }
    if (step < 4) {
      setStep(step + 1);
    } else {
      finish();
    }
  };

  const back = () => {
    if (step <= (isLoggedIn ? 2 : 1)) {
      navigate({ to: "/home" });
    } else {
      setStep(step - 1);
    }
  };

  const isLastStep = step === 4;

  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-6 py-6">
        <Wordmark />
        <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Step {displayStep} of {totalSteps}
        </span>
      </header>

      <div className="mx-auto max-w-3xl px-6">
        <div className="flex gap-1.5">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors ${i < displayStep ? "bg-accent" : "bg-border"}`}
            />
          ))}
        </div>
      </div>

      <main className="mx-auto max-w-3xl px-6 py-12">
        <div className="animate-ink-fade rounded-2xl border border-border/70 bg-card p-8 md:p-12">

          {/* Step 1 — Account creation (skipped if already logged in) */}
          {step === 1 && !isLoggedIn && (
            <div className="space-y-6">
              <FoxLogo className="h-20 w-20" float />
              <div>
                <h1 className="font-serif text-3xl font-semibold tracking-tight">Let's begin properly.</h1>
                <p className="mt-2 text-muted-foreground">Create your account. Your writing will be saved and accessible from any device.</p>
                <div className="mt-3 rounded-lg bg-accent/10 border border-accent/20 px-3 py-2 text-xs text-foreground/70 leading-relaxed">You are joining the closed beta. Your writing is saved but this is an early version — please export anything important using the Word button in each chapter.</div>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="betaCode">Beta access code</Label>
                  <Input
                    id="betaCode"
                    value={betaCode}
                    onChange={(e) => setBetaCode(e.target.value)}
                    placeholder="Enter your beta code"
                    autoComplete="off"
                    className={betaCode && !betaCodeValid ? "border-destructive focus-visible:ring-destructive/30" : betaCodeValid ? "border-green-500" : ""}
                  />
                  {betaCode && !betaCodeValid && (
                    <p className="text-xs text-destructive">Invalid beta code.</p>
                  )}
                  {betaCodeValid && (
                    <p className="text-xs text-green-600">Access granted.</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    className={email && !emailValid ? "border-destructive focus-visible:ring-destructive/30" : ""}
                  />
                  {email && !emailValid && email.includes("@") && (
                    <p className="text-xs text-destructive">Please enter a valid email address.</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="displayName">Your name</Label>
                  <Input
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="How should we call you?"
                    autoComplete="name"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    autoComplete="new-password"
                    className={password && !passwordValid ? "border-destructive focus-visible:ring-destructive/30" : ""}
                    onKeyDown={(e) => e.key === "Enter" && canNext && next()}
                  />
                  {password && !passwordValid && (
                    <p className="text-xs text-destructive">Password must be at least 8 characters.</p>
                  )}
                </div>
                {authError && <p className="text-sm text-destructive">{authError}</p>}
              </div>
            </div>
          )}

          {/* Step 2 — Theme / Category (two-step) */}
          {step === 2 && (
            <div className="space-y-6">
              {!selectedGroup ? (
                /* Step 2a — Group selection */
                <>
                  <div>
                    <h1 className="font-serif text-3xl font-semibold tracking-tight">
                      What kind of writing is this?
                    </h1>
                    <p className="mt-2 text-muted-foreground">Choose a broad category to get started.</p>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {ONBOARDING_GROUPS.map((group) => (
                      <button
                        key={group.id}
                        type="button"
                        onClick={() => setSelectedGroup(group.id)}
                        className="group text-left transition-all hover:-translate-y-0.5 hover:shadow-md"
                        style={{ backgroundColor: group.bg, borderRadius: "16px", padding: "24px" }}
                      >
                        <h3 className="font-serif text-xl font-semibold text-foreground">{group.title}</h3>
                        <p className="mt-1.5 text-sm text-muted-foreground">{group.desc}</p>
                        <div className="mt-4 flex flex-wrap gap-1.5">
                          {group.themes.map(({ theme: t, color }) => (
                            <span
                              key={t}
                              className="rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
                              style={{ backgroundColor: color }}
                            >
                              {THEME_CONFIGS[t].label}
                            </span>
                          ))}
                        </div>
                      </button>
                    ))}
                  </div>
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={skipTheme}
                      className="text-sm text-muted-foreground underline-offset-4 hover:underline"
                    >
                      Skip for now
                    </button>
                  </div>
                </>
              ) : (
                /* Step 2b — Category selection within chosen group */
                (() => {
                  const group = ONBOARDING_GROUPS.find((g) => g.id === selectedGroup)!;
                  return (
                    <>
                      <div>
                        <button
                          type="button"
                          onClick={() => setSelectedGroup(null)}
                          className="mb-4 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <ArrowLeft className="h-3.5 w-3.5" /> Back
                        </button>
                        <h1 className="font-serif text-3xl font-semibold tracking-tight">{group.title}</h1>
                        <p className="mt-2 text-muted-foreground">Pick a specific category for this project.</p>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {group.themes.map(({ theme: t }) => {
                          const cfg = THEME_CONFIGS[t];
                          const isActive = theme === t;
                          return (
                            <button
                              key={t}
                              type="button"
                              onClick={() => { setTheme(t); setStep(3); }}
                              className="group rounded-xl p-5 text-left transition-all hover:-translate-y-0.5 hover:shadow-sm"
                              style={{
                                backgroundColor: cfg.cardTint,
                                borderLeft: `4px solid ${cfg.accent}`,
                              }}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-semibold text-foreground">{cfg.label}</span>
                                {isActive && <Check className="h-4 w-4 flex-shrink-0" style={{ color: cfg.accent }} />}
                              </div>
                              <p className="mt-1 text-xs text-muted-foreground">{cfg.desc}</p>
                            </button>
                          );
                        })}
                      </div>
                    </>
                  );
                })()
              )}
            </div>
          )}

          {/* Step 3 — Title */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h1 className="font-serif text-3xl font-semibold tracking-tight">Give it a working title.</h1>
                <p className="mt-2 text-muted-foreground">Don't fuss over it. The best titles arrive on the second draft anyway.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  autoFocus
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && title.trim() && next()}
                  placeholder="A working title…"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="premise">A sentence or two about it (optional)</Label>
                <Textarea
                  id="premise"
                  rows={3}
                  value={premise}
                  onChange={(e) => setPremise(e.target.value)}
                  placeholder="What it's about, in your own words…"
                />
              </div>
            </div>
          )}

          {/* Step 4 — Target */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h1 className="font-serif text-3xl font-semibold tracking-tight">Set a quiet ambition.</h1>
                <p className="mt-2 text-muted-foreground">A target word count helps us pace your sessions. You can change it any time.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="target">Target word count</Label>
                <Input
                  id="target"
                  type="number"
                  min={500}
                  step={500}
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Common: 1,500 (essay) · 20,000 (novella) · 50,000 (NaNoWriMo) · 80,000 (novel)
                </p>
              </div>
            </div>
          )}

          <div className="mt-10 flex items-center justify-between">
            <Button variant="ghost" onClick={back}>
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            <Button
              onClick={next}
              disabled={!canNext || authLoading}
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              {authLoading
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <>{isLastStep ? "Enter the study" : "Continue"} <ArrowRight className="h-4 w-4" /></>
              }
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
