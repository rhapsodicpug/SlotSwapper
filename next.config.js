/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ensure server-side modules are properly resolved
  experimental: {
    serverComponentsExternalPackages: ['googleapis', 'google-auth-library'],
  },
}

module.exports = nextConfig

