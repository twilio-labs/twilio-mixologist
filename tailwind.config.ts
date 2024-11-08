import type { Config } from "tailwindcss";

const config: Config = {
  safelist: ["grid-cols-3", "grid-cols-4", "grid-cols-5"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      colors: {
        "twilio-red": "#F22F46",
        "twilio-ink": "#121C2D",
        "twilio-white": "#ffffff",
        "twilio-paper": "#FDF7F4",
        "twilio-saffron": "#F2BE5A",
        "twilio-mint": "#6ADDB2",
        "twilio-sky": "#51A9E3",
        "twilio-sun": "#FF7A00",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
