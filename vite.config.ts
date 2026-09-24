import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      // Without this, Vite treats the bare "buffer" specifier as the Node built-in and
      // externalizes it in client code instead of resolving the real npm polyfill package.
      buffer: 'buffer',
    },
  },
  define: {
    // @solana/web3.js and the wallet adapters expect Node-style globals in the browser.
    global: 'globalThis',
  },
  optimizeDeps: {
    include: ['buffer'],
  },
})
