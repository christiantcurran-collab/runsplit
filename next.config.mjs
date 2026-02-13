/** @type {import('next').NextConfig} */
const nextConfig = {
  // Prevent aggressive caching of auth-related pages
  async headers() {
    return [
      {
        source: "/(login|signup|plan|settings|auth)(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, no-cache, must-revalidate, proxy-revalidate",
          },
          {
            key: "Pragma",
            value: "no-cache",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
