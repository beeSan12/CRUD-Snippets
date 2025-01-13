/**
 * @file This module contains the user services.
 * @module userServices
 * @author Beatriz Sanssi <bs222eh@student.lnu.se>
 */
import User from '../models/user.js'
import Snippet from '../models/SnippetModel.js'
import Friendship from '../models/FriendshipSchema.js'

/**
 * Fetches friend IDs for a user by looking up the user's document and populating their friends.
 *
 * @param {string} userId - The user's ID whose friend IDs to fetch.
 * @returns {Promise<Array>} - A promise that resolves to an array of friend IDs.
 */
async function getFriends (userId) {
  const user = await User.findById(userId).populate('friends').exec()
  if (!user) {
    throw new Error('User not found')
  }
  return user.friends.map(friend => friend._id)
}

/**
 * Checks if two users are friends by looking for a friendship document between them with status 'accepted'.
 *
 * @param {string} userId1 - The user's ID.
 * @param {string} userId2 - The friend's ID.
 * @returns {Promise<boolean>} - A promise that resolves to true if the users are friends, false otherwise.
 */
async function areFriends (userId1, userId2) {
  const friendship = await Friendship.findOne({
    $or: [
      { requester: userId1, recipient: userId2, status: 'accepted' },
      { requester: userId2, recipient: userId1, status: 'accepted' }
    ]
  })
  return !!friendship
}

/**
 * Fetches visible friend IDs for a user by filtering their friends based on the accepted friendship status.
 *
 * @param {string} userId - The user's ID whose friend IDs to fetch.
 * @returns {Promise<Array>} - A promise that resolves to an array of friend IDs.
 */
async function getVisibleFriendIDsForUser (userId) {
  // Assuming you have a method to get friend IDs
  const allFriendIDs = await getFriends(userId)
  const visibleFriendIDs = []

  for (const friendId of allFriendIDs) {
    if (await areFriends(userId, friendId.toString())) {
      visibleFriendIDs.push(friendId)
    }
  }

  return visibleFriendIDs
}

/**
 * Fetches workouts from a user's friends.
 *
 * @param {string} userId - The user's ID whose friends' workouts to fetch.
 * @param {number} page - The page number to fetch.
 * @param {number} limit - The number of workouts to fetch per page.
 * @returns {Promise<Array>} - A promise that resolves to an array of friends' workouts.
 */
export async function getFriendsWorkouts (userId, page = 1, limit = 5) {
  try {
    const visibleFriendIDs = await getVisibleFriendIDsForUser(userId)
    const friendsWorkouts = await Snippet.find({ author: { $in: visibleFriendIDs } })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit)
      .exec()

    const count = await Snippet.countDocuments({ author: { $in: visibleFriendIDs } })

    return { workouts: friendsWorkouts, count }
  } catch (error) {
    console.error('Error fetching friends workouts:', error)
    return { workouts: [], count: 0 }
  }
}

/**
 * Gets friends requests for a user.
 *
 * @param {string} userId - The user's ID whose friend requests to fetch.
 * @returns {Promise<Array>} - A promise that resolves to an array of friend requests.
 */
export const getFriendRequests = async (userId) => {
  try {
    const user = await User.findById(userId).populate('friendRequests')
    return user.friendRequests
  } catch (error) {
    console.error('Error fetching friend requests:', error)
    throw error
  }
}

export { getFriends, areFriends, getVisibleFriendIDsForUser }
