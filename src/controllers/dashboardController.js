/**
 * @file This file defines the dashboard controller class.
 * @module DashboardController
 * @author Beatriz Sanssi <bs222eh@student.lnu.se>
 */
import Snippet from '../models/SnippetModel.js'
import { getFriendsWorkouts } from '../services/userServices.js'
/**
 * Encapsulates a controller.
 */
export class DashboardController {
  /**
   * Renders the dashboard page with user and friends' workouts.
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @returns {void}
   */
  async renderDashboard (req, res) {
    try {
      const page = parseInt(req.query.page) || 1
      const limit = 5
      const userId = req.session.userId
      console.log(`Fetching snippets for user ID: ${userId}`)

      if (!userId) {
        // If no userId in session, redirect or handle error
        req.flash('error', 'Please log in to view your dashboard.')
        return res.redirect('./login')
      }

      const userSnippets = await Snippet.find({ author: userId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip((page - 1) * limit)
        .exec()

      // Log the fetched snippets to see if they match expectations
      console.log(`Fetched ${userSnippets.length} snippets for user ID: ${userId}`)
      const friendsWorkouts = await getFriendsWorkouts(req.session.userId, page, limit)

      // Render the dashboard with user's snippets and optionally friends' workouts
      res.render('users/dashboard', {
        workouts: userSnippets,
        friendsWorkouts: friendsWorkouts.workouts,
        nextPage: page + 1
      })
    } catch (error) {
      console.error('Dashboard Error:', error)
      // Use flash messages to inform the user in case of an error
      req.flash('error', 'Error loading the dashboard')
      res.redirect('./login') // Redirect to a safe page
    }
  }
}
