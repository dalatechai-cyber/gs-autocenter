import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'public',
    emptyOutDir: false,
    rollupOptions: {
      input: './src/chat-widget-entry.jsx',
      output: {
        entryFileNames: 'react-chat-widget.js',
        chunkFileNames: 'react-chat-[name].js',
        assetFileNames: 'react-chat-[name].[ext]'
      }
    }
  }
});
