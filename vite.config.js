import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 开发时前端跑在 5173，API 由 Express(3457) 提供，这里做代理
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://127.0.0.1:3457'
    }
  },
  build: {
    outDir: 'dist'
  }
})
