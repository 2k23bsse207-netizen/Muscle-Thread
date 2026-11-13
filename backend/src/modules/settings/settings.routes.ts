import { Router } from 'express'
import { requireAuth, requireRole } from '../../middleware/auth.middleware.js'
import * as controller from './settings.controller.js'

// Public storefront configuration: checkout reads the tax rate it cannot set.
const router = Router()
router.get('/', controller.show)

export default router

export const adminSettingsRoutes = Router()
adminSettingsRoutes.use(requireAuth, requireRole('ADMIN'))
adminSettingsRoutes.patch('/', controller.update)
