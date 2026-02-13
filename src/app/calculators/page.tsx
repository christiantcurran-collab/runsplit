import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free Running Calculators | Pace, Speed, Race Predictions & More | RunSplit",
  description:
    "12 free running calculators — pace, race time predictor, splits, training zones, VO2max, heart rate zones, calories, treadmill converter and more. No signup required.",
};

const calculators = [
  {
    href: "/calculators/pace",
    title: "Pace Calculator",
    description: "Calculate your running pace, speed, and finish time for any distance.",
    icon: "⏱️",
    keywords: "pace, speed, time, distance",
  },
  {
    href: "/calculators/race-predictor",
    title: "Race Time Predictor",
    description: "Predict your finish time at any race distance from a recent result.",
    icon: "🏁",
    keywords: "predict, race, marathon, 5K",
  },
  {
    href: "/calculators/splits",
    title: "Split Time Calculator",
    description: "Plan your race splits with even or negative split strategies.",
    icon: "📊",
    keywords: "splits, pacing, race plan",
  },
  {
    href: "/calculators/training-paces",
    title: "Training Paces",
    description: "Get your easy, tempo, interval and repetition training paces.",
    icon: "🎯",
    keywords: "training, zones, easy pace, tempo",
  },
  {
    href: "/calculators/speed-converter",
    title: "Speed / Pace Converter",
    description: "Convert between min/km, min/mile, km/h, mph and m/s.",
    icon: "🔄",
    keywords: "convert, min/km, min/mile, speed",
  },
  {
    href: "/calculators/age-grade",
    title: "Age-Graded Calculator",
    description: "Compare your performance across ages and genders.",
    icon: "📈",
    keywords: "age grade, performance, WMA",
  },
  {
    href: "/calculators/vo2max",
    title: "VO2max Estimator",
    description: "Estimate your VO2max from a race result. See your fitness level.",
    icon: "🫁",
    keywords: "VO2max, fitness, aerobic",
  },
  {
    href: "/calculators/heart-rate-zones",
    title: "Heart Rate Zones",
    description: "Calculate your 5 HR training zones using the Karvonen method.",
    icon: "❤️",
    keywords: "heart rate, zones, Karvonen",
  },
  {
    href: "/calculators/calories",
    title: "Calories Burned",
    description: "Estimate calories burned running based on weight, distance and pace.",
    icon: "🔥",
    keywords: "calories, burn, weight, MET",
  },
  {
    href: "/calculators/treadmill",
    title: "Treadmill Converter",
    description: "Convert treadmill speed and incline to outdoor equivalent pace.",
    icon: "🏃",
    keywords: "treadmill, incline, outdoor",
  },
  {
    href: "/calculators/negative-split",
    title: "Negative Split Planner",
    description: "Plan a negative split strategy for a strong race finish.",
    icon: "📉",
    keywords: "negative split, race strategy",
  },
  {
    href: "/calculators/run-walk",
    title: "Run/Walk Calculator",
    description: "Calculate total time with run/walk intervals. Galloway method.",
    icon: "🚶‍♂️",
    keywords: "run walk, Galloway, intervals",
  },
];

export default function CalculatorsHub() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-brand-black text-white py-12 sm:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="font-heading font-bold text-3xl sm:text-4xl lg:text-5xl mb-4">
            Free Running Calculators
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Every calculator a runner needs. Free forever, no signup required. Instant real-time results.
          </p>
        </div>
      </div>

      {/* Calculator grid */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {calculators.map((calc) => (
            <Link
              key={calc.href}
              href={calc.href}
              className="bg-white rounded-2xl border border-gray-200 p-6 hover:border-brand-orange hover:shadow-lg transition-all group"
            >
              <div className="text-3xl mb-3">{calc.icon}</div>
              <h2 className="font-heading font-semibold text-lg text-gray-900 group-hover:text-brand-orange transition-colors mb-2">
                {calc.title}
              </h2>
              <p className="text-sm text-gray-500 leading-relaxed">
                {calc.description}
              </p>
              <div className="mt-4 text-brand-orange text-sm font-medium group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                Open calculator
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

