import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  root: ".",  // Ensure the root is the project directory
  base: "./", // Ensures correct path resolution
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
    strictPort: true, // Ensures Vite doesn't switch ports if 5173 is in use
    watch: {
      usePolling: true, // Ensures changes are detected correctly
    },
  },
  build: {
    outDir: "dist", // Ensure the build output is correct
  },
});
