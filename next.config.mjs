/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Temporary: allow production builds even if ESLint errors exist
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Temporary: allow production builds even if type errors exist
    ignoreBuildErrors: true,
  },
  // Ensure proper image handling
  images: {
    unoptimized: true,
    domains: [
      'automationalien.s3.us-east-1.amazonaws.com',
      'localhost'
    ]
  },
  
  // Ensure proper API routes
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '/api/:path*'
      }
    ]
  }
}

export default nextConfig
