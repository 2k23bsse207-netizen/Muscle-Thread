import { Router } from 'express'
import { requireAuth, requireRole } from '../../middleware/auth.middleware.js'
import * as controller from './orders.controller.js'

const router = Router()
router.use(requireAuth)
router.get('/', controller.list())
router.get('/:id', controller.detail())
router.get('/:id/history', controller.history())
export default router

export const adminOrdersRoutes = Router()
adminOrdersRoutes.use(requireAuth, requireRole('ADMIN'))
adminOrdersRoutes.get('/', controller.list(true))
adminOrdersRoutes.get('/:id', controller.detail(true))
adminOrdersRoutes.get('/:id/history', controller.history(true))
adminOrdersRoutes.patch('/:id/status', controller.updateStatus)
