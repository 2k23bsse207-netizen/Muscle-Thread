import type { Request, Response } from 'express'
import { getDashboard } from './admin.service.js'
import { parseDashboardQuery } from './admin.validation.js'

export async function dashboard(req: Request, res: Response) {
  res.json(await getDashboard(parseDashboardQuery(req.query)))
}
