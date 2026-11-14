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
          DEFAULT: '#06080D',
          deep: '#030407',
          surface: '#0B0F17',
          elevated: '#101522',
          border: 'rgba(255, 255, 255, 0.08)',
          highlight: 'rgba(56, 189, 248, 0.15)',
        },
        cryo: {
          cyan: '#06B6D4',
          glow: '#38BDF8',
          dark: '#083344',
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
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
        sans: ['"Space Grotesk"', 'Inter', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        'micro': '0.08em',
        'telemetry': '0.12em',
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'flame-flicker': 'flameFlicker 0.15s infinite alternate ease-in-out',
      },
      keyframes: {
        flameFlicker: {
          '0%': { transform: 'scaleY(1.0) scaleX(1.0)' },
          '100%': { transform: 'scaleY(1.04) scaleX(0.97)' },
        }
      }
    },
  },
  plugins: [],
}
