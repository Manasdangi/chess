import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite configuration
export default defineConfig({
  plugins: [react()],
  define: {
    'process.env.NODE_ENV': '"production"', // This explicitly sets NODE_ENV to production
  },
});
