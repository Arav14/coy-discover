/** @type {import('next').NextConfig} */
const nextConfig = {
  // Expose the API at the paths named in the brief: GET /feed, POST /swipe, GET /matches.
  async rewrites() {
    return [
      { source: "/feed", destination: "/api/feed" },
      { source: "/swipe", destination: "/api/swipe" },
      { source: "/matches", destination: "/api/matches" },
      { source: "/reset", destination: "/api/reset" },
    ];
  },
};
export default nextConfig;
