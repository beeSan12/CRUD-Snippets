/**
 * @file Defines the snippet router.
 * @module snippetRouter
 * @author Mats Loock & Beatriz Sanssi <bs222eh@student.lnu.se>
 */

import express from 'express'
import { body, validationResult } from 'express-validator'
import { SnippetController } from '../controllers/SnippetController.js'
import ensureAuthenticated from '../services/authentication.js'
import ensureAuthenticatedAndAuthorized from '../services/authorization.js'

export const router = express.Router()

const controller = new SnippetController()

// Provide req.doc to the route if :id is present in the route path.
router.param('id', async (req, res, next, id) => controller.loadSnippetDocument(req, res, next, id))

// Map HTTP verbs and route paths to controller action methods.
router.get('/', async (req, res, next) => controller.index(req, res, next))

router.get('/index', async (req, res, next) => controller.getPublicAndAnonymizedPrivateSnippets(req, res, next))

router.get('/create', ensureAuthenticated, (req, res, next) => controller.create(req, res, next))

// Sanitize and validate snippet content during creation
router.post('/create',
  ensureAuthenticated,
  body('description').trim().escape(), // Sanitize the 'snippetContent'
  (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      // If there are errors, render the form again, passing the sanitized values and error messages
      return res.status(400).render('snippets/create', { errors: errors.array() })
    }

    // Proceed with controller logic if no errors
    controller.createPost(req, res)
  })

// Protect update and delete routes with authentication and ownership check
router.get('/:id/update', ensureAuthenticatedAndAuthorized, (req, res, next) => controller.update(req, res, next))
router.post('/:id/update', ensureAuthenticatedAndAuthorized, (req, res, next) => controller.updatePost(req, res, next))

router.get('/:id/delete', ensureAuthenticatedAndAuthorized, (req, res, next) => controller.delete(req, res, next))
router.post('/:id/delete', ensureAuthenticatedAndAuthorized, (req, res, next) => controller.deletePost(req, res, next))
