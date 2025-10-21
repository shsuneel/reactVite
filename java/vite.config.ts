// vite.config.ts
import { defineConfig, type ServerOptions } from 'vite';
import react from '@vitejs/plugin-react';

// Load environment variables
// Note: process.env is available in Node.js context (vite.config.ts runs in Node)
const { USERNAME, PASSWORD } = process.env;

if (!USERNAME || !PASSWORD) {
  console.error(
    '❌ Error: USERNAME and PASSWORD must be defined in your environment (e.g., .env file)'
  );
  process.exit(1);
}

const proxyPaths = [
  '/SyndicateReportService',
  '/SyndicateStaticDataService',
  '/SyndicateConfiguration',
  '/SyndicateDealService',
  '/SyndicateEntitlementsService',
  '/SyndicateOrderService',
  '/SyndicateGatewayService',
  '/BookingService',
  '/actuator',
  '/api',
  '/sse',
  '/subscriptions',
  '/SyndicateDocumentationService',
  '/SyndicateSalesCreditService',
  '/DiagnosticService',
] as const;

const target = 'https://your-dev-api.com'; // ✅ Removed trailing space
const auth = `${USERNAME}:${PASSWORD}`;

const proxyConfig = proxyPaths.reduce((acc, path) => {n
  acc[path] = {
    target,
    changeOrigin: true,
    secure: false,
    configure: (proxy) => {
      proxy.on('proxyReq', (proxyReq) => {
        proxyReq.setHeader(
          'Authorization',
          `Basic ${Buffer.from(auth).toString('base64')}`
        );
      });
    },
  };
  return acc;
}, {} as Record<string, ServerOptions['proxy'] extends Record<string, infer U> ? U : unknown>);

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: '0.0.0.0',
    proxy: proxyConfig,
  },
});