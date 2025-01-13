/**
 * @file Defines the SnippetController class.
 * @module SnippetController
 * @author Mats Loock & Beatriz Sanssi <bs222eh@student.lnu.se>
 */

import { logger } from '../config/winston.js'
import SnippetModel from '../models/SnippetModel.js'
import Friendship from '../models/FriendshipSchema.js'

/**
 * Encapsulates a controller.
 */
export class SnippetController {
  /**
   * Provide req.doc to the route if :id is present.
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @param {Function} next - Express next middleware function.
   * @param {string} id - The value of the id for the snippet to load.
   */
  async loadSnippetDocument (req, res, next, id) {
    try {
      logger.silly('Loading task document', { id })
      console.log(`Attempting to load document with ID: ${id}`)

      // Get the snippet document.
      const snippetDoc = await SnippetModel.findById(id).populate('author')
      console.log('The author of the snippet is:', snippetDoc.author)
      console.log('Fetched snippetDoc:', snippetDoc)
      // If the snippet document is not found, throw an error.
      if (!snippetDoc) {
        const error = new Error('The snippet you requested does not exist.')
        error.status = 404
        throw error
      }

      // Provide the snippet document to req.
      req.doc = snippetDoc

      logger.silly('Loaded snippet document', { id })

      // Next middleware.
      next()
    } catch (error) {
      next(error)
    }
  }

  /**
   * Gets the friend IDs for a user.
   *
   * @param {string} userId - The ID of the user.
   * @returns {Promise<string[]>} - A promise that resolves to an array of friend IDs.
   */
  async getFriendIDsForUser (userId) {
    console.log('Fetching friend IDs for user:', userId)
    const friendships = await Friendship.find({
      $or: [
        { requester: userId, status: 'accepted' },
        { recipient: userId, status: 'accepted' }
      ]
    }).exec()

    // Map over the friendships to extract friend IDs
    const friendIDs = friendships.map(friendship =>
      friendship.requester.toString() === userId ? friendship.recipient : friendship.requester
    )
    console.log('Friend IDs:', friendIDs)
    return friendIDs
  }

