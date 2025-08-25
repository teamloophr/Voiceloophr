/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable static exports for Amplify
  output: 'standalone',
  
  // Ensure proper image handling
  images: {
    unoptimized: true,
    domains: [
      'automationalien.s3.us-east-1.amazonaws.com',
      'localhost'
    ]
  },
  
  // Enable experimental features
  experimental: {
    serverComponentsExternalPackages: ['@supabase/supabase-js']
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
