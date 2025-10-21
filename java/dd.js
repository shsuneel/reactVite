// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dotenv from 'dotenv';
import { resolve } from 'path';

// Load .env for dev proxy auth
dotenv.config();

// Only compute auth in development
let proxyAuthHeader: string | undefined;
if (process.env.NODE_ENV === 'development') {
  if (!process.env.USERNAME || !process.env.PASSWORD) {
    throw new Error('USERNAME and PASSWORD required in .env for development');
  }
  proxyAuthHeader = `Basic ${Buffer.from(
    `${process.env.USERNAME}:${process.env.PASSWORD}`
  ).toString('base64')}`;
}

export default defineConfig({
  // 🔌 Plugins
  plugins: [
    react(),
    // Add other plugins here (e.g., svgr, legacy, etc.)
  ],

  // 🚀 Development server (only used in `vite` dev mode)
  server: {
    port: 3000,
    open: false,
    proxy: {
      // Proxy all your service paths
      '/account-service': proxyConfig(),
      '/syndicateDealService': proxyConfig(),
      '/api': proxyConfig(),
      // Add more as needed
    },
  },

  // ⚡ Dependency optimization (speeds up dev server start)
  optimizeDeps: {
    include: [
      // List heavy dependencies that should be pre-bundled
      // e.g., 'lodash', 'moment', '@mui/material'
    ],
    exclude: [
      // Exclude packages that cause issues (rare)
    ],
  },

  // 🏗️ Build configuration (used in `vite build`)
  build: {
    outDir: 'dist',
    sourcemap: true,
    minify: 'esbuild', // or 'terser' for better compression
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        // Add other entry points if needed
      },
      output: {
        // Optional: chunking strategy
        manualChunks: {
          vendor: ['react', 'react-dom', '@reduxjs/toolkit'],
        },
      },
    },
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
});

// Helper: create proxy config with auth (dev only)
function proxyConfig() {
  return {
    target: 'sadjhg',
    changeOrigin: true,
    secure: false, // allow self-signed certs in dev
    headers: proxyAuthHeader
      ? { Authorization: proxyAuthHeader }
      : undefined,
    // Optional: debug logs (safe to remove in real projects)
    onProxyReq: (proxyReq: any, req: any) => {
      if (process.env.DEBUG_PROXY) {
        console.log(`➡️  Proxying: ${req.method} ${req.url}`);
      }
    },
    onProxyRes: (proxyRes: any, req: any) => {
      if (process.env.DEBUG_PROXY) {
        console.log(`⬅️  Response: ${proxyRes.statusCode} for ${req.url}`);
      }
    },
  };
}