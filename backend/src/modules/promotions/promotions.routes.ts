import { Router } from 'express'
import { requireAuth, requireRole } from '../../middleware/auth.middleware.js'
import * as controller from './promotions.controller.js'

// Public marquee feed: currently-running promotions for the storefront.
const router = Router()
router.get('/', controller.active)

export default router

export const adminPromotionsRoutes = Router()
adminPromotionsRoutes.use(requireAuth, requireRole('ADMIN'))
adminPromotionsRoutes.get('/', controller.list)
adminPromotionsRoutes.post('/', controller.create)
adminPromotionsRoutes.get('/:id', controller.detail)
adminPromotionsRoutes.patch('/:id', controller.update)
adminPromotionsRoutes.delete('/:id', controller.remove)
