/**
 * @file This file defines the user class.
 * @module User
 * @author Beatriz Sanssi <bs222eh@student.lnu.se>
 */
import mongoose from 'mongoose'
import bcrypt from 'bcrypt'
import { encrypt, decrypt } from '../utils/encryption.js'

const MAX_LOGIN_ATTEMPTS = 5
const LOCK_TIME = 1 * 60 * 60 * 1000 // 1 hour
const emailRegex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@(([^<>()[\]\\.,;:\s@"]+\.)+[^<>()[\]\\.,;:\s@"]{2,})$/i

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    unique: true,
    required: true,
    trim: true,
    minlength: [5, 'Username must be at least 5 characters.'],
    maxlength: [20, 'Username must be less than 20 characters.']
  },
  email: {
    type: String,
    unique: true,
    required: true,
    trim: true,
    validate: {
      /**
       * Validates the email field against a regular expression.
       *
       * @param {string} email - The email address to validate.
       * @returns {boolean} True if the email address is valid according to the regex, false otherwise.
       */
      validator: function (email) {
        return emailRegex.test(email)
      },
      /**
       * Provides a custom error message if the validation fails.
       *
       * @param {object} props - Properties object containing the invalid email value.
       * @returns {string} A custom error message stating the invalid email address.
       */
      message: props => `${props.value} is not a valid email address.`
    }
  },
  password: {
    type: String,
    required: true
  },
  about: {
    type: String,
    twoFASecret: String,
    twoFAIv: String
  },
  loginAttempts: {
    type: Number,
    required: true,
    default: 0
  },
  lockUntil: {
    type: Number
  },
  friendRequests: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  friends: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
})

/**
 * Hashes the user's password before saving to the database,
 * and encrypts the two-factor authentication secret if it has been modified.
 *
 * @param {Function} next - The next middleware to be executed.
 */
userSchema.pre('save', async function (next) {
  if (this.isModified('password') || this.isNew) {
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
  }
  if (this.isModified('twoFASecret')) {
    const encrypted = encrypt(this.twoFASecret)
    this.twoFASecret = encrypted.encryptedData
    this.twoFAIv = encrypted.iv
  }
  next()
})

/**
 * Increments the login attempts for a user and locks the account if the threshold is reached.
 *
 * @returns {void}
 */
userSchema.methods.incrementLoginAttempts = function () {
  // If the account is already locked, check if the lock has expired
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({ $inc: { loginAttempts: 1 } }).exec()
  }
  // Otherwise, increment login attempts
  const updates = { $inc: { loginAttempts: 1 } }
  // Lock the account if we've reached max attempts and it's not locked already
  if (this.loginAttempts + 1 >= MAX_LOGIN_ATTEMPTS && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + LOCK_TIME }
  }
  return this.updateOne(updates).exec()
}

/**
 * Virtual field for checking if the user is locked.
 *
 * @returns {boolean} - True if the user is locked, false otherwise.
 */
userSchema.virtual('isLocked').get(function () {
  // Check if the lockUntil field is set and in the future
  return !!(this.lockUntil && this.lockUntil > Date.now())
})

/**
 * Authenticates a user by their username and password.
 *
 * @param {string} username - The user's username.
 * @param {string} password - The user's password.
 * @returns {Promise<void>} - A promise that resolves with the user if authentication is successful.
 */
userSchema.statics.authenticate = async function (username, password) {
  console.log(`Authenticating user: ${username}`)
  const user = await this.findOne({ username })
  console.log('User found:', user)
  if (!user) {
    throw new Error('Authentication failed.')
  }
  if (user.lockUntil && user.lockUntil > Date.now()) {
    throw new Error('Your account is locked due to multiple unsuccessful login attempts. Please contact support.')
  }
  const match = await bcrypt.compare(password, user.password)
  if (match) {
    const updates = { $set: { loginAttempts: 0 }, $unset: { lockUntil: null } }
    await this.updateOne(updates).exec()
    console.log(`User ${username} authenticated successfully.`)
    return user
  } else {
    await user.incrementLoginAttempts()
    throw new Error('Authentication failed. Please check your credentials.')
  }
}

/**
 * Decrypts the two-factor authentication secret before saving to the database.
 *
 * @returns {void}
 */
userSchema.methods.getTwoFASecret = function () {
  return decrypt({ encryptedData: this.twoFASecret, iv: this.twoFAIv })
}

export default mongoose.model('User', userSchema)
