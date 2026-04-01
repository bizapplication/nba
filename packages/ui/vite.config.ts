import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [
    vue(),
    dts({
      include: ['src/**/*.ts', 'src/**/*.vue'],
      outputDir: 'dist',
      staticImport: true,
      strictCompilerOptions: true
    })
  ],
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'NbaUi',
      fileName: (format) => `index.${format === 'es' ? 'mjs' : 'js'}`
    },
    rollupOptions: {
      external: ['vue', '@nuxt/ui'],
      output: {
        globals: {
          vue: 'Vue',
          '@nuxt/ui': 'NuxtUi'
        }
      }
    }
  }
})
