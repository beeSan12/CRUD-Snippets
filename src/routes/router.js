/**
 * @file Defines the main router.
 * @module router
 * @author Mats Loock & Beatriz Sanssi <bs222eh@student.lnu.se>
 */

import express from 'express'
import http from 'http'
import { router as homeRouter } from './homeRouter.js'
import { router as snippetRouter } from './snippetRouter.js'
import userRouter from './userRouter.js'
import dashboardRouter from './dashboardRouter.js'
import friendshipRouter from './friendshipRouter.js'

export const router = express.Router()

router.use('/', homeRouter)
router.use('/snippets', snippetRouter)
router.use('/users', userRouter)
router.use('/dashboard', dashboardRouter)
router.use('/friendship', friendshipRouter)

// Catch 404 (ALWAYS keep this as the last route).
router.use('*', (req, res, next) => {
  const statusCode = 404
  const error = new Error(http.STATUS_CODES[statusCode])
  error.status = statusCode
  next(error)
})
