import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  server: {
    allowedHosts: true,
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
    },
    // Backend ghi file dữ liệu vào thư mục data/ khi có giao dịch mới.
    // Không watch thư mục này để tránh Vite full-reload trang đột ngột.
    watch: {
      ignored: ["**/data/**"],
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    babel({ presets: [reactCompilerPreset()] })
  ],
  build: {
    // Tách vendor React ra chunk riêng để cache tốt hơn và main chunk nhẹ hơn.
    chunkSizeWarningLimit: 600,
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'react-vendor',
              test: /node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/,
            },
          ],
        },
      },
    },
  },
})
