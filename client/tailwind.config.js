/** @type {import('tailwindcss').Config} */
export default {
  mode: 'jit', // Ensure JIT mode is enabled
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'], 
  theme: {
    extend: {},
  },
  plugins: [],
};
