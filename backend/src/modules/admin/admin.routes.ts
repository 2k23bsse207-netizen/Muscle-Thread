import { Router } from 'express'
import { requireAuth, requireRole } from '../../middleware/auth.middleware.js'
import { dashboard } from './admin.controller.js'
import { adminProductsRoutes } from '../products/products.routes.js'
import { adminCategoriesRoutes } from '../categories/categories.routes.js'
import inventoryRoutes from '../inventory/inventory.routes.js'
import { adminOrdersRoutes } from '../orders/orders.routes.js'
import { adminCustomersRoutes } from '../users/users.routes.js'
import { adminDiscountsRoutes } from '../discounts/discounts.routes.js'
import { adminPromotionsRoutes } from '../promotions/promotions.routes.js'
import { adminSettingsRoutes } from '../settings/settings.routes.js'

const router = Router()
router.get('/dashboard', requireAuth, requireRole('ADMIN'), dashboard)
router.use('/products', adminProductsRoutes)
router.use('/categories', adminCategoriesRoutes)
router.use('/inventory', inventoryRoutes)
router.use('/orders', adminOrdersRoutes)
router.use('/customers', adminCustomersRoutes)
router.use('/discounts', adminDiscountsRoutes)
router.use('/promotions', adminPromotionsRoutes)
router.use('/settings', adminSettingsRoutes)

export default router
