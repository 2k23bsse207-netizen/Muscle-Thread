import { Router } from 'express'
import { requireAuth, requireRole } from '../../middleware/auth.middleware.js'
import * as controller from './auth.controller.js'

const router = Router()

// Public
router.post('/signup', controller.signup)
router.post('/verify-email', controller.verifyEmail)
router.post('/resend-verification', controller.resendVerification)
router.post('/login', controller.login)
router.post('/refresh', controller.refresh)
router.post('/logout', controller.logout)

// Signed in
router.get('/me', requireAuth, controller.me)

// ADMIN only
router.get('/admin/sessions', requireAuth, requireRole('ADMIN'), controller.adminSessions)

export default router
