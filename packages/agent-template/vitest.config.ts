import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Scaffold copies (create-vite style) are not this package's unit suite.
    exclude: ['**/node_modules/**', '**/dist/**', '**/template/**'],
  },
});
