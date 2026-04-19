import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.{test,spec}.{js,ts}'],
    exclude: ['node_modules', 'dist', 'build'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        'build/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*',
        'coverage/',
        'scripts/',
        'utils/',
        'showcase/',
        '_archive/'
      ],
      thresholds: {
        lines: 80,
        branches: 70,
        functions: 80,
        statements: 80
      }
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  }
});
