import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/flows': {
        target: 'http://localhost:1880',
        changeOrigin: true
      },
      '/api': {
        target: 'http://localhost:1880',
        changeOrigin: true
      }
    }
  }
})
