import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: /^@rawa7el\/attendance-logic\/utils$/, replacement: path.resolve(__dirname, './packages/attendance-logic/src/utils/index.ts') },
      { find: /^@rawa7el\/attendance-logic$/, replacement: path.resolve(__dirname, './packages/attendance-logic/src/index.ts') },
      { find: /^@\//, replacement: path.resolve(__dirname, './src') + '/' },
    ],
  },
  server: {
    port: 3000,
  },
})
