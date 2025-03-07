import {defineConfig} from 'vitest/config';
import {BaseSequencer} from 'vitest/node';
import eslint from 'vite-plugin-eslint';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    eslint(),
  ],
  test: {
    environment: 'node',
    coverage: {
      include: [
        'src/**',
        'test/**',
      ],
      exclude: [
        'src/server.js',
      ],
    },
  },
});
