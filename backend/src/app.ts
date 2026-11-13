import express from 'express'
import cookieParser from 'cookie-parser'
import { cors } from './middleware/cors.middleware.js'
import { errorHandler } from './middleware/error.middleware.js'
import { notFound } from './middleware/not-found.middleware.js'
import { prisma } from './database/prisma.js'
import adminRoutes from './modules/admin/admin.routes.js'
import authRoutes from './modules/auth/auth.routes.js'
import cartRoutes from './modules/cart/cart.routes.js'
import categoriesRoutes from './modules/categories/categories.routes.js'
import discountsRoutes from './modules/discounts/discounts.routes.js'
import ordersRoutes from './modules/orders/orders.routes.js'
import paymentsRoutes from './modules/payments/payments.routes.js'
import productsRoutes from './modules/products/products.routes.js'
import promotionsRoutes from './modules/promotions/promotions.routes.js'
import settingsRoutes from './modules/settings/settings.routes.js'
import usersRoutes from './modules/users/users.routes.js'
import wishlistRoutes from './modules/wishlist/wishlist.routes.js'

const app = express()

app.use(cors)
app.use(express.json())
app.use(cookieParser())

app.get('/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`
    res.status(200).json({ status: 'ok', db: 'up' })
  } catch {
    res.status(503).json({ status: 'degraded', db: 'down' })
  }
})

app.use('/api/v1/auth', authRoutes)
app.use('/api/v1/users', usersRoutes)
app.use('/api/v1/products', productsRoutes)
app.use('/api/v1/categories', categoriesRoutes)
app.use('/api/v1/cart', cartRoutes)
app.use('/api/v1/wishlist', wishlistRoutes)
app.use('/api/v1/orders', ordersRoutes)
app.use('/api/v1/payments', paymentsRoutes)
app.use('/api/v1/discounts', discountsRoutes)
app.use('/api/v1/promotions', promotionsRoutes)
app.use('/api/v1/settings', settingsRoutes)
app.use('/api/v1/admin', adminRoutes)

app.use(notFound)
app.use(errorHandler)

export default app
