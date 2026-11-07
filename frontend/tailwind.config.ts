import type { Config } from "tailwindcss";

/** Colours resolve to CSS variables (see globals.css) so every theme works with alpha utilities: bg-brand/10 */
const token = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  darkMode: ["selector", '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        page: token("page"),
        surface: token("surface"),
        soft: token("soft"),
        ink: token("ink"),
        muted: token("muted"),
        line: token("line"),
        rail: token("rail"),
        "rail-ink": token("rail-ink"),
        brand: { DEFAULT: token("brand"), strong: token("brand-strong"), ink: token("brand-ink") },
        success: token("success"),
        warning: token("warning"),
        danger: token("danger"),
        info: token("info")
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "sans-serif"]
      },
      boxShadow: {
        card: "0 1px 2px rgb(var(--shadow) / .04)",
        lift: "0 1px 3px rgb(var(--shadow) / .06), 0 10px 24px -14px rgb(var(--shadow) / .16)",
        glow: "none"
      },
      keyframes: {
        "fade-up": { from: { opacity: "0", transform: "translateY(8px)" }, to: { opacity: "1", transform: "none" } },
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
        "pop": { from: { opacity: "0", transform: "scale(.97)" }, to: { opacity: "1", transform: "none" } },
        shimmer: { "100%": { transform: "translateX(100%)" } },
        scan: { "0%": { transform: "translateY(-10%)", opacity: "0" }, "15%": { opacity: "1" }, "85%": { opacity: "1" }, "100%": { transform: "translateY(110%)", opacity: "0" } }
      },
      animation: {
        "fade-up": "fade-up .45s cubic-bezier(.2,.7,.2,1) both",
        "fade-in": "fade-in .25s ease both",
        pop: "pop .2s ease both",
        shimmer: "shimmer 1.6s infinite",
        scan: "scan 1.8s ease-in-out infinite"
      }
    }
  },
  plugins: []
};
export default config;
