import { createFileRoute, Link } from "@tanstack/react-router";
import { Wordmark } from "@/components/brand";
import { Footer } from "@/components/Footer";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — Earnest Writing" },
      { name: "description", content: "The terms under which you use Earnest Writing." },
    ],
  }),
  component: Terms,
});

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="font-serif text-xl font-semibold tracking-tight">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-foreground/80">{children}</div>
    </section>
  );
}

function Terms() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-6 py-6">
        <Wordmark />
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">← Home</Link>
      </header>

      <main className="mx-auto max-w-3xl px-6 pb-20">
        <div className="rounded-2xl border border-border/70 bg-card p-8 md:p-12">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Last updated: May 2025</p>
          <h1 className="mt-3 font-serif text-4xl font-semibold tracking-tight">Terms of Service</h1>
          <p className="mt-4 text-muted-foreground">
            Welcome to Earnest Writing. By creating an account and using this service, you agree to these terms. They are written in plain language and there are no surprises.
            If you do not agree, please do not use Earnest Writing. Questions? Contact us at{" "}
            <a href="mailto:contact@earnestwriting.com" className="text-accent hover:underline">contact@earnestwriting.com</a>.
          </p>

          <Section title="1. The service">
            <p>
              Earnest Writing is a writing platform that lets you plan, write, and track creative writing projects. We provide the tools; the writing is yours.
            </p>
            <p>We may update, improve, or change features of the service over time. We will try to give reasonable notice of significant changes.</p>
          </Section>

          <Section title="2. Your account">
            <p>You must be at least 13 years old to create an account. If you are under 18, you should have permission from a parent or guardian.</p>
            <p>You are responsible for keeping your login credentials secure. Do not share your password. If you think your account has been compromised, contact us immediately.</p>
            <p>You may only have one account per person. Creating multiple accounts to circumvent restrictions is not allowed.</p>
          </Section>

          <Section title="3. You own your writing">
            <p>
              Everything you write in Earnest Writing belongs to you. We make no claim over your stories, screenplays, essays, journals, or any other creative content you produce using this service.
            </p>
            <p>
              We store your content to provide the service. We will never publish, share, sell, or use your writing without your explicit permission. See the{" "}
              <Link to="/privacy" className="text-accent hover:underline">Privacy Policy</Link> for full details.
            </p>
            <p>When you delete your account, your content is deleted from our servers within 30 days.</p>
          </Section>

          <Section title="4. Acceptable use">
            <p>You agree to use Earnest Writing only for lawful purposes. You agree not to:</p>
            <ul className="ml-4 list-disc space-y-1">
              <li>Upload or write content that is illegal in your jurisdiction</li>
              <li>Use the service to harass, threaten, or harm others</li>
              <li>Attempt to access other users' accounts or data</li>
              <li>Reverse engineer, copy, or redistribute the app or its code</li>
              <li>Use automated tools to scrape or extract data from the service</li>
              <li>Attempt to overload or disrupt the service</li>
              <li>Use the AI features to generate content that violates Anthropic's usage policies</li>
            </ul>
            <p>We reserve the right to suspend or terminate accounts that violate these terms.</p>
          </Section>

          <Section title="5. AI features">
            <p>Earnest Writing includes optional AI-powered features powered by Anthropic's Claude API. By using these features, you understand that:</p>
            <ul className="ml-4 list-disc space-y-1">
              <li>The text you submit for AI processing is sent to Anthropic's API</li>
              <li>AI-generated suggestions are not guaranteed to be accurate, original, or appropriate for your specific use</li>
              <li>You are responsible for reviewing and deciding whether to use any AI-generated content</li>
              <li>Anthropic's own usage policies apply to AI feature use</li>
            </ul>
          </Section>

          <Section title="6. Availability and reliability">
            <p>
              We aim to keep Earnest Writing available and working well. However, we cannot guarantee 100% uptime. The service may be unavailable due to maintenance, technical issues, or circumstances outside our control.
            </p>
            <p>
              We are not liable for any loss caused by service unavailability, including loss of writing content. We strongly recommend using the built-in Word document export feature to keep local copies of important work.
            </p>
          </Section>

          <Section title="7. Paid features">
            <p>
              If and when we introduce paid features or subscription plans, the specific terms will be presented clearly at the point of purchase. Payments are processed by Stripe. We do not store your payment details.
            </p>
          </Section>

          <Section title="8. Termination">
            <p>You can delete your account at any time from your account settings. This permanently deletes your data.</p>
            <p>We may suspend or terminate accounts that violate these terms or engage in abusive behaviour. We will try to give notice where possible, except in cases of serious violations.</p>
            <p>If we ever decide to shut down Earnest Writing entirely, we will give at least 90 days notice and provide a way to export all your writing content before closure.</p>
          </Section>

          <Section title="9. Limitation of liability">
            <p>Earnest Writing is provided as-is. To the fullest extent permitted by law, we are not liable for:</p>
            <ul className="ml-4 list-disc space-y-1">
              <li>Loss of writing content (back up your work using the export feature)</li>
              <li>Indirect or consequential losses arising from use of the service</li>
              <li>Losses arising from service unavailability or technical failures</li>
            </ul>
            <p>
              Our total liability to you for any claim will not exceed the amount you have paid us in the 12 months preceding the claim (or €50 if you have paid nothing).
            </p>
            <p>Nothing in these terms limits liability for fraud, death, or personal injury caused by our negligence — as required by law.</p>
          </Section>

          <Section title="10. Governing law">
            <p>These terms are governed by the laws of France. Any disputes will be resolved in the courts of France, unless consumer protection laws in your country require otherwise.</p>
          </Section>

          <Section title="11. Changes to these terms">
            <p>
              If we make significant changes to these terms, we will notify you by email or in-app notice at least 14 days before the changes take effect. Continued use of the service after that date means you accept the new terms.
            </p>
          </Section>

          <Section title="12. Contact">
            <p>
              For any questions about these terms:{" "}
              <a href="mailto:contact@earnestwriting.com" className="text-accent hover:underline">contact@earnestwriting.com</a>
            </p>
          </Section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
