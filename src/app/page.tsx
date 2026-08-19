import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";

export default function LandingPage() {
  return (
    <main>
      <section className="relative overflow-hidden bg-abyss-900 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(31,117,171,0.35),_transparent_60%)]" />
        <div className="relative mx-auto max-w-6xl px-6 py-20 sm:py-28">
          <p className="mb-4 text-sm uppercase tracking-[0.2em] text-ocean-300">
            An independent dive destination guide
          </p>
          <h1 className="max-w-2xl font-display text-4xl leading-tight sm:text-6xl">
            Where should you dive next?
          </h1>
          <p className="mt-6 max-w-xl text-lg text-abyss-100">
            Tell us your dates, budget, level and the animals you want to see. DiveFinder explains
            exactly why each destination matches — and is honest about what it doesn&apos;t know yet.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/discover" size="lg" variant="primary">
              Find my dive destination
            </ButtonLink>
            <ButtonLink href="/wildlife" size="lg" variant="outlineInverse">
              Browse by animal
            </ButtonLink>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-14">
        <h2 className="font-display text-2xl text-abyss-900">Start however you know best</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <QuickCard
            href="/discover?entry=dates"
            title="I know my dates"
            description="Tell us when and how long, we'll narrow down where conditions line up."
          />
          <QuickCard
            href="/discover?entry=animal"
            title="I want to see an animal"
            description="Whale sharks, mantas, hammerheads — start from the wildlife you're chasing."
          />
          <QuickCard
            href="/discover?entry=destination"
            title="I know my destination"
            description="Already have somewhere in mind? Check suitability and see what's verified."
          />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="rounded-xl2 border border-abyss-100 bg-sand-100 p-6 sm:p-8">
          <h2 className="font-display text-xl text-abyss-900">Explainable, not hype-driven</h2>
          <p className="mt-2 max-w-2xl text-sm text-abyss-600">
            Every match score comes with a data completeness score, a &ldquo;why it matches&rdquo; breakdown, and
            visible source freshness. We never invent depth, price, or wildlife-probability figures —
            unverified fields show as unknown rather than guessed.
          </p>
          <Link href="/discover" className="focus-ring mt-4 inline-block text-sm font-medium text-ocean-700 underline">
            Start a search →
          </Link>
        </div>
      </section>
    </main>
  );
}

function QuickCard({ href, title, description }: { href: string; title: string; description: string }) {
  return (
    <Link
      href={href}
      className="focus-ring block rounded-xl2 border border-abyss-100 bg-white p-5 shadow-card transition-transform hover:-translate-y-0.5"
    >
      <h3 className="font-display text-lg text-abyss-900">{title}</h3>
      <p className="mt-2 text-sm text-abyss-500">{description}</p>
    </Link>
  );
}
