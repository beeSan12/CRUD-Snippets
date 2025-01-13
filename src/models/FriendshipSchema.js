/**
 * @file This file defines the friendship class.
 * @module Friendship
 * @author Beatriz Sanssi <bs222eh@student.lnu.se>
 */
import mongoose from 'mongoose'

const friendshipSchema = new mongoose.Schema({
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  }
}, { timestamps: true })

export default mongoose.model('Friendship', friendshipSchema)
