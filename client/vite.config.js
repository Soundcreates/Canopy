import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from  '@tailwindcss/vite'
// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  optimizeDeps: {
    include: ['mapbox-gl'],
    exclude: ['react-map-gl'],
    esbuildOptions: {
      target: 'es2020'
    }
  },
  resolve: {
    dedupe: ['react', 'react-dom']
  },
  define: {
    'process.env': {}
  },
  server: {
    fs: {
      strict: false
    }
  }
})
