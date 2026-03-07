/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["minio"],
  },
};

module.exports = nextConfig;
