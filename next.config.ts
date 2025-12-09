import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,

  images: {
    domains: ["res.cloudinary.com"],
  },
};

export default nextConfig;
