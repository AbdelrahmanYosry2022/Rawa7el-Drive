import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['packages/**/*.test.ts', 'packages/**/*.spec.ts'],
    exclude: ['node_modules', 'dist', '.next'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules', 'dist', '.next', '**/*.test.ts', '**/*.spec.ts'],
    },
  },
  resolve: {
    alias: {
      '@rawa7el/database': resolve(__dirname, 'packages/database/src'),
      '@rawa7el/exam-logic': resolve(__dirname, 'packages/exam-logic/src'),
      '@rawa7el/attendance-logic': resolve(__dirname, 'packages/attendance-logic/src'),
      '@rawa7el/notifications-logic': resolve(__dirname, 'packages/notifications-logic/src'),
      '@rawa7el/halaqat-logic': resolve(__dirname, 'packages/halaqat-logic/src'),
    },
  },
});
