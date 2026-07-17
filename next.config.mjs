/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // pg, sharp e pdf-lib precisam rodar no Node.js nativo (não bundlados).
  serverExternalPackages: ["pg", "sharp", "pdf-lib"],
}

export default nextConfig
