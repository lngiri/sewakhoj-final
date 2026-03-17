/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
    domains: ['sewakhoj-final.up.railway.app']
  },
  assetPrefix: undefined,
  basePath: ''
}

module.exports = nextConfig
