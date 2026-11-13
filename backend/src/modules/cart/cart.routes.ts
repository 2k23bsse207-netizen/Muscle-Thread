import { Router } from 'express'
import * as controller from './cart.controller.js'

const router = Router()
// Stateless pricing preview; no session or user data is read or written.
router.post('/quote', controller.quote)

export default router
