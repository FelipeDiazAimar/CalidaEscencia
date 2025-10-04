import type {NextConfig} from 'next';

// Archivo renombrado para evitar conflicto con next.config.js
const nextConfig: NextConfig = {
  /* config options here */
  outputFileTracingRoot: __dirname,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    typedRoutes: false,
  },
  // Skip all checks during build
  env: {
    SKIP_TYPE_CHECK: 'true'
  },
  // Redirects para rutas públicas
  async redirects() {
    return [
      {
        source: '/products',
        destination: '/public/products',
        permanent: true,
      },
      {
        source: '/gallery',
        destination: '/public/gallery',
        permanent: true,
      },
      {
        source: '/about',
        destination: '/public/about',
        permanent: true,
      },
      {
        source: '/materials',
        destination: '/public/materials',
        permanent: true,
      },
      {
        source: '/contact',
        destination: '/public/contact',
        permanent: true,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
