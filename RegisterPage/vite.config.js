import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: [
      '5173-iat70u8g80w6ilpkyr0sh-e6595861.manusvm.computer',
      '5174-iat70u8g80w6ilpkyr0sh-e6595861.manusvm.computer',
      'localhost'
    ]
  }
})
