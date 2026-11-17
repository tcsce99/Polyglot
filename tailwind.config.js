/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)', surface: 'var(--surface)', ink: 'var(--ink)', muted: 'var(--muted)',
        line: 'var(--line)', brand: 'var(--brand)', 'brand-soft': 'var(--brand-soft)',
        ok: 'var(--ok)', 'ok-soft': 'var(--ok-soft)', bad: 'var(--bad)', 'bad-soft': 'var(--bad-soft)',
        warn: 'var(--warn)', 'warn-soft': 'var(--warn-soft)',
      },
    },
  },
  plugins: [],
};
