import type { Request, Response } from 'express'
import { id } from '../../utils/validation.js'
import { parseQuery as parseOrderQuery } from '../orders/orders.validation.js'
import * as service from './users.service.js'
import { parseCustomerQuery } from './users.validation.js'

export async function listCustomers(req: Request, res: Response) {
  res.json(await service.listCustomers(parseCustomerQuery(req.query)))
}
export async function customerDetail(req: Request, res: Response) {
  res.json(await service.getCustomer(id(req.params.id)))
}
export async function customerOrders(req: Request, res: Response) {
  res.json(await service.customerOrders(id(req.params.id), parseOrderQuery(req.query)))
}
