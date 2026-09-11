/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    proxyTimeout: 180_000, // 3 minutes timeout (default 30s causes socket hang up on AI generation)
  },
  async rewrites() {
    const isDev = process.env.NODE_ENV !== "production";
    const defaultBackend = isDev 
      ? "http://localhost:5000" 
      : "https://remind-ai-production-e632.up.railway.app";
    const backendUrl = process.env.BACKEND_URL || defaultBackend;
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
