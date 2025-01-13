/**
 * @file Defines the home router.
 * @module userRouter
 * @author Beatriz Sanssi <bs222eh@student.lnu.se>
 */

import express from 'express'
import UserController from '../controllers/UserController.js'
import ensureAuthenticated from '../services/authentication.js'
import { body, validationResult } from 'express-validator'
import { getFriendsWorkouts } from '../services/userServices.js'
import Snippet from '../models/SnippetModel.js'

const router = express.Router()

// Display the registration form
router.get('/register', (req, res) => {
  res.render('users/register')
})

// Handle the registration form submission and automatic login
router.post('/register', [
  body('username').isLength({ min: 5 }).withMessage('Username must be at least 5 characters long'),
  body('email').isEmail().withMessage('Must be a valid email address'),
  body('password').isLength({ min: 10 }).withMessage('Password must be at least 10 characters long')
], async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    // If there are validation errors, render the form again with validation messages
    return res.status(400).render('users/register', {
      errors: errors.array(),
      inputData: req.body
    })
  }

  // If validation passes, proceed to UserController logic
  await UserController.register(req, res)
})

// Verify OTP
router.post('/verify-otp', ensureAuthenticated, async (req, res) => {
  await UserController.verify2FATokenForLogin(res, req)
})

// Display the login form
router.get('/login', (req, res) => {
  res.render('users/login')
})

// Handle the login form submission
router.post('/login', (req, res, next) => UserController.loginPost(req, res, next))

// Display the logout form
router.get('/logout', ensureAuthenticated, (req, res) => {
  res.render('users/logout')
})

// Handle the logout form submission
router.post('/logout', (req, res, next) => UserController.logout(req, res, next))

// Display the dashboard
router.get('/dashboard', ensureAuthenticated, async (req, res) => {
  try {
    const ownSnippets = await Snippet.find({ author: req.session.userId })
      .sort({ createdAt: -1 })
      .limit(5)
    const { workouts: friendsWorkouts } = await getFriendsWorkouts(req.session.userId)

    res.render('users/dashboard', {
      workouts: ownSnippets,
      friendsWorkouts
    })
  } catch (error) {
    console.error('Failed to fetch snippets:', error)
    res.render('users/dashboard', {
      workouts: [],
      friendsWorkouts: []
    })
  }
})

export default router
