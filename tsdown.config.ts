import { readFileSync } from 'node:fs';
import { defineConfig } from 'tsdown';
import { metadata } from './scripts/version.mjs';

export default defineConfig({
  entry: { 'wordle-solver.user': 'src/index.ts' },
  format: 'iife',
  platform: 'browser',
  target: 'es2022',
  outputOptions: { entryFileNames: 'wordle-solver.user.js' },
  clean: true,
  dts: false,
  banner: metadata(readFileSync('src/index.ts', 'utf8')).block,
});
