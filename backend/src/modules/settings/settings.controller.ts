import type { Request, Response } from 'express'
import * as service from './settings.service.js'
import { parseUpdate } from './settings.validation.js'

export async function show(_req: Request, res: Response) {
  res.json(await service.getStoreSettings())
}
export async function update(req: Request, res: Response) {
  res.json(await service.updateStoreSettings(parseUpdate(req.body)))
}
