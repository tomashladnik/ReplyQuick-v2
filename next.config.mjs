/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Explicitly set JavaScript as default
  typescript: {
    ignoreBuildErrors: true
  }
};

export default nextConfig;
