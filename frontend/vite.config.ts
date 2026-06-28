import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [
          // Disable styled-components checkDynamicCreation by setting displayName=false
          // This eliminates the false-positive "Invalid hook call" warnings in dev mode
          ['babel-plugin-styled-components', {
            displayName: false,
            fileName: false,
            pure: true,
          }],
        ],
      },
    }),
  ],
  resolve: {
    dedupe: ['react', 'react-dom', 'styled-components'],
  },
})