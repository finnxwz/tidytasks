import * as esbuild from 'esbuild';
import { bumpVersion } from './version-bump.mjs';

const production = process.argv[2] === 'production';
const context = await esbuild.context({
  entryPoints: ['src/main.ts'],
  bundle: true,
  external: ['obsidian'],
  format: 'cjs',
  target: 'es2021',
  outfile: 'main.js',
  sourcemap: production ? false : 'inline',
  logLevel: 'info',
});
if (production) {
  await context.rebuild();
  await context.dispose();
  await bumpVersion();
} else {
  await context.watch();
}
