// src/setupTests.ts
// Mock matchMedia (needed for some components)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // Deprecated
    removeListener: vi.fn(), // Deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Optional: if you're using ResizeObserver
global.ResizeObserver = require('resize-observer-polyfill');

// Extend Jest matchers with Testing Library
import '@testing-library/jest-dom';