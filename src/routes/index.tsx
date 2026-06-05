import { useState, useCallback } from "react";
import { createFileRoute, Link, useNavigate, Navigate } from "@tanstack/react-router";
import { FoxLogo, Wordmark } from "@/components/brand";
import { AnimatedHeadline } from "@/components/AnimatedHeadline";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Loader2, ArrowLeft, Mail } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Footer } from "@/components/Footer";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Earnest Writing — A calm home for your words" },
      {
        name: "description",
        content:
          "A literary writing platform for novelists, screenwriters, academics and content creators. Quietly powerful tools for the work that matters.",
      },
    ],
  }),
  component: Landing,
});

type CardMode = "signin" | "forgot";

function Landing() {
  const { login, user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<CardMode>("signin");
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [isNewAccount, setIsNewAccount] = useState(false);
  const [touched, setTouched] = useState({ email: false, password: false, displayName: false });
  const [signInError, setSignInError] = useState("");
  const [signInLoading, setSignInLoading] = useState(false);
  const [subtitleVisible, setSubtitleVisible] = useState(false);

  const handleLanded = useCallback(() => setSubtitleVisible(true), []);

  if (!authLoading && user) {
    return <Navigate to="/home" />;
  }

  const emailError = touched.email && !email.trim() ? "Please enter your email." : "";
  const passwordError = touched.password && password.length < 8 ? "Password must be at least 8 characters." : "";
  const displayNameError = touched.displayName && isNewAccount && !displayName.trim() ? "Please enter your name." : "";
  const formValid = email.trim().length > 0 && password.length >= 8 && (!isNewAccount || displayName.trim().length > 0);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ email: true, password: true, displayName: true });
    if (!formValid) return;
    setSignInError("");
    setSignInLoading(true);
    try {
      if (isNewAccount) {
        await register(email.trim(), password, displayName.trim());
      } else {
        await login(email.trim(), password);
      }
      navigate({ to: "/home" });
    } catch (err) {
      setSignInError(err instanceof Error ? err.message : "Sign in failed. Please try again.");
    } finally {
      setSignInLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Wordmark />
        <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
          <Link to="/who-is-it-for" className="hover:text-foreground transition-colors">Who it's for</Link>
          <Link to="/about" className="hover:text-foreground">About</Link>
          <Link to="/how-to-use" className="hover:text-foreground">How to use</Link>
          <a href="#sign-in" className="hover:text-foreground">Sign in</a>
        </nav>
      </header>

      <main className="mx-auto grid max-w-6xl gap-12 px-6 pb-20 pt-12 md:grid-cols-[1.15fr_1fr] md:gap-16 md:pt-20">
        {/* Left: brand + categories */}
        <section className="animate-ink-fade flex flex-col">
          <div className="flex items-center gap-5">
            <FoxLogo className="h-32 w-32 md:h-40 md:w-40" float />
            <div>
              <AnimatedHeadline onLanded={handleLanded} />
              <p
                className="mt-3 max-w-md text-muted-foreground transition-opacity duration-700"
                style={{ opacity: subtitleVisible ? 1 : 0 }}
              >
                A place for every word you mean to write.
              </p>
            </div>
          </div>

          <p className="mt-8 max-w-lg font-serif text-foreground/90 md:text-2xl text-[18px]">
            Quietly powerful tools for the work that matters — built for the
            long form, the careful sentence, and the patient draft.
          </p>

          <div id="who" className="mt-10">
            <Link
              to="/who-is-it-for"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
            >
              Novelists, screenwriters, poets, academics, journalists, and more
              <span className="group-hover:translate-x-0.5 transition-transform">→</span>
            </Link>
          </div>
        </section>

        {/* Right: card */}
        <section id="sign-in" className="md:pt-4">
          <Card className="border-border/70 bg-card p-8 shadow-sm">

            {/* ── Sign in ── */}
            {mode === "signin" && (
              <>
                <h2 className="font-serif text-2xl font-semibold">Welcome back</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {isNewAccount ? "Create account" : "Sign in"} to return to your projects.
                </p>
                <form className="mt-6 space-y-4" onSubmit={handleSignIn} noValidate>
                  <div className="space-y-1.5">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setSignInError(""); }}
                      onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                      className={emailError ? "border-destructive focus-visible:ring-destructive/30" : ""}
                      required
                      autoComplete="email"
                    />
                    {emailError && <p className="text-xs text-destructive">{emailError}</p>}
                    {isNewAccount && (
                      <div className="space-y-1.5 mt-3">
                        <Label htmlFor="displayName">Your name</Label>
                        <Input
                          id="displayName"
                          type="text"
                          placeholder="How should we call you?"
                          value={displayName}
                          onChange={(e) => { setDisplayName(e.target.value); }}
                          autoComplete="name"
                        />
                        {displayNameError && <p className="text-xs text-destructive">{displayNameError}</p>}
                      </div>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Password</Label>
                      <button
                        type="button"
                        onClick={() => setMode("forgot")}
                        className="text-xs text-muted-foreground hover:text-accent transition-colors"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setSignInError(""); }}
                      onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                      className={passwordError ? "border-destructive focus-visible:ring-destructive/30" : ""}
                      required
                      autoComplete="current-password"
                    />
                    {passwordError && <p className="text-xs text-destructive">{passwordError}</p>}
                  </div>
                  {signInError && (
                    <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2">
                      <p className="text-sm text-destructive">{signInError}</p>
                    </div>
                  )}
                  <Button
                    type="submit"
                    disabled={signInLoading}
                    className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                  >
                    {signInLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign in"}
                  </Button>
                </form>
                <p className="mt-6 text-center text-sm text-muted-foreground">
                  New here?{" "}
                  <Link to="/onboarding" className="font-medium text-accent hover:underline">
                    Start your first project
                  </Link>
                </p>
              </>
            )}

            {/* ── Forgot password ── */}
            {mode === "forgot" && (
              <>
                <button
                  type="button"
                  onClick={() => setMode("signin")}
                  className="mb-4 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
                </button>
                <h2 className="font-serif text-2xl font-semibold">Forgot your password?</h2>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  Password resets are handled securely via email. Write to us and we'll send you a reset link promptly.
                </p>
                <a
                  href="mailto:contact@earnestwriting.com?subject=Password%20reset%20request"
                  className="mt-6 flex items-center gap-3 rounded-xl border border-border bg-card px-5 py-4 transition-colors hover:border-accent/50 hover:bg-accent/5"
                >
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-accent/10">
                    <Mail className="h-4 w-4 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">contact@earnestwriting.com</p>
                    <p className="text-xs text-muted-foreground">Opens your email client</p>
                  </div>
                </a>
                <p className="mt-5 text-xs text-muted-foreground">
                  Please include your username in the message so we can find your account quickly.
                </p>
              </>
            )}

          </Card>
        </section>
      </main>

      <Footer />
    </div>
  );
}
