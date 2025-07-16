import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5175,  // Porta atualizada conforme terminal
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
