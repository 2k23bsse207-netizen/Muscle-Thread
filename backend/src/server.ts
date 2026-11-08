import app from './app.js'
import { env } from './config/env.js'
import { prisma } from './database/prisma.js'

async function start() {
  try {
    await prisma.$connect()
    console.log('Database connection ready')
  } catch (err) {
    // Keep serving: /health reports db: down instead of refusing to boot
    console.warn(`Database unreachable: ${(err as Error).message}`)
  }

  const server = app.listen(env.port, () => {
    console.log(`API listening on http://localhost:${env.port}`)
  })

  const shutdown = (signal: string) => {
    console.log(`${signal} received, shutting down`)
    server.close(() => {
      void prisma.$disconnect().finally(() => process.exit(0))
    })
  }

  process.on('SIGINT', () => shutdown('SIGINT'))
  process.on('SIGTERM', () => shutdown('SIGTERM'))
}

void start().catch((err) => {
  console.error(err)
  process.exit(1)
})
