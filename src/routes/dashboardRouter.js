/**
 * @file Defines the dashboard router.
 * @module dashboardRouter
 * @author Beatriz Sanssi <bs222eh@student.lnu.se>
 */

import express from 'express'
import User from '../models/user.js'
import { DashboardController } from '../controllers/dashboardController.js'
import ensureAuthenticated from '../services/authentication.js'
import { query } from 'express-validator'
import { getFriendRequests, getFriendsWorkouts } from '../services/userServices.js'
import Snippet from '../models/SnippetModel.js'

const router = express.Router()
const dashboardController = new DashboardController()

// Route to display the dashboard, using the dashboard controller
router.get('/', ensureAuthenticated, (req, res) => dashboardController.renderDashboard(req, res))

// Fetch additional workouts with pagination
router.get('/myWorkouts', ensureAuthenticated, async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1
  const limit = 5 // Number of workouts per page
  const skipAmount = (page - 1) * limit

  try {
    const totalWorkouts = await Snippet.countDocuments({ author: req.session.userId })
    const ownSnippets = await Snippet.find({ author: req.session.userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skipAmount)
      .exec()

    // Calculate if there are more workouts beyond the current page
    const hasMore = page * limit < totalWorkouts

    // Send the workouts and the hasMore flag back to the client as JSON
    res.json({ workouts: ownSnippets, hasMore })
  } catch (error) {
    console.error('Error fetching workouts:', error)
    res.status(500).send('Error fetching workouts')
  }
})

// Fetch friends workouts with pagination
router.get('/friendsWorkouts', ensureAuthenticated, async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1
    const limit = 5 // Number of workouts per page

    const { workouts, hasMore } = await getFriendsWorkouts(req.session.userId, page, limit)
    console.log(workouts)
    // Send the workouts and the hasMore flag back to the client as JSON
    res.json({ workouts, hasMore })
  } catch (error) {
    console.error('Error fetching friends workouts:', error)
    res.status(500).send('Error fetching workouts')
  }
})

// Route to search for friends
router.get('/searchFriends', [
  query('username').trim().escape()
], async (req, res) => {
  const { username } = req.query
  try {
    const users = await User.find({ username: { $regex: username, $options: 'i' } })
    res.render('dashboard/searchResults', { users })
  } catch (error) {
    console.error('Search Error:', error)
    res.status(500).send('An error occurred during the search')
  }
})

// Route to add a friend
router.post('/addFriend/:userId', async (req, res) => {
  const { userId } = req.params
  const friendId = req.body.friendId // Assuming the friend's ID is sent in the request body

  try {
    // Add friendId to the user's friends list
    await User.findByIdAndUpdate(userId, { $addToSet: { friends: friendId } })
    await User.findByIdAndUpdate(friendId, { $addToSet: { friends: userId } }) // Optionally, add userId to the friend's friends list for bidirectional friendship

    res.redirect('./dashboard') // Redirect to the dashboard or a page of your choice
  } catch (error) {
    console.error('Add Friend Error:', error)
    res.status(500).send('An error occurred while adding a friend')
  }
})

// Handle friend requests
router.post('/sendFriendRequest/:recipientId', ensureAuthenticated, async (req, res) => {
  const { recipientId } = req.params
  const userId = req.session.userId // Assuming the session stores the logged-in user's ID

  try {
    const user = await User.findById(userId)
    const recipient = await User.findById(recipientId)

    // Check if they're already friends or a friend request is pending
    if (user.friends.includes(recipientId) || recipient.friendRequests.includes(userId)) {
      return res.status(400).json({ message: 'Already friends or request pending.' })
    }
  } catch (error) {
    console.error('Send Friend Request Error:', error)
    res.status(500).send('Failed to send friend request.')
  }
})

// Route to fetch friend requests
router.get('/friendRequests', ensureAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId // Or however you access the current user's ID
    const friendRequests = await getFriendRequests(userId)
    res.json(friendRequests)
  } catch (error) {
    console.error('Fetching Friend Requests Error:', error)
    res.status(500).send('Failed to fetch friend requests.')
  }
})

// Handle adding a friend
router.post('/dashboard/acceptFriendRequest/:requesterId', ensureAuthenticated, async (req, res) => {
  const { requesterId } = req.params
  const userId = req.session.userId

  try {
    // Remove from friendRequests and add to friends for both users
    await User.findByIdAndUpdate(userId, { $pull: { friendRequests: requesterId }, $addToSet: { friends: requesterId } })
    await User.findByIdAndUpdate(requesterId, { $addToSet: { friends: userId } })

    res.send('Friend request accepted.')
  } catch (error) {
    console.error('Accept Friend Request Error:', error)
    res.status(500).send('Failed to accept friend request.')
  }
})

// Handle rejecting a friend request
router.post('/rejectFriendRequest/:requesterId', ensureAuthenticated, async (req, res) => {
  const { requesterId } = req.params
  const userId = req.session.userId

  try {
    // Remove from friendRequests for the user
    await User.findByIdAndUpdate(userId, { $pull: { friendRequests: requesterId } })

    res.send('Friend request rejected.')
  } catch (error) {
    console.error('Reject Friend Request Error:', error)
    res.status(500).send('Failed to reject friend request.')
  }
})

export default router
