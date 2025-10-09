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
       {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'pub-9b9ab0d0c1b54e4592cd963e04de2116.r2.dev',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.example.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
