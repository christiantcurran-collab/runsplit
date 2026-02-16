import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://runsplit.co";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/auth/",
          "/settings",
          "/plan/builder",
          "/plan/calendar",
          "/plan/log",
          "/plan/race-day",
          "/onboarding",
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}



