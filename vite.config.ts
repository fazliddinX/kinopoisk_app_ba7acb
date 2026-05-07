import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-oxc';
import federation from '@originjs/vite-plugin-federation';

export default defineConfig(({ command }) => ({
  plugins: [
    react(),
    ...(command === 'build' ? [
      federation({
        name: 'remote_app',
        filename: 'remoteEntry.js',
        exposes: { './App': './src/App.tsx' },
        shared: ['react', 'react-dom'],
      }),
    ] : []),
  ],
  build: {
    modulePreload: false,
    target: 'esnext',
    minify: false,
    cssCodeSplit: false,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
}));
