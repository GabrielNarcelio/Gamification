import { defineConfig } from 'vite'

export default defineConfig({
  resolve: {
    alias: {
      '@': new URL('./src', import.meta.url).pathname,
    },
  },
  server: {
    port: 5174,  // Corrigido para porta atual
    open: true,
    cors: true,
    // Força limpeza de cache
    force: true
    // Proxy removido: usando backend Node.js direto
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  // Força rebuild do CSS
  css: {
    devSourcemap: true
  }
})
