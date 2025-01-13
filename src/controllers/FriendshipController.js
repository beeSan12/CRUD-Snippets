/**
 * @file Defines the FriendshipController class.
 * @module FriendshipController
 * @author Beatriz Sanssi <bs222eh@student.lnu.se>
 */

import Friendship from '../models/FriendshipSchema.js'

/**
 * Encapsulates a controller.
 */
export class FriendshipController {
  /**
   * Creates a new friend request.
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   */
  async createFriendRequest (req, res) {
    try {
      const { requesterId, recipientId } = req.body
      const newFriendship = await Friendship.create({
        requester: requesterId,
        recipient: recipientId,
        status: 'pending'
      })
      res.status(201).json(newFriendship)
    } catch (error) {
      res.status(500).json({ message: 'Error creating friend request', error })
    }
  }
}
