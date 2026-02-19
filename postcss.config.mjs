/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    '@tailwindcss/postcss': {}, // This was the issue (it was previously just 'tailwindcss')
  },
};

export default config;