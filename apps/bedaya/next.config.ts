import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@rawa7el/ui", "@rawa7el/supabase", "@rawa7el/attendance-logic"],
};

export default nextConfig;
