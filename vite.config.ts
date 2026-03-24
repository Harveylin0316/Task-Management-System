import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // 讓 dist 可用相對路徑載入資源；勿用檔案總管雙擊 HTML，請用 npm run dev / preview
  base: './',
})
