import type { Request, Response } from 'express'
import { id } from '../../utils/validation.js'
import * as service from './inventory.service.js'
import * as validation from './inventory.validation.js'

export async function list(req: Request, res: Response) {
  res.json(await service.listInventory(validation.parseQuery(req.query)))
}
export async function lowStock(req: Request, res: Response) {
  res.json(await service.listInventory({ ...validation.parseQuery(req.query), lowStock: true }))
}
export async function stats(req: Request, res: Response) {
  res.json(await service.inventoryStats(validation.parseQuery(req.query)))
}
export async function detail(req: Request, res: Response) {
  res.json(await service.getInventory(id(req.params.id)))
}
export async function adjust(req: Request, res: Response) {
  res.status(201).json(await service.adjustStock(id(req.params.id), validation.parseAdjustment(req.body), req.user!.id))
}
export async function update(req: Request, res: Response) {
  res.json(await service.updateInventory(id(req.params.id), validation.parseUpdate(req.body)))
}
export async function history(req: Request, res: Response) {
  res.json(await service.stockHistory(id(req.params.id), validation.parseHistoryQuery(req.query)))
}
