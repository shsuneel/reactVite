// src/setupTests.ts

// Mock matchMedia (needed for components using window.matchMedia)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Optional: Mock ResizeObserver if your app uses it
class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
global.ResizeObserver = ResizeObserver;

// Extend Vitest's expect with Testing Library matchers
// Use the Vitest-compatible version of jest-dom
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import matchers from '@testing-library/jest-dom/matchers';

// Extend expect with jest-dom matchers
expect.extend(matchers);

// Automatically clean up after each test
afterEach(() => {
  cleanup();
});

// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { configDefaults } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
    // Exclude files in node_modules and dist
    exclude: [...configDefaults.exclude, 'e2e/*'],
  },
});

// npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
