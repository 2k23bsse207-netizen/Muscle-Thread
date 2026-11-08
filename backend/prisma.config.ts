import 'dotenv/config'
import { defineConfig, env } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    // CLI (migrate/studio) uses the direct Neon connection; runtime uses the pooled URL.
    url: env('DIRECT_URL'),
  },
})
