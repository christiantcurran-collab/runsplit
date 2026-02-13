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
    <footer className="bg-bg-dark text-zinc-500 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 bg-brand rounded-lg flex items-center justify-center font-heading font-extrabold text-xs text-white">
                R
              </div>
              <span className="font-heading font-bold text-lg text-white tracking-tight">
                Run<span className="text-brand">Split</span>
              </span>
            </Link>
            <p className="text-sm leading-relaxed text-zinc-500">
              AI-powered running intelligence. Free tools, personalised coaching, smarter training.
            </p>
          </div>

          {/* Tools */}
          <div className="md:col-span-2">
            <h3 className="text-white font-heading font-semibold text-xs mb-4 uppercase tracking-widest">
              Free Tools
            </h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2">
              {toolLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm hover:text-white transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Product */}
          <div>
            <h3 className="text-white font-heading font-semibold text-xs mb-4 uppercase tracking-widest">
              Product
            </h3>
            <div className="flex flex-col gap-2">
              <Link href="/tools" className="text-sm hover:text-white transition-colors">
                All Tools
              </Link>
              <Link href="/pricing" className="text-sm hover:text-white transition-colors">
                Pro Pricing
              </Link>
              <Link href="/coach" className="text-sm hover:text-white transition-colors">
                AI Coach
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t border-white/[0.06] mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-xs text-zinc-600">
            &copy; {new Date().getFullYear()} RunSplit. All rights reserved.
          </span>
          <span className="text-xs text-zinc-600">
            Built for runners who take it seriously.
          </span>
        </div>
      </div>
    </footer>
  );
}
