import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Minimal config without Node-specific imports to satisfy TypeScript build
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
})
