import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["twilio", "twilio-agent-connect", "sharp", "pino", "thread-stream"],
  experimental: {},
  env: {
    CONTENT_PREFIX: "mixologist_",
    NEXT_PUBLIC_CONFIG_DOC: "Config",
    NEXT_PUBLIC_EVENTS_MAP: "Events",
    NEXT_PUBLIC_ATTENDEES_MAP: "Attendees",
    NEXT_PUBLIC_FEEDBACK_LIST: "Feedback",
  },
};

export default nextConfig;
