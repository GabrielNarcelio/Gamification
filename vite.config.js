import { defineConfig } from 'vite'

export default defineConfig({
  resolve: {
    alias: {
      '@': new URL('./src', import.meta.url).pathname,
    },
  },
  server: {
    port: 5173,
    open: true,
    cors: true
    // Proxy removido: usando backend Node.js direto
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
})
