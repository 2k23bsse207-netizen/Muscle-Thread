import type { Request, Response } from 'express'
import { id } from '../../utils/validation.js'
import * as service from './discounts.service.js'
import * as validation from './discounts.validation.js'

export async function list(req: Request, res: Response) {
  res.json(await service.listDiscounts(validation.parseQuery(req.query)))
}
export async function detail(req: Request, res: Response) {
  res.json(await service.getDiscount(id(req.params.id)))
}
export async function create(req: Request, res: Response) {
  res.status(201).json(await service.createDiscount(validation.parseCreate(req.body)))
}
export async function update(req: Request, res: Response) {
  res.json(await service.updateDiscount(id(req.params.id), validation.parseUpdate(req.body)))
}
export async function remove(req: Request, res: Response) {
  res.json(await service.removeDiscount(id(req.params.id)))
}
export async function validate(req: Request, res: Response) {
  res.json(await service.validateDiscount(validation.parseValidation(req.body)))
}
