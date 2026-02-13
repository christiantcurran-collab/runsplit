import Link from "next/link";

const calculatorLinks = [
  { href: "/calculators/pace", label: "Pace Calculator" },
  { href: "/calculators/race-predictor", label: "Race Predictor" },
  { href: "/calculators/splits", label: "Split Calculator" },
  { href: "/calculators/training-paces", label: "Training Paces" },
  { href: "/calculators/speed-converter", label: "Speed Converter" },
  { href: "/calculators/age-grade", label: "Age Grade" },
  { href: "/calculators/vo2max", label: "VO2max" },
  { href: "/calculators/heart-rate-zones", label: "HR Zones" },
  { href: "/calculators/calories", label: "Calories" },
  { href: "/calculators/treadmill", label: "Treadmill" },
  { href: "/calculators/negative-split", label: "Negative Split" },
  { href: "/calculators/run-walk", label: "Run/Walk" },
];

export default function Footer() {
  return (
    <footer className="bg-brand-black text-gray-400 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 bg-brand-orange rounded-lg flex items-center justify-center font-heading font-black text-xs text-white">
                R
              </div>
              <span className="font-heading font-bold text-lg text-white tracking-tight">
                Run<span className="text-brand-orange">Split</span>
              </span>
            </Link>
            <p className="text-sm leading-relaxed">
              Free running calculators and training tools. Built by runners, for runners.
            </p>
          </div>

          {/* Calculators */}
          <div>
            <h3 className="text-white font-heading font-semibold text-sm mb-4 uppercase tracking-wider">
              Calculators
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {calculatorLinks.map((link) => (
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

          {/* Company */}
          <div>
            <h3 className="text-white font-heading font-semibold text-sm mb-4 uppercase tracking-wider">
              Product
            </h3>
            <div className="flex flex-col gap-2">
              <Link href="/calculators" className="text-sm hover:text-white transition-colors">
                All Calculators
              </Link>
              <Link href="/pricing" className="text-sm hover:text-white transition-colors">
                Pricing
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-xs text-gray-500">
          &copy; {new Date().getFullYear()} RunSplit. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

