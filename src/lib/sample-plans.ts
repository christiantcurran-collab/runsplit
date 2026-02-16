// ============================================
// SAMPLE TRAINING PLANS — free for all visitors
// ============================================

export interface SamplePlan {
  slug: string;
  title: string;
  subtitle: string;
  distance: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  weeks: number;
  daysPerWeek: number;
  peakWeeklyKm: number;
  description: string;
  who: string;
  schedule: SampleWeek[];
}

export interface SampleWeek {
  week: number;
  phase: string;
  totalKm: number;
  days: string[]; // 7 entries, one per day Mon-Sun. "" = rest
}

// -----------------------------------------------
// Plan 1: Couch to 5K
// -----------------------------------------------
const couchTo5k: SamplePlan = {
  slug: "couch-to-5k",
  title: "Couch to 5K",
  subtitle: "From zero to your first 5K in 8 weeks",
  distance: "5K",
  level: "Beginner",
  weeks: 8,
  daysPerWeek: 3,
  peakWeeklyKm: 15,
  description:
    "A gentle 8-week plan that takes you from little or no running to completing a full 5K. Uses a walk/run approach in the early weeks and gradually builds to continuous running.",
  who: "Complete beginners or anyone returning to running after a long break.",
  schedule: [
    { week: 1, phase: "Walk/Run", totalKm: 6, days: ["", "Walk 5 min, Run 1 min × 4", "", "Walk 5 min, Run 1 min × 4", "", "", "Walk 5 min, Run 1 min × 5"] },
    { week: 2, phase: "Walk/Run", totalKm: 7, days: ["", "Walk 4 min, Run 2 min × 4", "", "Walk 4 min, Run 2 min × 4", "", "", "Walk 3 min, Run 2 min × 5"] },
    { week: 3, phase: "Building", totalKm: 8, days: ["", "Walk 3 min, Run 3 min × 4", "", "Walk 3 min, Run 3 min × 4", "", "", "Walk 2 min, Run 3 min × 5"] },
    { week: 4, phase: "Building", totalKm: 10, days: ["", "Run 5 min, Walk 2 min × 3", "", "Run 5 min, Walk 2 min × 3", "", "", "Run 8 min, Walk 2 min × 2"] },
    { week: 5, phase: "Progressing", totalKm: 11, days: ["", "Run 8 min, Walk 2 min × 2", "", "Run 10 min, Walk 2 min, Run 5 min", "", "", "Run 15 min easy"] },
    { week: 6, phase: "Progressing", totalKm: 13, days: ["", "Run 15 min easy", "", "Run 10 min, Walk 1 min, Run 10 min", "", "", "Run 20 min easy"] },
    { week: 7, phase: "Confidence", totalKm: 14, days: ["", "Run 20 min easy", "", "Run 25 min easy", "", "", "Run 25 min easy"] },
    { week: 8, phase: "Race Week", totalKm: 15, days: ["", "Run 15 min easy", "", "Run 10 min easy", "", "", "🏁 Race Day: 5K!"] },
  ],
};

// -----------------------------------------------
// Plan 2: 10K for Beginners
// -----------------------------------------------
const beginner10k: SamplePlan = {
  slug: "beginner-10k",
  title: "Beginner 10K",
  subtitle: "Your first 10K in 8 weeks",
  distance: "10K",
  level: "Beginner",
  weeks: 8,
  daysPerWeek: 3,
  peakWeeklyKm: 28,
  description:
    "An 8-week plan for runners who can comfortably run 5K and want to step up to 10K. Three runs per week with a gradual long run build-up.",
  who: "Runners who can run 30 minutes continuously and want their first 10K.",
  schedule: [
    { week: 1, phase: "Base", totalKm: 14, days: ["", "4km easy", "", "4km easy", "", "", "6km easy"] },
    { week: 2, phase: "Base", totalKm: 16, days: ["", "4km easy", "", "5km easy", "", "", "7km easy"] },
    { week: 3, phase: "Build", totalKm: 19, days: ["", "5km easy", "", "5km with 3×3 min tempo", "", "", "9km easy"] },
    { week: 4, phase: "Recovery", totalKm: 15, days: ["", "4km easy", "", "4km easy", "", "", "7km easy"] },
    { week: 5, phase: "Build", totalKm: 22, days: ["", "5km easy", "", "6km with 4×3 min tempo", "", "", "11km easy"] },
    { week: 6, phase: "Build", totalKm: 25, days: ["", "6km easy", "", "6km with 5×3 min tempo", "", "", "13km easy"] },
    { week: 7, phase: "Peak", totalKm: 28, days: ["", "5km easy", "", "7km with 2×10 min tempo", "", "", "16km easy"] },
    { week: 8, phase: "Taper & Race", totalKm: 18, days: ["", "4km easy", "", "3km easy with strides", "", "", "🏁 Race Day: 10K!"] },
  ],
};

