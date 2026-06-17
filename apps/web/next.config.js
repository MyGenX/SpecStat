/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@specstat/types', '@specstat/openspec-parser', '@specstat/github-client'],
  images: {
    remotePatterns: [{ hostname: 'avatars.githubusercontent.com' }],
  },
  webpack(config) {
    // Resolve .js extensions to .ts/.tsx for monorepo source packages
    config.resolve.extensionAlias = {
      '.js': ['.ts', '.tsx', '.js'],
      '.mjs': ['.mts', '.mjs'],
    }
    return config
  },
}

module.exports = nextConfig
