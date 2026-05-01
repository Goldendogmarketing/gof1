/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com"
      },
      {
        protocol: "https",
        hostname: "www.aristonspecialties.com"
      },
      {
        protocol: "https",
        hostname: "cdn.shopify.com"
      }
    ]
  },
  typedRoutes: false
};

export default nextConfig;
