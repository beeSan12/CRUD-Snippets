/**
 * @file Defines the encryption module.
 * @module encryption
 * @author Beatriz Sanssi <bs222eh@student.lnu.se>
 */
import crypto from 'crypto'

const algorithm = 'aes-256-cbc' // Example algorithm
const secretKey = 'yourSecretKey' // Replace with a key from your environment variables or configuration
const iv = crypto.randomBytes(16) // Initialization vector

/**
 * Encrypts a string using the AES-256-CBC algorithm.
 *
 * @param {string} text - The string to encrypt.
 * @returns {object} - The encrypted data and initialization vector.
 */
export const encrypt = (text) => {
  const cipher = crypto.createCipheriv(algorithm, Buffer.from(secretKey), iv)
  let encrypted = cipher.update(text)
  encrypted = Buffer.concat([encrypted, cipher.final()])
  return { iv: iv.toString('hex'), encryptedData: encrypted.toString('hex') }
}

/**
 * Decrypts a string using the AES-256-CBC algorithm.
 *
 * @param {object} data - The encrypted data and initialization vector.
 * @returns {string} - The decrypted string.
 */
export const decrypt = (data) => {
  const iv = Buffer.from(data.iv, 'hex')
  const encryptedText = Buffer.from(data.encryptedData, 'hex')
  const decipher = crypto.createDecipheriv(algorithm, Buffer.from(secretKey), iv)
  let decrypted = decipher.update(encryptedText)
  decrypted = Buffer.concat([decrypted, decipher.final()])
  return decrypted.toString()
}
