/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        obsidian: {
          DEFAULT: 'var(--bg-primary, #07090E)',
          deep: 'var(--bg-deep, #040508)',
          surface: 'var(--bg-surface, #0D111A)',
          elevated: 'var(--bg-elevated, #141A26)',
          border: 'var(--border-color, rgba(255, 255, 255, 0.08))',
          highlight: 'var(--accent-glow, rgba(56, 189, 248, 0.15))',
        },
        cryo: {
          cyan: 'var(--accent-color, #06B6D4)',
          glow: 'var(--accent-glow-text, #38BDF8)',
          dark: 'var(--accent-dark, #083344)',
        },
        accent: {
          DEFAULT: 'var(--accent-color, #06B6D4)',
          glow: 'var(--accent-glow-text, #38BDF8)',
          dark: 'var(--accent-dark, #083344)',
          soft: 'var(--accent-glow, rgba(56, 189, 248, 0.2))',
        },
        thermal: {
          amber: '#F97316',
          orange: '#EA580C',
          glow: 'rgba(249, 115, 22, 0.25)',
        },
        plasma: {
          red: '#EF4444',
          deep: '#991B1B',
          glow: 'rgba(239, 68, 68, 0.25)',
        },
        telemetry: {
          emerald: '#10B981',
          gold: '#EAB308',
          blue: '#3B82F6',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        heading: ['"Outfit"', '"Plus Jakarta Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
      },
      letterSpacing: {
        'micro': '0.08em',
        'telemetry': '0.12em',
      },
      boxShadow: {
        'glow-accent': '0 0 25px -4px var(--accent-glow, rgba(56, 189, 248, 0.3))',
        'glass-card': '0 10px 30px -5px rgba(0, 0, 0, 0.5), 0 0 0 1px var(--border-color, rgba(255, 255, 255, 0.08))',
      }
    },
  },
  plugins: [],
}
