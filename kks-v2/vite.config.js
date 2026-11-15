import { defineConfig } from 'vite';
import { resolve } from 'path';
import fs from 'fs';

// Multi-page build: every .html in the root, services/ and legal/ becomes an entry.
const dir = import.meta.dirname;
const pages = ['.', 'services', 'legal'].flatMap((d) =>
  fs.existsSync(resolve(dir, d)) ? fs.readdirSync(resolve(dir, d)).filter((f) => f.endsWith('.html')).map((f) => (d === '.' ? f : `${d}/${f}`)) : []);
const input = Object.fromEntries(pages.map((p) => [p.replace(/\.html$/, '').replace(/\//g, '-'), resolve(dir, p)]));

export default defineConfig({
  base: './',
  build: { rollupOptions: { input }, chunkSizeWarningLimit: 900 },
});
