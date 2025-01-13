/**
 * @file This file defines the SnippetModel class.
 * @module SnippetModel
 * @author Mats Loock & Beatriz Sanssi <bs222eh@student.lnu.se>
 */

import mongoose from 'mongoose'
import { BASE_SCHEMA } from './baseSchema.js'

// create a schema
const schema = new mongoose.Schema({
  description: {
    type: String,
    required: true,
    trim: true,
    minlength: 1,
    maxlength: 1000
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  private: {
    type: Boolean,
    required: false,
    default: false
  },
  justForMe: {
    type: Boolean,
    required: false,
    default: false
  }
}, {
  timestamps: true,
  toObject: {
    virtuals: true, // ensure virtual fields are serialized
    // eslint-disable-next-line jsdoc/require-jsdoc
    transform: function (doc, ret) {
      delete ret._id
      delete ret.__v
    }
  }
})
schema.virtual('id').get(function () {
  return this._id.toHexString()
})

schema.add(BASE_SCHEMA)
export default mongoose.model('Snippet', schema)
