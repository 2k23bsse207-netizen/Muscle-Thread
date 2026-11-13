import type { Request, Response } from 'express'
import { sendPage } from '../../utils/pagination.js'
import { id } from '../../utils/validation.js'
import * as service from './orders.service.js'
import * as validation from './orders.validation.js'

export function list(admin = false) {
  return async (req: Request, res: Response) => sendPage(res, await service.listOrders(validation.parseQuery(req.query, admin), admin ? undefined : req.user!.id, admin), admin)
}
export function detail(admin = false) {
  return async (req: Request, res: Response) => res.json(await service.getOrder(id(req.params.id), admin ? undefined : req.user!.id, admin))
}
export function history(admin = false) {
  return async (req: Request, res: Response) => res.json(await service.orderHistory(id(req.params.id), validation.parseHistoryQuery(req.query), admin ? undefined : req.user!.id, admin))
}
export async function updateStatus(req: Request, res: Response) {
  res.json(await service.updateOrderStatus(id(req.params.id), validation.parseStatus(req.body), req.user!.id))
}
export async function create(req: Request, res: Response) {
  res.status(201).json(await service.createOrder(req.user!.id, validation.parseCreate(req.body)))
}
