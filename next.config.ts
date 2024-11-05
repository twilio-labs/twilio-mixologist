import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {},
  env: {
    CONTENT_PREFIX: "mixologist_",
    NEXT_PUBLIC_CONFIG_DOC: "Config",
    NEXT_PUBLIC_EVENTS_MAP: "Events",
    NEXT_PUBLIC_ACTIVE_CUSTOMERS_MAP: "ActiveCustomers",
  },
};

export default nextConfig;