// -----------------------------------------------
// Plan 3: Half Marathon Intermediate
// -----------------------------------------------
const halfMarathon: SamplePlan = {
  slug: "half-marathon-intermediate",
  title: "Half Marathon",
  subtitle: "12-week plan for intermediate runners",
  distance: "Half Marathon",
  level: "Intermediate",
  weeks: 12,
  daysPerWeek: 4,
  peakWeeklyKm: 55,
  description:
    "A 12-week half marathon plan with 4 runs per week. Includes easy runs, a weekly tempo or interval session, and a progressive long run building to 18km.",
  who: "Runners who can comfortably run 10K and train 4 days a week.",
  schedule: [
    { week: 1, phase: "Base", totalKm: 28, days: ["", "5km easy", "", "6km with strides", "", "5km easy", "12km easy"] },
    { week: 2, phase: "Base", totalKm: 30, days: ["", "5km easy", "", "7km easy", "", "5km easy", "13km easy"] },
    { week: 3, phase: "Build 1", totalKm: 34, days: ["", "6km easy", "", "7km with 3×5 min tempo", "", "5km easy", "16km easy"] },
    { week: 4, phase: "Recovery", totalKm: 25, days: ["", "5km easy", "", "5km easy", "", "4km easy", "11km easy"] },
    { week: 5, phase: "Build 2", totalKm: 38, days: ["", "6km easy", "", "8km with 4×5 min tempo", "", "6km easy", "18km easy"] },
    { week: 6, phase: "Build 2", totalKm: 42, days: ["", "7km easy", "", "8km with 5×1km intervals", "", "6km easy", "21km at HM pace"] },
    { week: 7, phase: "Build 2", totalKm: 45, days: ["", "7km easy", "", "9km with 3×10 min tempo", "", "6km easy", "23km easy"] },
    { week: 8, phase: "Recovery", totalKm: 30, days: ["", "5km easy", "", "6km easy", "", "5km easy", "14km easy"] },
    { week: 9, phase: "Peak", totalKm: 50, days: ["", "7km easy", "", "10km with 6×1km intervals", "", "7km easy", "26km easy"] },
    { week: 10, phase: "Peak", totalKm: 55, days: ["", "8km easy", "", "10km with 4×8 min tempo", "", "7km easy", "30km easy"] },
    { week: 11, phase: "Taper", totalKm: 35, days: ["", "6km easy", "", "6km with strides", "", "5km easy", "18km easy"] },
    { week: 12, phase: "Race Week", totalKm: 25, days: ["", "5km easy", "", "4km easy with strides", "", "Rest", "🏁 Race Day: Half Marathon!"] },
  ],
};

// -----------------------------------------------
// Plan 4: Marathon Intermediate
// -----------------------------------------------
const marathon: SamplePlan = {
  slug: "marathon-intermediate",
  title: "Marathon",
  subtitle: "16-week plan for intermediate runners",
  distance: "Marathon",
  level: "Intermediate",
  weeks: 16,
  daysPerWeek: 4,
  peakWeeklyKm: 70,
  description:
    "A 16-week marathon plan with 4 runs per week. Progressive long run up to 35km, weekly quality session, and a proper 3-week taper. Designed for runners targeting 3:30-4:30.",
  who: "Runners who have completed a half marathon and can train 4 days per week.",
  schedule: [
    { week: 1, phase: "Base", totalKm: 35, days: ["", "6km easy", "", "7km easy", "", "6km easy", "16km easy"] },
    { week: 2, phase: "Base", totalKm: 38, days: ["", "6km easy", "", "8km with strides", "", "6km easy", "18km easy"] },
    { week: 3, phase: "Base", totalKm: 40, days: ["", "7km easy", "", "8km with 3×5 min tempo", "", "5km easy", "20km easy"] },
    { week: 4, phase: "Recovery", totalKm: 30, days: ["", "5km easy", "", "6km easy", "", "5km easy", "14km easy"] },
    { week: 5, phase: "Build 1", totalKm: 45, days: ["", "7km easy", "", "9km with 4×5 min tempo", "", "6km easy", "23km easy"] },
    { week: 6, phase: "Build 1", totalKm: 48, days: ["", "7km easy", "", "10km with 5×1km intervals", "", "6km easy", "25km easy"] },
    { week: 7, phase: "Build 1", totalKm: 52, days: ["", "8km easy", "", "10km with 3×10 min tempo", "", "7km easy", "27km easy"] },
    { week: 8, phase: "Recovery", totalKm: 35, days: ["", "6km easy", "", "6km easy with strides", "", "5km easy", "18km easy"] },
    { week: 9, phase: "Build 2", totalKm: 55, days: ["", "8km easy", "", "10km with 6×1km intervals", "", "7km easy", "30km easy"] },
    { week: 10, phase: "Build 2", totalKm: 60, days: ["", "8km easy", "", "11km with 4×8 min tempo", "", "7km easy", "34km easy"] },
    { week: 11, phase: "Peak", totalKm: 65, days: ["", "8km easy", "", "12km with race pace segments", "", "8km easy", "37km easy"] },
    { week: 12, phase: "Recovery", totalKm: 40, days: ["", "6km easy", "", "7km easy", "", "5km easy", "22km easy"] },
    { week: 13, phase: "Peak", totalKm: 70, days: ["", "9km easy", "", "12km with 5×2km race pace", "", "8km easy", "41km easy"] },
    { week: 14, phase: "Taper 1", totalKm: 50, days: ["", "7km easy", "", "8km with 3×5 min tempo", "", "6km easy", "29km easy"] },
    { week: 15, phase: "Taper 2", totalKm: 35, days: ["", "5km easy", "", "6km with strides", "", "4km easy", "20km easy"] },
    { week: 16, phase: "Race Week", totalKm: 22, days: ["", "4km easy", "", "3km easy shakeout", "", "Rest", "🏁 Race Day: Marathon!"] },
  ],
};

