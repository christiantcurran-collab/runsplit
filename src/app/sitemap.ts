import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://runsplit.co";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date().toISOString();

  // Core pages
  const corePages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/tools`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/calculators`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/plans`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/pricing`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/support`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  // Individual tools (high-value SEO pages)
  const toolSlugs = [
    "pace",
    "predict",
    "splits",
    "training-paces",
    "convert",
    "age-grade",
    "vo2max",
    "heart-rate",
    "calories",
    "treadmill",
    "negative-split",
    "run-walk",
  ];

  const toolPages: MetadataRoute.Sitemap = toolSlugs.map((slug) => ({
    url: `${BASE_URL}/tools/${slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  // Calculator pages (duplicate content-wise they target different keywords)
  const calculatorSlugs = [
    "pace",
    "race-predictor",
    "splits",
    "training-paces",
    "speed-converter",
    "age-grade",
    "vo2max",
    "heart-rate-zones",
    "calories",
    "treadmill",
    "negative-split",
    "run-walk",
  ];

  const calculatorPages: MetadataRoute.Sitemap = calculatorSlugs.map((slug) => ({
    url: `${BASE_URL}/calculators/${slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  // Sample training plans
  const planSlugs = [
    "couch-to-5k",
    "beginner-10k",
    "half-marathon-intermediate",
    "marathon-intermediate",
    "5k-pb-sub25",
  ];

  const planPages: MetadataRoute.Sitemap = planSlugs.map((slug) => ({
    url: `${BASE_URL}/plans/${slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [...corePages, ...toolPages, ...calculatorPages, ...planPages];
}


