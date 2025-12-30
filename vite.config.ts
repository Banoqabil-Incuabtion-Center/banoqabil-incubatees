import { VitePWA } from 'vite-plugin-pwa'
import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
      manifest: {
        name: 'Incubation Management System',
        short_name: 'IMS',
        description: 'Incubation Management System User Frontend',
        theme_color: '#0f7142',
        icons: [
          {
            src: 'bq-image.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'bq-image.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          }
        ],
        display: 'standalone',
        background_color: '#f7f8fd',
        orientation: 'portrait'
      },
      devOptions: {
        enabled: true,
        type: 'module',
      }
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      onwarn(warning, warn) {
        // Ignore certain warnings
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE') return
        warn(warning)
      }
    }
  }
})