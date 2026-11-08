import { Router } from 'express'
import { requireAuth, requireRole } from '../../middleware/auth.middleware.js'
import * as controller from './products.controller.js'

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
adminProductsRoutes.post('/:id/images', controller.addImage)
adminProductsRoutes.patch('/:id/images/reorder', controller.reorderImages)
adminProductsRoutes.patch('/:id/images/:imageId', controller.updateImage)
adminProductsRoutes.delete('/:id/images/:imageId', controller.removeImage)
adminProductsRoutes.post('/:id/variants', controller.addVariant)
adminProductsRoutes.patch('/:id/variants/:variantId', controller.updateVariant)
adminProductsRoutes.delete('/:id/variants/:variantId', controller.removeVariant)
