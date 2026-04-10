import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    testTimeout: 30000,
    include: ['tests/**/*.test.{cjs,js,ts}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      include: ['lib/**/*.cjs', 'bin/**/*.cjs'],
      exclude: ['**/node_modules/**', '**/test-fixtures/**'],
      thresholds: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80,
      },
    },
  },
});
