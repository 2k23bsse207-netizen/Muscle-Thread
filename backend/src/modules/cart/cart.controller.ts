// Request handlers for the cart module.
import type { Request, Response } from 'express'
import * as service from './cart.service.js'
import * as validation from './cart.validation.js'

export async function quote(req: Request, res: Response) {
  res.json(await service.quoteCart(validation.parseQuote(req.body)))
}
