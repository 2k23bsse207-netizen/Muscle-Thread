import { prisma } from '../database/prisma.js'
import { Prisma } from '../generated/prisma/client.js'

/** Retry complete serializable transactions, never partially applied writes. */
export async function transaction<T>(work: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await prisma.$transaction(work, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        maxWait: 5000,
        timeout: 15000,
      })
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2034' || attempt >= 2) throw error
    }
  }
}
