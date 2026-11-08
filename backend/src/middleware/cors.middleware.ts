import type { NextFunction, Request, Response } from 'express'

// Single source of truth for CORS — add production origins here when deploying
const ALLOWED_ORIGINS = new Set(['http://localhost:5173'])

export function cors(req: Request, res: Response, next: NextFunction) {
  const origin = req.headers.origin

  if (origin && ALLOWED_ORIGINS.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Access-Control-Allow-Credentials', 'true')
    res.setHeader('Vary', 'Origin')
    res.setHeader('Access-Control-Expose-Headers', 'X-Total-Count,X-Page,X-Page-Size,X-Total-Pages')
  }

  // Preflight: answer directly so it never reaches the routers (which 404 OPTIONS)
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    res.setHeader('Access-Control-Max-Age', '86400')
    res.status(204).end()
    return
  }

  next()
}
