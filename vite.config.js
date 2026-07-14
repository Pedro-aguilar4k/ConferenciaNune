import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { compression } from 'vite-plugin-compression2'

export default defineConfig({
  plugins: [
    react({ include: /\.(jsx|js)$/ }),
    compression({ algorithm: 'gzip', exclude: [/\.(png|jpg|webp|svg|woff2)$/] }),
  ],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  server: {
    host: true,
    port: 3000,
    strictPort: true,
    proxy: {
      '/api': { target: 'http://localhost:8001', changeOrigin: true },
    },
  },
  build: {
    target: 'es2020',
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/recharts') || id.includes('node_modules/d3-')) return 'charts'
          if (id.includes('node_modules/react-router')) return 'router'
          if (id.includes('node_modules/@radix-ui')) return 'radix'
          if (id.includes('node_modules/framer-motion')) return 'motion'
          if (id.includes('node_modules/lucide-react')) return 'icons'
          if (id.includes('node_modules/axios') || id.includes('node_modules/swr')) return 'http'
          if (
            id.includes('node_modules/react/') ||
            id.includes('node_modules/react-dom/') ||
            id.includes('node_modules/react-is/')
          ) return 'vendor'
        },
      },
    },
  },
})
