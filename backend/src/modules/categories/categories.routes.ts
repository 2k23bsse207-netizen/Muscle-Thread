import { Router } from 'express'
import { requireAuth, requireRole } from '../../middleware/auth.middleware.js'
import * as controller from './categories.controller.js'

const router = Router()
router.get('/', controller.list())
router.get('/:id', controller.detail())
export default router

export const adminCategoriesRoutes = Router()
adminCategoriesRoutes.use(requireAuth, requireRole('ADMIN'))
adminCategoriesRoutes.get('/', controller.list(true))
adminCategoriesRoutes.post('/', controller.create)
adminCategoriesRoutes.patch('/sort', controller.sort)
adminCategoriesRoutes.get('/:id', controller.detail(true))
adminCategoriesRoutes.patch('/:id', controller.update)
adminCategoriesRoutes.delete('/:id', controller.remove)