// -----------------------------------------------
// Plan 5: 5K PB — Sub-25
// -----------------------------------------------
const fiveKPB: SamplePlan = {
  slug: "5k-pb-sub25",
  title: "5K PB — Sub 25:00",
  subtitle: "6-week speed block to break 25 minutes",
  distance: "5K",
  level: "Intermediate",
  weeks: 6,
  daysPerWeek: 4,
  peakWeeklyKm: 32,
  description:
    "A focused 6-week block to sharpen your speed and break 25 minutes for 5K. Includes interval sessions, tempo runs, and easy recovery. Assumes a current 5K of around 26-28 minutes.",
  who: "Runners who can run 5K in 26-28 minutes and want to break 25:00.",
  schedule: [
    { week: 1, phase: "Sharpening", totalKm: 24, days: ["", "5km easy", "", "6km with 5×800m @ 4:45/km", "", "5km easy", "8km easy"] },
    { week: 2, phase: "Sharpening", totalKm: 26, days: ["", "5km easy", "", "7km with 3×1.6km @ 4:50/km", "", "5km easy", "9km easy"] },
    { week: 3, phase: "Peak", totalKm: 30, days: ["", "6km easy", "", "7km with 6×800m @ 4:40/km", "", "6km easy", "11km easy"] },
    { week: 4, phase: "Peak", totalKm: 32, days: ["", "6km easy", "", "8km with 4×1.2km @ 4:45/km", "", "6km easy", "12km easy"] },
    { week: 5, phase: "Taper", totalKm: 22, days: ["", "5km easy", "", "5km with 4×400m fast", "", "4km easy", "8km easy"] },
    { week: 6, phase: "Race Week", totalKm: 15, days: ["", "4km easy", "", "3km with strides", "", "Rest", "🏁 Race Day: 5K PB!"] },
  ],
};

// -----------------------------------------------
// All sample plans
// -----------------------------------------------
export const SAMPLE_PLANS: SamplePlan[] = [couchTo5k, beginner10k, halfMarathon, marathon, fiveKPB];

export function getSamplePlan(slug: string): SamplePlan | undefined {
  return SAMPLE_PLANS.find((p) => p.slug === slug);
}

/**
 * Find the best matching sample plan for a given distance key.
 * Prefers beginner-level plans for conversions.
 */
export function getBestPlanForDistance(distanceKey: string): SamplePlan | undefined {
  const distanceMap: Record<string, string[]> = {
    "5k": ["couch-to-5k", "5k-pb-sub25"],
    "10k": ["beginner-10k"],
    "halfMarathon": ["half-marathon-intermediate"],
    "marathon": ["marathon-16-week"],
  };

  const slugs = distanceMap[distanceKey];
  if (slugs) {
    for (const slug of slugs) {
      const plan = SAMPLE_PLANS.find((p) => p.slug === slug);
      if (plan) return plan;
    }
  }

  // Fallback: find any plan with matching distance
  const distanceLabels: Record<string, string> = {
    "5k": "5K", "10k": "10K", "halfMarathon": "Half Marathon", "marathon": "Marathon",
  };
  const label = distanceLabels[distanceKey];
  if (label) {
    return SAMPLE_PLANS.find((p) => p.distance === label);
  }

  return SAMPLE_PLANS[0]; // fallback to first plan
}







// ============================================

