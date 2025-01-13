/**
 * @file This file defines the user controller class.
 * @module UserController
 * @author Beatriz Sanssi <bs222eh@student.lnu.se>
 */
import User from '../models/user.js'
import speakeasy from 'speakeasy'
import QRCode from 'qrcode'

/**
 * Encapsulates a controller.
 */
export class UserController {
  /**
   * Registers a new user.
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @returns {Promise<void>} - A promise that resolves when the user is registered.
   */
  async register (req, res) {
    try {
      const { username, email, password, about } = req.body
      console.log(`Attempting to register user: ${username}`)

      // Validate user input
      if (password.length < 10) { // Encourage longer passphrases
        req.session.flash = { type: 'warn', text: 'Password must be at least 10 characters' }

        return res.redirect('./register')
      }

      // Check if user already exists
      const existingUser = await User.findOne({ $or: [{ username }, { email }] })
      if (existingUser) {
        req.session.flash = { type: 'danger', text: 'User already exists' }
        return res.redirect('./register')
      }
      // Create a new user and save to DB
      const user = new User({
        username,
        email,
        password,
        about
      })

      await user.save()
      req.session.flash = { type: 'success', text: 'You have successfully registered!' }

      // Initiate a session for the new user here
      req.session.userId = user._id
      req.session.username = user.username

      // After successful registration
      res.redirect('./login')
    } catch (error) {
      req.session.flash = { type: 'danger', text: 'An error occurred during registration.' }
      res.redirect('./register')
    }
  }

  /**
   * Logs in a user.
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @param {Function} next - Express next function.
   * @returns {Promise<void>} - A promise that resolves when the user is logged in.
   */
  async loginPost (req, res, next) {
    console.log('Attempting login for:', req.body.username)

    try {
      const user = await User.authenticate(req.body.username, req.body.password)

      if (!user) {
        console.error('User not found', req.body.username)
        req.session.flash = { type: 'danger', text: 'Invalid username or password.' }
        return res.redirect('./login')
      }
      // Check if the account is locked
      if (user.isLocked) {
        console.error('Account is locked', user.username)
        req.session.flash = { type: 'danger', text: 'Your account has been locked. Please contact support.' }

        return res.redirect('./login')
      }

      // Successful login
      console.log('Login successful for user:', user.username)
      req.session.userId = user._id
      req.session.username = user.username
      res.locals.user = user.toObject()
      req.session.flash = { type: 'success', text: 'You have successfully logged in!' }
      // Redirect the user after setting up the session.
      res.redirect('./dashboard')
    } catch (error) {
      console.log('Login error:', error)
      res.status(500).json({ error: 'An error occurred during login' })
    }
  }

  /**
   * Enables two-factor authentication for a user.
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @returns {Promise<void>} - A promise that resolves when 2FA is enabled.
   */
  async enable2FA (req, res) {
    try {
      const user = await User.findById(req.session.userId)
      if (!user) {
        return res.status(404).json({ message: 'User not found' })
      }

      const secret = speakeasy.generateSecret({ length: 20 })

      // Store the secret temporarily in the session
      req.session.tempSecret = secret.base32

      const imageData = await QRCode.toDataURL(secret.otpauth_url)
      res.json({ imageData })
    } catch (error) {
      res.status(500).json({ error: 'Error enabling 2FA' })
    }
  }

  /**
   * Verifies a two-factor authentication token for login.
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @returns {Promise<void>} - A promise that resolves when the token is verified.
   */
  async verify2FATokenForLogin (req, res) {
    const user = await User.findById(req.session.userId)
    if (!user) {
      return res.status(404).send('User not found')
    }

    const twoFASecret = user.getTwoFASecret()
    const tokenValid = speakeasy.totp.verify({
      secret: twoFASecret,
      encoding: 'base32',
      token: req.body.token
    })

    if (!tokenValid) {
      return res.status(401).json({ message: 'Invalid 2FA token' })
    }

    // Token verified, continue login or session setup
    res.json({ success: true, message: '2FA verified successfully' })
  }

  /**
   * Logs out a user.
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @returns {Promise<void>} - A promise that resolves when the user is logged out.
   */
  async logout (req, res) {
    if (!req.session.userId) {
      // If there's no user session, treat this as a 404
      return res.status(404).send('Page not found.')
    }
    req.session.regenerate((err) => {
      // Handle errors if any
      if (err) {
        console.error(err)
        return res.status(500).send('Error logging out.')
      }
      req.session.destroy(function (err) {
        if (err) {
          console.error(err)
          return res.status(500).send('Error logging out.')
        }

        res.clearCookie('connect.sid')

        // Redirect to login page or send a success response
        res.redirect('./login')
      })
    })
  }
}
export default new UserController()
