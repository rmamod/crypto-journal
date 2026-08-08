/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// `base` doit correspondre au nom du repo GitHub : le site est servi sur
// https://<user>.github.io/<repo>/ et sans ça tous les assets partent en 404.
export default defineConfig({
  base: '/crypto-journal/',
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
