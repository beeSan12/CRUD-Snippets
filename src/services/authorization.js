/**
 * @file This module contains the configuration for ensuring the user is authenticated.
 * @module ensureAuthenticatedAndAuthorized
 * @author Beatriz Sanssi <bs222eh@student.lnu.se>
 */

import User from '../models/user.js'
import Snippet from '../models/SnippetModel.js'

/**
 * Checks if the user is authenticated and authorized to perform the action.
 *
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {void}
 */
async function ensureAuthenticatedAndAuthorized (req, res, next) {
  console.log('Checking if user is authenticated and authorized')

  if (req.session && req.session.userId) {
    try {
      const user = await User.findById(req.session.userId)
      if (!user) {
        console.error('No user found with ID:', req.session.userId)
        return res.redirect('./login')
      }

      // Assuming the snippet ID is passed as a URL parameter
      const snippet = await Snippet.findById(req.params.id)
      if (!snippet) {
        console.error('No snippet found with ID:', req.params.id)
        return res.status(404).send('Snippet not found')
      }

      // Check if the authenticated user is the author of the snippet
      if (snippet.author.toString() !== req.session.userId) {
        console.error('User is not authorized to modify this snippet')
        return res.status(403).send('You are not authorized to perform this action')
      }

      console.log('User is authenticated and authorized')
      next() // User is authenticated and authorized
    } catch (error) {
      console.error('Error validating user session or snippet ownership:', error)
      res.redirect('./login')
    }
  } else {
    console.log('No user ID in session, redirecting to login.')
  }
}

export default ensureAuthenticatedAndAuthorized
