//  @ts-check

import { tanstackConfig } from '@tanstack/eslint-config'

export default [
  ...tanstackConfig,
  {
    ignores: [
      // Auto-generated API client files (causing errors)
      'src/client/core/request.ts',
      'src/client/core/CancelablePromise.ts',
      'src/client/core/ApiRequestOptions.ts',
      'src/client/core/OpenAPI.ts',
      'src/client/sdk.gen.ts',
      // Config files
      'tailwind.config.js',
      'node_modules',
      'dist',
      'src/routes/demo.start.server-funcs.tsx',
    ],
  },
]