  /**
   * Displays a list of all snippetss.
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @param {Function} next - Express next middleware function.
   * @returns {Promise<void>} - A promise that resolves when the snippets are displayed.
   */
  async index (req, res, next) {
    console.log('Fetching public snippets')
    try {
      const userId = req.session.userId
      // const currentUserId = userId
      const page = parseInt(req.query.page, 10) || 1
      const limit = 20

      // Define a query to only fetch public snippets
      const query = {
        $or: [
          { private: false }, // Public snippets
          { private: true, justForMe: false } // Private snippets that can be viewed publicly
        ]
      }

      if (userId) {
        const friendIDs = await this.getFriendIDsForUser(userId)
        query.$or.push({ author: { $in: friendIDs }, private: true, justForMe: false }) // Private snippets shared with the user by friends
        query.$or.push({ author: userId, justForMe: true }) // User's own "just for me" snippets
      }
      // Query the database for public snippets based on the constructed query.
      const snippets = await SnippetModel.find(query)
        .populate('author')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)

      // Transform snippets for the view
      const viewData = {
        snippets: snippets.map(snippet => {
          const snippetObj = snippet.toObject()
          const showAuthorName = !snippet.private || snippet.author._id.toString() === userId

          // Since all fetched snippets are public, author's name can be shown
          // snippetObj.showAuthorName = true
          snippetObj.showAuthorName = showAuthorName
          snippetObj.authorUsername = showAuthorName ? snippet.author.username : 'Anonymous'

          // snippetObj.authorUsername = snippet.author.username

          // Add formatted date and time to each snippet
          snippetObj.formattedDate = new Date(snippet.createdAt).toLocaleDateString()
          snippetObj.formattedTime = new Date(snippet.createdAt).toLocaleTimeString()

          return snippetObj
        })
      }

      // Calculate total pages for pagination
      const totalSnippets = await SnippetModel.countDocuments(query)
      const totalPages = Math.ceil(totalSnippets / limit)

      // Render the snippets page with the collected data
      res.render('snippets/index', {
        viewData,
        page,
        totalPages,
        userId // Explicitly indicate no user is logged in
      })
    } catch (error) {
      console.error('Error fetching public snippets:', error)
      next(error)
    }
  }

  /**
   * Displays a list of all snippets.
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @param {Function} next - Express next middleware function.
   * @returns {Promise<void>} - A promise that resolves when the snippets are displayed.
   */
  async getPublicAndAnonymizedPrivateSnippets (req, res, next) {
    try {
      const currentUserId = req.session.userId
      console.log(currentUserId)
      // const isAuthenticated = req.session.userId
      const page = parseInt(req.query.page) || 1
      const limit = 20
      const skip = (page - 1) * limit

      const query = { $or: [{ private: false, justForMe: false }] } // Default to public snippets
      if (currentUserId) {
        query.$or.push({ private: true }) // If authenticated, also fetch private snippets
      }

      const snippets = await SnippetModel.find(query)
        .populate('author')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .map(snippet => snippet.toObject())
        .lean()
        .exec()

      const totalSnippets = await SnippetModel.countDocuments({ private: true, justForMe: false })
      const totalPages = Math.ceil(totalSnippets / limit)

      if (!currentUserId) {
        snippets.forEach(snippet => {
          if (snippet.private) {
            snippet.author = { username: 'Anonymous' } // Ensure this modification doesn't persist to the database
          }
        })
      }
      res.render('snippets/index', {
        snippets,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
        nextPage: page + 1,
        previousPage: page - 1,
        totalSnippets,
        totalPages,
        currentPage: page,
        currentUserId: req.session.userId
      })
      console.log('Public snippets:', snippets)
      // Anonymize author for private snippets
      snippets.forEach(snippet => {
        if (snippet.private) {
          // Ensure to anonymize author details for private snippets
          snippet.author = { username: 'Anonymous' }
        }
      })

      console.log('Snippets fetched:', snippets)
      return snippets
    } catch (error) {
      console.error('Error fetching snippets:', error)
      next(error)
    }
  }

  /**
   * Displays private snippets.
   *
   * @param {string} currentUserId - The current user's ID.
   * @param {Function} next - Express next middleware function.
   * @returns {Promise<void>} - A promise that resolves when the private snippets are displayed.
   */
  async getSnippetsForUser (currentUserId, next) {
    console.log('Fetching snippets for user:', currentUserId)
    try {
      // Assuming there's a function to get the current user's friends' IDs
      const friendIDs = await this.getFriendIDsForUser(currentUserId)

      const snippets = await SnippetModel.find({
        $or: [
          { private: false, justForMe: false }, // Public snippets
          { author: currentUserId, justForMe: true }, // User's own "just for me" snippets
          { author: currentUserId, private: true }, // User's own private snippets
          { author: { $in: friendIDs }, private: true, justForMe: false } // Private snippets shared with the user by friends
        ]
      }).lean()

      console.log('Snippets fetched for user:', snippets)
      return snippets
    } catch (error) {
      console.error('Error fetching snippets for user:', currentUserId, error)
      next(error)
    }
  }

  /**
   * Returns a HTML form for creating a new snippet.
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @returns {Promise<void>} - A promise that resolves when the form is rendered.
   */
  async create (req, res) {
    console.log('Creating a new snippet')
    if (!req.session.userId) {
      req.session.flash = {
        type: 'danger',
        message: 'Please log in to create a snippet!'
      }
      return res.redirect('./login')
    }
    res.render('snippets/create')
    console.log('Snippet created:', req.doc)
  }

  /**
   * Creates a new sippet.
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @returns {Promise<void>} - A promise that resolves when the snippet is created.
   */
  async createPost (req, res) {
    console.log('Creating a new snippet for', req.session.userId)
    if (!req.session.userId) {
      // Redirect to login page if the user is not logged in
      req.session.redirectTo = req.originalUrl
      return res.redirect('./login')
    }

    try {
      logger.silly('Creating new task document', { body: req.body })

      const { description, private: isPrivate, justForMe } = req.body

      const newSnippet = new SnippetModel({
        description,
        author: req.session.userId, // Make sure the author field is set to the user's ID
        isPrivate: isPrivate === 'on', // Convert to boolean: true if "on", false otherwise
        justForMe: justForMe === 'on'
      })

      await newSnippet.save()
      res.redirect('.')
      logger.silly('Created new task document')
      console.log('Snippet created:', newSnippet)

      req.session.flash = { type: 'success', text: 'The snippet was created successfully.' }
    } catch (error) {
      this.#handleErrorAndRedirect(error, req, res, './create')
    }
  }

  /**
   * Returns a HTML form for updating a snippet.
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   */
  async update (req, res) {
    try {
      const viewData = req.doc.toObject()
      res.render('snippets/update', { viewData })
    } catch (error) {
      this.#handleErrorAndRedirect(error, req, res, '..')
    }
  }

  /**
   * Updates a specific snippet.
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   */
  async updatePost (req, res) {
    try {
      logger.silly('Updating task document', { id: req.doc.id, body: req.body })

      // Update the description or other fields except for the author
      const { description } = req.body
      const isPrivate = req.body.private
      const justForMe = req.body.justForMe

      req.doc.description = description
      req.doc.private = !!isPrivate // Converts to boolean: true if "on", false otherwise
      req.doc.justForMe = !!justForMe

      await req.doc.save()
      logger.silly('Updated snippet document', { id: req.doc.id })
      req.session.flash = { type: 'success', text: 'The snippet was updated successfully.' }

      res.redirect('..')
    } catch (error) {
      logger.silly('Unnecessary to update snippet document', { id: req.doc.id })
      req.session.flash = { type: 'info', text: 'The snippet was not updated because there was nothing to update.' }

      this.#handleErrorAndRedirect(error, req, res, './update')
    }
  }

  /**
   * Returns a HTML form for deleting a snippet.
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @returns {Promise<void>} - A promise that resolves when the form is rendered.
   */
  async delete (req, res) {
    try {
      if (!req.doc) {
        return res.status(404).send('Snippet not found.')
      }

      res.render('snippets/delete', { viewData: req.doc.toObject() })
      console.log('Snippet to delete:', req.doc, req.doc.toObject())
    } catch (error) {
      this.#handleErrorAndRedirect(error, req, res, '..')
    }
  }

  /**
   * Deletes the specified snippet.
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @returns {Promise<void>} - A promise that resolves when the snippet is deleted.
   */
  async deletePost (req, res) {
    try {
      logger.silly('Deleting snippet document', { id: req.doc.id })

      const snippetId = req.params.id
      const snippet = await SnippetModel.findById(snippetId)

      if (!snippet) {
        res.status(404).send('Snippet not found')
        return
      }

      if (snippet.author.toString() !== req.session.userId) {
        res.status(403).send('Unauthorized to delete this snippet')
        return
      }

      await snippet.deleteOne({ id: req.doc.id })

      logger.silly('Deleted snippet document', { id: req.doc.id })

      req.session.flash = { type: 'success', text: 'The snippet was deleted successfully.' }
      res.redirect('..')
      console.log('Deleted snippet:', req.doc)
    } catch (error) {
      this.#handleErrorAndRedirect(error, req, res, './delete')
    }
  }

  /**
   * Handles an error and redirects to the specified path.
   *
   * @param {Error} error - The error to handle.
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @param {string} path - The path to redirect to.
   */
  #handleErrorAndRedirect (error, req, res, path) {
    logger.error(error.message, { error })
    req.session.flash = { type: 'danger', text: error.message }
    res.redirect('..')
  }
}
