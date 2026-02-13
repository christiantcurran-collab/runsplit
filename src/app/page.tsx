import Link from "next/link";

const featuredCalculators = [
  {
    href: "/calculators/pace",
    title: "Pace Calculator",
    description: "Distance + Time = Pace. Instant results for any distance.",
    icon: "⏱️",
  },
  {
    href: "/calculators/race-predictor",
    title: "Race Time Predictor",
    description: "Predict your marathon from a 5K. Riegel & Cameron formulas.",
    icon: "🏁",
  },
  {
    href: "/calculators/training-paces",
    title: "Training Paces",
    description: "Easy, tempo, interval paces from your race result.",
    icon: "🎯",
  },
  {
    href: "/calculators/splits",
    title: "Split Calculator",
    description: "Plan your race splits. Even or negative split strategies.",
    icon: "📊",
  },
  {
    href: "/calculators/vo2max",
    title: "VO2max Estimator",
    description: "Estimate your VO2max and fitness level from any race.",
    icon: "🫁",
  },
  {
    href: "/calculators/heart-rate-zones",
    title: "HR Zone Calculator",
    description: "5-zone heart rate training with Karvonen method.",
    icon: "❤️",
  },
];

const allCalculators = [
  { href: "/calculators/speed-converter", label: "Speed / Pace Converter" },
  { href: "/calculators/age-grade", label: "Age-Graded Calculator" },
  { href: "/calculators/calories", label: "Calories Burned" },
  { href: "/calculators/treadmill", label: "Treadmill Converter" },
  { href: "/calculators/negative-split", label: "Negative Split Planner" },
  { href: "/calculators/run-walk", label: "Run/Walk Calculator" },
];

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-brand-black text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="font-heading font-black text-4xl sm:text-5xl lg:text-6xl leading-tight mb-6">
              The running calculators
              <br />
              you&apos;ve been{" "}
              <span className="text-brand-orange">looking for</span>
            </h1>
            <p className="text-gray-400 text-lg sm:text-xl mb-8 max-w-xl mx-auto">
              Free pace calculators, race predictions, training zones and more.
              Beautiful, fast, built for runners. No signup required.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/calculators"
                className="bg-brand-orange hover:bg-brand-orange-hover text-white font-semibold px-8 py-3.5 rounded-xl text-lg transition-colors"
              >
                Open Calculators
              </Link>
              <Link
                href="/pricing"
                className="border border-gray-600 hover:border-gray-400 text-gray-300 hover:text-white font-semibold px-8 py-3.5 rounded-xl text-lg transition-colors"
              >
                Get Pro
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto">
            <div className="text-center">
              <div className="font-heading font-bold text-2xl sm:text-3xl text-brand-orange">12</div>
              <div className="text-gray-500 text-sm mt-1">Free Calculators</div>
            </div>
            <div className="text-center">
              <div className="font-heading font-bold text-2xl sm:text-3xl text-brand-orange">0</div>
              <div className="text-gray-500 text-sm mt-1">Signup Required</div>
            </div>
            <div className="text-center">
              <div className="font-heading font-bold text-2xl sm:text-3xl text-brand-orange">∞</div>
              <div className="text-gray-500 text-sm mt-1">Free Forever</div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured calculators */}
      <section className="bg-gray-50 py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-heading font-bold text-2xl sm:text-3xl text-gray-900 mb-3">
              Popular Calculators
            </h2>
            <p className="text-gray-500 text-lg">
              Real-time results. No buttons to click.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {featuredCalculators.map((calc) => (
              <Link
                key={calc.href}
                href={calc.href}
                className="bg-white rounded-2xl border border-gray-200 p-6 hover:border-brand-orange hover:shadow-lg transition-all group"
              >
                <div className="text-3xl mb-3">{calc.icon}</div>
                <h3 className="font-heading font-semibold text-lg text-gray-900 group-hover:text-brand-orange transition-colors mb-2">
                  {calc.title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed mb-4">
                  {calc.description}
                </p>
                <span className="text-brand-orange text-sm font-medium group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                  Open calculator
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </span>
              </Link>
            ))}
          </div>

          {/* More calculators */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500 mb-4">Plus 6 more calculators:</p>
            <div className="flex flex-wrap justify-center gap-3">
              {allCalculators.map((calc) => (
                <Link
                  key={calc.href}
                  href={calc.href}
                  className="text-sm font-medium text-gray-600 hover:text-brand-orange bg-white border border-gray-200 rounded-full px-4 py-2 transition-colors"
                >
                  {calc.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pro CTA */}
      <section className="py-16 sm:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-brand-black to-gray-900 rounded-3xl p-8 sm:p-12 text-white text-center">
            <h2 className="font-heading font-bold text-2xl sm:text-3xl mb-4">
              Ready for a personalised training plan?
            </h2>
            <p className="text-gray-400 max-w-lg mx-auto mb-8">
              Get an AI-powered training plan built around your fitness, goals, and schedule.
              Race-day pacing strategy, training log, and calendar export included.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/pricing"
                className="bg-brand-orange hover:bg-brand-orange-hover text-white font-semibold px-8 py-3.5 rounded-xl text-lg transition-colors"
              >
                Get RunSplit Pro — £4.99/mo
              </Link>
              <span className="text-gray-500 text-sm">7-day free trial. Cancel anytime.</span>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-gray-50 py-16 sm:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading font-bold text-2xl sm:text-3xl text-center text-gray-900 mb-12">
            Why runners choose RunSplit
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-brand-orange/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-brand-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="font-heading font-semibold text-lg mb-2">Instant Results</h3>
              <p className="text-sm text-gray-500">
                No &ldquo;calculate&rdquo; buttons. Every input change updates results in real time.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-brand-orange/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-brand-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-heading font-semibold text-lg mb-2">Accurate Formulas</h3>
              <p className="text-sm text-gray-500">
                Industry-standard Riegel, Daniels, and Karvonen formulas. Cross-checked against the best.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-brand-orange/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-brand-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="font-heading font-semibold text-lg mb-2">Mobile-First</h3>
              <p className="text-sm text-gray-500">
                Designed for your phone at the track. Large touch targets, clean layout.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
