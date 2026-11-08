import { Router } from 'express'
import { adminProductsRoutes } from '../products/products.routes.js'
import { adminCategoriesRoutes } from '../categories/categories.routes.js'
import inventoryRoutes from '../inventory/inventory.routes.js'
import { adminOrdersRoutes } from '../orders/orders.routes.js'

const router = Router()
router.use('/products', adminProductsRoutes)
router.use('/categories', adminCategoriesRoutes)
router.use('/inventory', inventoryRoutes)
router.use('/orders', adminOrdersRoutes)

export default router
