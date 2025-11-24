import { defineConfig } from 'vite'
import viteReact from '@vitejs/plugin-react'
import viteTsConfigPaths from 'vite-tsconfig-paths'
import tailwindcss from '@tailwindcss/vite'

// Export an async config so we can do a dynamic import
export default defineConfig(async () => {
  // Polyfill globalThis.File in Node (CI) so undici doesn't crash
  if (typeof (globalThis as any).File === 'undefined') {
    ;(globalThis as any).File = class {}
  }

  // Import the TanStack React Start plugin *after* File exists
  const { tanstackStart } = await import('@tanstack/react-start/plugin/vite')

  return {
    plugins: [
      // this is the plugin that enables path aliases
      viteTsConfigPaths({
        projects: ['./tsconfig.json'],
      }),
      tailwindcss(),
      tanstackStart({
        customViteReactPlugin: true,
      }),
      viteReact(),
    ],
  }
})
