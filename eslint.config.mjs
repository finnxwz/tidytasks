import obsidianmd from 'eslint-plugin-obsidianmd';
import globals from 'globals';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig(
  globalIgnores(['node_modules/**', 'main.js', 'esbuild.config.mjs', 'eslint.config.mjs',
    'version-bump.mjs', 'tests/*.test.mjs',
    'package*.json', 'tsconfig.json', 'versions.json', 'obsidian testvault/**']),
  ...obsidianmd.configs.recommended,
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
      parserOptions: {
        projectService: { allowDefaultProject: ['manifest.json'] },
        tsconfigRootDir: import.meta.dirname,
        extraFileExtensions: ['.json'],
      },
    },
  },
  {
    files: ['tests/**/*.ts'],
    // Tests run under Node.js and are never bundled into the mobile plugin.
    rules: { 'obsidianmd/no-nodejs-modules': 'off' },
  },
);
