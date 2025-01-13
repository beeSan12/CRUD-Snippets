/**
 * @file Defines the friendship router.
 * @module friendshipRouter
 * @author Beatriz Sanssi <bs222eh@student.lnu.se>
 */

import express from 'express'
import { FriendshipController } from '../controllers/friendshipController.js'

const router = express.Router()
const friendshipController = new FriendshipController()

router.post('/friend-requests', (req, res) => friendshipController.createFriendRequest(req, res))

export default router
