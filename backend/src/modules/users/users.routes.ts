import { Router } from 'express'
import { requireAuth, requireRole } from '../../middleware/auth.middleware.js'
import * as controller from './users.controller.js'

// Preserve the existing account prefix; profile/session endpoints remain in auth.
const router = Router()
export default router

// Reuse User persistence rather than introducing a duplicate Customer model/module.
export const adminCustomersRoutes = Router()
adminCustomersRoutes.use(requireAuth, requireRole('ADMIN'))
adminCustomersRoutes.get('/', controller.listCustomers)
adminCustomersRoutes.get('/:id', controller.customerDetail)
adminCustomersRoutes.get('/:id/orders', controller.customerOrders)
