import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 生产环境优化
  output: 'standalone',
  
  // 服务端外部包配置
  serverExternalPackages: ['@prisma/client', 'pdf-parse', 'mammoth'],
  
  // 图片优化
  images: {
    domains: [
      'localhost',
      'via.placeholder.com',
      'contrib.rocks',
      'img.shields.io',
      'api.star-history.com',
      'visitor-badge.laobi.icu'
    ],
    formats: ['image/webp', 'image/avif']
  },
  
  // 重定向配置
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
    ]
  },
  
  // 头部配置
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
        ],
      },
    ]
  },
  
  // 性能配置
  poweredByHeader: false,
  compress: true,
  
  // TypeScript 配置
  typescript: {
    ignoreBuildErrors: false,
  },
  
  // ESLint 配置
  eslint: {
    ignoreDuringBuilds: false,
  }
};

export default nextConfig;
