import type { Request, Response } from 'express'
import { sendPage } from '../../utils/pagination.js'
import { id } from '../../utils/validation.js'
import * as service from './products.service.js'
import * as validation from './products.validation.js'
import type { ColorInput, ColorUpdate, ImageInput, ImageUpdate, VariantInput, VariantUpdate } from './products.types.js'

function colorScope(req: Request): string | undefined {
  return req.params.colorId === undefined ? undefined : id(req.params.colorId, 'colorId')
}

export function list(admin = false) {
  return async (req: Request, res: Response) => sendPage(res, await service.listProducts(validation.parseProductQuery(req.query), admin), admin)
}
export function detail(admin = false) {
  return async (req: Request, res: Response) => res.json(await service.getProduct(id(req.params.id), admin))
}
export async function create(req: Request, res: Response) {
  res.status(201).json(await service.createProduct(validation.parseCreateProduct(req.body), req.user!.id))
}
export async function update(req: Request, res: Response) {
  res.json(await service.updateProduct(id(req.params.id), validation.parseUpdateProduct(req.body)))
}
export async function remove(req: Request, res: Response) {
  res.json(await service.archiveProduct(id(req.params.id)))
}
export async function addColor(req: Request, res: Response) {
  res.status(201).json(await service.addColor(id(req.params.id), validation.parseColor(req.body) as ColorInput))
}
export async function updateColor(req: Request, res: Response) {
  res.json(await service.updateColor(id(req.params.id), id(req.params.colorId, 'colorId'), validation.parseColor(req.body, true) as ColorUpdate))
}
export async function removeColor(req: Request, res: Response) {
  res.json(await service.removeColor(id(req.params.id), id(req.params.colorId, 'colorId'), validation.parseRemoval(req.body).expectedUpdatedAt))
}
export async function addImage(req: Request, res: Response) {
  const input = req.file
    ? validation.parseImageUpload(req.file.buffer, req.body)
    : Buffer.isBuffer(req.body)
      ? validation.parseImageUpload(req.body, req.query)
      : validation.parseImage(req.body) as ImageInput
  res.status(201).json(await service.addImage(id(req.params.id), input, colorScope(req)))
}
export async function updateImage(req: Request, res: Response) {
  const input = req.file
    ? validation.parseImageUpload(req.file.buffer, req.body)
    : Buffer.isBuffer(req.body)
      ? validation.parseImageUpload(req.body, req.query)
      : validation.parseImage(req.body, true) as ImageUpdate
  res.json(await service.updateImage(id(req.params.id), id(req.params.imageId, 'imageId'), input, colorScope(req)))
}
export async function removeImage(req: Request, res: Response) {
  res.json(await service.removeImage(id(req.params.id), id(req.params.imageId, 'imageId'), colorScope(req)))
}
export async function reorderImages(req: Request, res: Response) {
  res.json(await service.reorderImages(id(req.params.id), validation.parseImageOrder(req.body), colorScope(req)))
}
export async function addVariant(req: Request, res: Response) {
  res.status(201).json(await service.addVariant(id(req.params.id), validation.parseVariant(req.body) as VariantInput, req.user!.id))
}
export async function updateVariant(req: Request, res: Response) {
  res.json(await service.updateVariant(id(req.params.id), id(req.params.variantId, 'variantId'), validation.parseVariant(req.body, true) as VariantUpdate))
}
export async function removeVariant(req: Request, res: Response) {
  res.json(await service.removeVariant(id(req.params.id), id(req.params.variantId, 'variantId'), validation.parseRemoval(req.body).expectedUpdatedAt))
}
