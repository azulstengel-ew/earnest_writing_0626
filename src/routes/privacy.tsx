import { createFileRoute, Link } from "@tanstack/react-router";
import { Wordmark } from "@/components/brand";
import { Footer } from "@/components/Footer";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Earnest Writing" },
      { name: "description", content: "How Earnest Writing collects, uses, and protects your data." },
    ],
  }),
  component: Privacy,
});

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="font-serif text-xl font-semibold tracking-tight">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-foreground/80">{children}</div>
    </section>
  );
}

function Privacy() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-6 py-6">
        <Wordmark />
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">← Home</Link>
      </header>

      <main className="mx-auto max-w-3xl px-6 pb-20">
        <div className="rounded-2xl border border-border/70 bg-card p-8 md:p-12">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Last updated: May 2025</p>
          <h1 className="mt-3 font-serif text-4xl font-semibold tracking-tight">Privacy Policy</h1>
          <p className="mt-4 text-muted-foreground">
            Earnest Writing ("we", "us", "our") is committed to protecting your privacy. This policy explains what information we collect, how we use it, and what rights you have over it.
            If you have any questions, contact us at{" "}
            <a href="mailto:contact@earnestwriting.com" className="text-accent hover:underline">contact@earnestwriting.com</a>.
          </p>

          <Section title="1. Who we are">
            <p>Earnest Writing is a writing platform that helps writers plan, write, and track their creative projects.</p>
          </Section>

          <Section title="2. What information we collect">
            <p><strong>Information you give us directly:</strong></p>
            <ul className="ml-4 list-disc space-y-1">
              <li>Your username and password when you create an account</li>
              <li>Your display name if you choose to add one</li>
              <li>The writing content you create — projects, chapters, characters, notes, and any other content you enter into the app</li>
            </ul>
            <p className="mt-3"><strong>Information collected automatically:</strong></p>
            <ul className="ml-4 list-disc space-y-1">
              <li>Basic usage data — which pages you visit, when you log in, how long sessions last</li>
              <li>Your IP address and browser type, collected automatically by our infrastructure providers</li>
              <li>Cookies required for the app to function (keeping you logged in, remembering preferences)</li>
            </ul>
            <p className="mt-3"><strong>Information we do NOT collect:</strong></p>
            <ul className="ml-4 list-disc space-y-1">
              <li>We do not collect payment information directly — payments are handled by Stripe and we never see your card details</li>
              <li>We do not sell your data to anyone, ever</li>
              <li>We do not use your writing content to train AI models</li>
              <li>We do not share your personal information with advertisers</li>
            </ul>
          </Section>

          <Section title="3. How we use your information">
            <p>We use the information we collect to:</p>
            <ul className="ml-4 list-disc space-y-1">
              <li>Provide and operate the Earnest Writing service</li>
              <li>Keep your account secure and authenticated</li>
              <li>Save and sync your writing content across devices</li>
              <li>Send you account-related emails (password reset, important service updates)</li>
              <li>Understand how the app is used so we can improve it</li>
              <li>Respond to support requests</li>
            </ul>
          </Section>

          <Section title="4. Your writing belongs to you">
            <p>
              You own all the writing content you create in Earnest Writing. We do not claim any rights over your stories, screenplays, essays, journals, or any other content you write here.
            </p>
            <p>We store your content solely to provide the service to you. We will never:</p>
            <ul className="ml-4 list-disc space-y-1">
              <li>Publish your writing without your explicit permission</li>
              <li>Share your writing with other users without your permission</li>
              <li>Use your writing to train AI models or any other machine learning system</li>
              <li>Sell or license your writing to any third party</li>
            </ul>
          </Section>

          <Section title="5. Who we share your data with">
            <p>We share your data only with the services required to operate the app:</p>
            <ul className="ml-4 list-disc space-y-1">
              <li><strong>Database provider</strong> — your account data and writing content is stored on our database infrastructure</li>
              <li><strong>Hosting provider</strong> — serves the app to your browser</li>
              <li><strong>Anthropic</strong> — when you use AI features, your request and relevant content is sent to Anthropic's Claude API. We send only what is needed for the specific feature. See <a href="https://anthropic.com/privacy" className="text-accent hover:underline" target="_blank" rel="noopener noreferrer">Anthropic's privacy policy</a></li>
            </ul>
            <p>We do not share your data with any other third parties.</p>
          </Section>

          <Section title="6. Data storage and security">
            <p>
              We use standard security practices including hashed passwords and secure session tokens. No system is perfectly secure, but we take reasonable technical measures to protect your data. If there is ever a data breach that affects you, we will notify you as required by law.
            </p>
          </Section>

          <Section title="7. How long we keep your data">
            <p>
              We keep your data for as long as your account is active. If you delete your account, we delete your personal data and all your writing content within 30 days. Some anonymised usage data may be retained for analytics purposes.
            </p>
          </Section>

          <Section title="8. Your rights">
            <p>Depending on where you live, you may have the following rights:</p>
            <ul className="ml-4 list-disc space-y-1">
              <li><strong>Right to access</strong> — you can request a copy of all personal data we hold about you</li>
              <li><strong>Right to correction</strong> — you can ask us to correct inaccurate information</li>
              <li><strong>Right to deletion</strong> — you can delete your account at any time, which deletes all your data</li>
              <li><strong>Right to portability</strong> — you can request your writing content in a downloadable format (we also provide Word document export within the app)</li>
            </ul>
            <p className="mt-3">
              <strong>GDPR (European users)</strong> — if you are in the EEA, UK, or Switzerland, you have full GDPR rights. Our legal basis for processing your data is contract performance (to provide the service) and legitimate interests (to improve and secure the service).
            </p>
            <p>
              <strong>CCPA (California users)</strong> — we do not sell your personal information.
            </p>
            <p>To exercise any of these rights, contact us at <a href="mailto:contact@earnestwriting.com" className="text-accent hover:underline">contact@earnestwriting.com</a>. We will respond within 30 days.</p>
          </Section>

          <Section title="9. Cookies">
            <p>
              We use only essential cookies — the minimum required to keep you logged in and remember your preferences. We do not use advertising cookies, tracking cookies, or Google Analytics.
            </p>
          </Section>

          <Section title="10. Children">
            <p>
              Earnest Writing is not directed at children under 13. We do not knowingly collect personal data from children under 13. If you believe a child under 13 has created an account, please contact us and we will delete it.
            </p>
          </Section>

          <Section title="11. Changes to this policy">
            <p>
              If we make significant changes to this policy, we will notify you by email or by a notice in the app before the changes take effect.
            </p>
          </Section>

          <Section title="12. Contact us">
            <p>
              For any privacy questions or to exercise your rights:{" "}
              <a href="mailto:contact@earnestwriting.com" className="text-accent hover:underline">contact@earnestwriting.com</a>
            </p>
          </Section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
