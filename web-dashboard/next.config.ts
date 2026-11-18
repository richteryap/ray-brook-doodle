import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/anilist",
        destination: "https://graphql.anilist.co",
      },
    ];
  },
};

export default nextConfig;
