import { Router } from 'express'
import { requireAuth, requireRole } from '../../middleware/auth.middleware.js'
import * as controller from './products.controller.js'
import { imageBody } from './products.upload.js'

const router = Router()
router.get('/', controller.list())
router.get('/:id', controller.detail())
export default router

// Admin CRUD has one canonical endpoint set; public routes never expose drafts.
export const adminProductsRoutes = Router()
adminProductsRoutes.use(requireAuth, requireRole('ADMIN'))
adminProductsRoutes.get('/', controller.list(true))
adminProductsRoutes.post('/', controller.create)
adminProductsRoutes.get('/:id', controller.detail(true))
adminProductsRoutes.patch('/:id', controller.update)
adminProductsRoutes.delete('/:id', controller.remove)
adminProductsRoutes.post('/:id/colors', controller.addColor)
adminProductsRoutes.patch('/:id/colors/:colorId', controller.updateColor)
adminProductsRoutes.delete('/:id/colors/:colorId', controller.removeColor)
// Colour scope is checked before any asset upload and again inside its write.
adminProductsRoutes.post('/:id/colors/:colorId/images', imageBody, controller.addImage)
adminProductsRoutes.patch('/:id/colors/:colorId/images/reorder', controller.reorderImages)
adminProductsRoutes.patch('/:id/colors/:colorId/images/:imageId', imageBody, controller.updateImage)
adminProductsRoutes.delete('/:id/colors/:colorId/images/:imageId', controller.removeImage)
// Multipart/binary parsing is bounded and runs only after the admin gate.
adminProductsRoutes.post('/:id/images', imageBody, controller.addImage)
adminProductsRoutes.patch('/:id/images/reorder', controller.reorderImages)
adminProductsRoutes.patch('/:id/images/:imageId', imageBody, controller.updateImage)
adminProductsRoutes.delete('/:id/images/:imageId', controller.removeImage)
adminProductsRoutes.post('/:id/variants', controller.addVariant)
adminProductsRoutes.patch('/:id/variants/:variantId', controller.updateVariant)
adminProductsRoutes.delete('/:id/variants/:variantId', controller.removeVariant)
