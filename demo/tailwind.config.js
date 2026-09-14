/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        attendance: {
          standup: 'hsl(var(--attendance-standup))',
          workshop: 'hsl(var(--attendance-workshop))',
          review: 'hsl(var(--attendance-review))',
          'on-time': 'hsl(var(--attendance-on-time))',
          late: 'hsl(var(--attendance-late))',
          'left-early': 'hsl(var(--attendance-left-early))',
          'late-and-left-early': 'hsl(var(--attendance-late-and-left-early))',
          missed: 'hsl(var(--attendance-missed))',
          together: 'hsl(var(--attendance-together))',
          dead: 'hsl(var(--attendance-dead))',
          'dead-band': 'hsl(var(--attendance-dead-band))',
          ink: 'hsl(var(--attendance-ink))',
        },
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: { DEFAULT: 'hsl(var(--card))', foreground: 'hsl(var(--card-foreground))' },
        muted: { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
        border: 'hsl(var(--border))',
        accent: { DEFAULT: 'hsl(var(--accent))', foreground: 'hsl(var(--accent-foreground))' },
        primary: { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
        grid: { DEFAULT: 'hsl(var(--grid))', strong: 'hsl(var(--grid-strong))' },
      },
    },
  },
  plugins: [],
};
