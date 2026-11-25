import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      // Copies static assets and vanilla scripts into dist/ so both direct static
      // hosting and vite build resolve assets/ and scripts identically.
      {
        name: 'copy-unbundled-src-assets',
        apply: 'build',
        closeBundle(error?: Error): void {
          if (error) {
            return;
          }
          const distDir = path.resolve(__dirname, 'dist');
          if (!fs.existsSync(distDir)) {
            return;
          }
          const srcAssets = path.resolve(__dirname, 'src/assets');
          const distSrcAssets = path.resolve(distDir, 'src/assets');
          if (fs.existsSync(srcAssets)) {
            fs.cpSync(srcAssets, distSrcAssets, {recursive: true, force: true});
          }
          const rootAssets = path.resolve(__dirname, 'assets');
          const distRootAssets = path.resolve(distDir, 'assets');
          if (fs.existsSync(rootAssets)) {
            fs.cpSync(rootAssets, distRootAssets, {recursive: true, force: true});
          }
          for (const file of ['content.js', 'app.js', 'styles.css']) {
            const srcFile = path.resolve(__dirname, file);
            const distFile = path.resolve(distDir, file);
            if (fs.existsSync(srcFile)) {
              fs.copyFileSync(srcFile, distFile);
            }
          }
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
