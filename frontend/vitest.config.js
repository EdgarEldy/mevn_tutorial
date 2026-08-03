import { fileURLToPath } from 'node:url'
import { mergeConfig, defineConfig, configDefaults } from 'vitest/config'
import viteConfig from './vite.config'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      exclude: [...configDefaults.exclude, 'e2e/*'],
      root: fileURLToPath(new URL('./', import.meta.url)),
      setupFiles: ['./src/test-setup.js'],
      // Vitest externalizes node_modules deps by default, which routes vuetify's
      // per-component CSS imports through Node's raw ESM loader instead of Vite's
      // transform pipeline - inlining it here fixes "Unknown file extension .css".
      server: {
        deps: {
          inline: ['vuetify'],
        },
      },
    }
  })
)
