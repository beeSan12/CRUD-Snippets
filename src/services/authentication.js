/**
 * @file This module contains the configuration for ensuring the user is authenticated.
 * @module ensureAuthenticated
 * @author Beatriz Sanssi <bs222eh@student.lnu.se>
 */

import User from '../models/user.js'

/**
 * Checks if the user is authenticated.
 *
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {void}
 */
async function ensureAuthenticated (req, res, next) {
  console.log('Checking if user is authenticated')
  // Log the session ID to see if it matches the user's session
  console.log('Session ID:', req.session.userId)

  if (req.session && req.session.userId) {
    try {
      const user = await User.findById(req.session.userId)
      if (!user) {
        console.error('No user found with ID:', req.session.userId)
        // If no user is found in the database, destroy the session and redirect to login
        req.session.destroy(() => {
          res.redirect('./login')
        })
        return
      }
      // Proceed with the request if the user exists
      console.log('User is authenticated:', user.username)
      console.log('User is authenticated:', user._id)
      next()
    } catch (error) {
      console.error('Error validating user session:', error)
      res.redirect('./login')
    }
  } else {
    // Redirect to login if not authenticated
    console.log('No user ID in session, redirecting to login.')
    res.redirect('./login')
  }
}

export default ensureAuthenticated
