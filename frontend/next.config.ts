// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
      remotePatterns: [
          {
              protocol: 'https',
              hostname: 'backend-production-c628.up.railway.app',
              port: '',
              pathname: '/uploads/**',
          },
          {
              protocol: 'http',
              hostname: 'localhost',
              port: '8000',
              pathname: '/uploads/**',
          },
          {
              protocol: 'http',
              hostname: '127.0.0.1',
              port: '8000',
              pathname: '/uploads/**',
          },
          {
              protocol: 'https',
              hostname: 'unbiased-dane-new.ngrok-free.app',
              port: '',
              pathname: '/uploads/**',
          },
          {
              protocol: 'https',
              hostname: '*.blob.core.windows.net',
              port: '',
              pathname: '/**',
          },
      ],
    unoptimized: true, // 👈 disable optimization for static export
  },
};

export default nextConfig;

