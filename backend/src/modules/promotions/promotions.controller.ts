import type { Request, Response } from 'express'
import { id } from '../../utils/validation.js'
import * as service from './promotions.service.js'
import * as validation from './promotions.validation.js'

export async function list(req: Request, res: Response) {
  res.json(await service.listPromotions(validation.parseQuery(req.query)))
}
export async function detail(req: Request, res: Response) {
  res.json(await service.getPromotion(id(req.params.id)))
}
export async function create(req: Request, res: Response) {
  res.status(201).json(await service.createPromotion(validation.parseCreate(req.body)))
}
export async function update(req: Request, res: Response) {
  res.json(await service.updatePromotion(id(req.params.id), validation.parseUpdate(req.body)))
}
export async function remove(req: Request, res: Response) {
  res.json(await service.removePromotion(id(req.params.id)))
}
export async function active(_req: Request, res: Response) {
  res.json(await service.listActivePromotions())
}
