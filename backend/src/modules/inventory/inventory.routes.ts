import { Router } from 'express'
import { requireAuth, requireRole } from '../../middleware/auth.middleware.js'
import * as controller from './inventory.controller.js'

const router = Router()
router.use(requireAuth, requireRole('ADMIN'))
router.get('/', controller.list)
router.get('/low-stock', controller.lowStock)
router.get('/stats', controller.stats)
router.get('/:id', controller.detail)
router.patch('/:id', controller.update)
router.post('/:id/adjustments', controller.adjust)
router.get('/:id/history', controller.history)
export default router
