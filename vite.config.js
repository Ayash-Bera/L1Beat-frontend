import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { plugin as markdown } from 'vite-plugin-markdown'

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  const isProduction = mode === 'production'
  const isDevelopment = mode === 'development'
  
  return {
    plugins: [
      react(),
      markdown({
        markdownIt: {
          html: true,
          linkify: true,
          typographer: true
        }
      }),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
        manifest: {
          name: 'L1Beat - Avalanche L1 Analytics',
          short_name: 'L1Beat',
          description: 'Analytics and scoring system for Avalanche L1 chains',
          theme_color: '#535bf2',
          icons: [
            {
              src: 'icons/icon-192x192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'icons/icon-512x512.png',
              sizes: '512x512',
              type: 'image/png'
            }
          ]
        },
        workbox: {
          maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
          globPatterns: ['**/*.{js,css,html,ico,png,svg,md}']
        }
      })
    ],
    assetsInclude: ['**/*.md'],
    define: {
      'process.env.NODE_ENV': JSON.stringify(mode),
      'process.env.VITE_API_URL': JSON.stringify(
        isProduction 
          ? 'https://backend-phi-green.vercel.app'
          : 'http://localhost:5001'
      )
    },
    server: {
      historyApiFallback: true,
      headers: {
        'Cache-Control': 'no-store',
      },
    },
    preview: {
      port: 4173,
      strictPort: true,
      host: true,
      historyApiFallback: true,
    },
    build: {
      sourcemap: isDevelopment,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: [
              'react',
              'react-dom',
              'react-router-dom',
              '@0xstt/builderkit'
            ],
            charts: ['recharts']
          },
          chunkFileNames: 'assets/[name]-[hash].js',
          entryFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]',
        }
      },
      chunkSizeWarningLimit: 3000
    }
  }
})
