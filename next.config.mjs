/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep Prisma unbundled so its runtime loads engines from node_modules.
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client", ".prisma/client", "@prisma/adapter-pg", "pg"],
  },
};
export default nextConfig;
