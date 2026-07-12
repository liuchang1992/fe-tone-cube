import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    visualizer({
      open: true,
      gzipSize: true,
      brotliSize: true,
      filename: 'dist/stats.html',
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  build : {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // 单独拆分 antd 和图标库
            if (id.includes('antd')) {
              return 'antd';
            }
            if (id.includes('@ant-design/icons')) {
              return 'antd-icons';
            }
            // 单独拆分路由库
            if (id.includes('react-router') || id.includes('history')) {
              return 'router';
            }
            // 单独拆分 axios
            if (id.includes('axios')) {
              return 'axios';
            }
            // 其他第三方库打包为 vendor
            return 'vendor';
          }
        },
      }
    },
    chunkSizeWarningLimit: 1000, // 调高警告阈值
  }
})
