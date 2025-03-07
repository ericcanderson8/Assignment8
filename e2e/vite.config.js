import {defineConfig} from 'vitest/config';
import eslint from 'vite-plugin-eslint';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    eslint(),
  ],
  test: {
    environment: 'node',
  },
});
