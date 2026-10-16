import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import legacy from '@vitejs/plugin-legacy'

// https://vite.dev/config/
export default defineConfig({
    plugins: [react(), legacy({ targets: ['defaults', 'Android >= 7', 'Chrome >= 61'] })],
})
