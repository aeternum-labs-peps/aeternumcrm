import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: './', // permite hospedar em qualquer pasta/subcaminho (GitHub Pages etc.)
  plugins: [react()],
  server: { port: 5199, strictPort: false },
  // impede o Vite de herdar o postcss.config.js quebrado da pasta pai (DASH/)
  css: { postcss: { plugins: [] } },
})
