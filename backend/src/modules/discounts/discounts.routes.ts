import { Router } from 'express'
import { requireAuth, requireRole } from '../../middleware/auth.middleware.js'
import * as controller from './discounts.controller.js'

const router = Router()
router.use(requireAuth)
// TEMPORARY: coupon-code validation disabled while automatic product/variant
// promotions replace it. Implementation, controller and Discount data are intact;
// restore these two lines to re-enable coupon codes.
// router.post('/validate', controller.validate)
export default router

export const adminDiscountsRoutes = Router()
adminDiscountsRoutes.use(requireAuth, requireRole('ADMIN'))
adminDiscountsRoutes.get('/', controller.list)
adminDiscountsRoutes.post('/', controller.create)
// adminDiscountsRoutes.post('/validate', controller.validate)
adminDiscountsRoutes.get('/:id', controller.detail)
adminDiscountsRoutes.patch('/:id', controller.update)
adminDiscountsRoutes.delete('/:id', controller.remove)
