import type { NextFunction, Request, Response } from 'express'
import { AppError } from '../errors/app-error.js'
import { Prisma } from '../generated/prisma/client.js'

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  let normalized = err
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') normalized = new AppError('A record with these unique fields already exists', 409)
    if (err.code === 'P2003') normalized = new AppError('This operation conflicts with a related record', 409)
    if (err.code === 'P2025') normalized = new AppError('Record not found', 404)
    if (err.code === 'P2034') normalized = new AppError('Concurrent modification; please retry', 409)
  }
  const appError = normalized instanceof AppError ? normalized : null
  // Malformed JSON body from express.json() is a client error, not a 500
  const isBodyError = err instanceof SyntaxError && 'body' in err
  const isTooLarge = err instanceof Error && 'type' in err && err.type === 'entity.too.large'

  if (!appError && !isBodyError && !isTooLarge) console.error(err)

  const statusCode = appError ? appError.statusCode : isBodyError ? 400 : isTooLarge ? 413 : 500

  res.status(statusCode).json({
    message: appError ? appError.message : isBodyError ? err.message : isTooLarge ? 'Request body is too large' : 'Internal server error',
  })
}
