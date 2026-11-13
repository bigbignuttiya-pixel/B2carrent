import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { cpSync, mkdirSync } from 'node:fs';

// Serve MediaPipe's WebAssembly runtime from the site itself (admin "remove background" tool).
// Runs on every dev/build, however the build is started (npm run build, vite build, Vercel, …).
function copyMediapipeWasm() {
  return {
    name: 'copy-mediapipe-wasm',
    configResolved() {
      const to = new URL('./public/mediapipe/wasm/', import.meta.url);
      mkdirSync(to, { recursive: true });
      cpSync(new URL('./node_modules/@mediapipe/tasks-vision/wasm/', import.meta.url), to, { recursive: true });
    },
  };
}

export default defineConfig({
  plugins: [react(), copyMediapipeWasm()],
});
