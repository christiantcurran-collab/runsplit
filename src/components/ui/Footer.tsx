import Link from "next/link";

const toolLinks = [
  { href: "/tools/pace", label: "Pace & Speed" },
  { href: "/tools/predict", label: "What Can I Run?" },
  { href: "/tools/splits", label: "Race Split Planner" },
  { href: "/tools/training-paces", label: "Find My Training Paces" },
  { href: "/tools/convert", label: "Pace Converter" },
  { href: "/tools/age-grade", label: "How Good Is My Time?" },
  { href: "/tools/vo2max", label: "Estimate My VO2max" },
  { href: "/tools/heart-rate", label: "My Heart Rate Zones" },
  { href: "/tools/calories", label: "Calories Burned" },
  { href: "/tools/treadmill", label: "Treadmill vs Outdoor" },
  { href: "/tools/negative-split", label: "Negative Split Strategy" },
  { href: "/tools/run-walk", label: "Run/Walk Planner" },
];

export default function Footer() {
  return (
    <footer className="bg-bg-dark text-text-dark-muted mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <div className="w-6 h-[3px] bg-brand rounded-sm" />
              <span className="font-heading font-bold text-lg text-text-on-dark tracking-tight">
                RunSplit
              </span>
            </Link>
            <p className="text-sm leading-relaxed">
              AI-powered running intelligence. Free tools, personalised coaching, smarter training.
            </p>
          </div>

          {/* Tools */}
          <div className="md:col-span-2">
            <h3 className="text-text-on-dark font-heading font-semibold text-xs mb-4 uppercase tracking-widest">
              Free Tools
            </h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2">
              {toolLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-text-dark-sec hover:text-white transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Product */}
          <div>
            <h3 className="text-text-on-dark font-heading font-semibold text-xs mb-4 uppercase tracking-widest">
              Product
            </h3>
            <div className="flex flex-col gap-2">
              <Link href="/tools" className="text-sm text-text-dark-sec hover:text-white transition-colors">
                All Tools
              </Link>
              <Link href="/plans" className="text-sm text-text-dark-sec hover:text-white transition-colors">
                Free Plans
              </Link>
              <Link href="/pricing" className="text-sm text-text-dark-sec hover:text-white transition-colors">
                Pro Pricing
              </Link>
              <Link href="/coach" className="text-sm text-text-dark-sec hover:text-white transition-colors">
                AI Coach
              </Link>
              <Link href="/support" className="text-sm text-text-dark-sec hover:text-white transition-colors">
                Support
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t border-bg-dark-border mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-xs text-text-dark-muted">
            &copy; {new Date().getFullYear()} RunSplit. All rights reserved.
          </span>
          <span className="text-xs text-text-dark-muted">
            Built for runners who take it seriously.
          </span>
        </div>
      </div>
    </footer>
  );
}



