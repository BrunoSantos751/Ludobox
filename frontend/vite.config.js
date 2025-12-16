import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/',  // garante que o app espere rodar na raiz
  plugins: [react()],
  server: {
    historyApiFallback: true,
    proxy: {
      '/server': {
        target: 'http://localhost:8080', // Sua porta do backend local
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/server/, '')
      }
    }
  }
})
