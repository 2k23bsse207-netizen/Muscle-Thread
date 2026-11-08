import type { Request, Response } from 'express'
import { sendPage } from '../../utils/pagination.js'
import { id } from '../../utils/validation.js'
import * as service from './categories.service.js'
import * as validation from './categories.validation.js'

export function list(admin = false) {
  return async (req: Request, res: Response) => sendPage(res, await service.listCategories(validation.parseQuery(req.query), admin), admin)
}
export function detail(admin = false) {
  return async (req: Request, res: Response) => res.json(await service.getCategory(id(req.params.id), admin))
}
export async function create(req: Request, res: Response) {
  res.status(201).json(await service.createCategory(validation.parseCreate(req.body)))
}
export async function update(req: Request, res: Response) {
  res.json(await service.updateCategory(id(req.params.id), validation.parseUpdate(req.body)))
}
export async function remove(req: Request, res: Response) {
  res.json(await service.removeCategory(id(req.params.id)))
}
export async function sort(req: Request, res: Response) {
  res.json(await service.sortCategories(validation.parseSort(req.body)))
}
