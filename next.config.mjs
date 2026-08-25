/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow server-side rendering features
  experimental: {},
  // Handle image domains if needed
  images: {
    unoptimized: true,
  },
  // Ensure server components work with Prisma
  serverExternalPackages: ["@prisma/client", "bcryptjs"],
};

export default nextConfig;
