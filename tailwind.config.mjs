/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        'android-blue': '#4285F4',
        'android-dark': '#3367D6',
      },
      fontFamily: {
        sans: ['"Google Sans"', '"Nunito Sans"', 'sans-serif'],
        'tamil-body': ['"Noto Sans Tamil"', 'sans-serif'],
        'tamil-heading': ['"Mukta Malar"', '"Noto Sans Tamil"', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
