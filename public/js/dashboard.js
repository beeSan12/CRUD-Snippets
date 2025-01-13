// ----------------------------------------------------------------------------
// This file contains the JavaScript code for the dashboard page.

// import { parse } from 'dotenv'

//
document.addEventListener('DOMContentLoaded', () => {
  console.log('dashboard.js is loaded')
  const containerDash = document.querySelector('.containerDash')
  if (containerDash) {
    setupWorkoutPagination()
    setupFriendsWorkoutPagination()
    fetchFriendRequests()
    searchFriends()
    attachEventListeners()
  }
})

/**
 * Sets up the workout pagination functionality.
 */
function setupWorkoutPagination () {
  const listId = 'myWorkoutList'
  const prevButtonId = 'prevMyWorkouts'
  const nextButtonId = 'nextMyWorkouts'
  setupPagination(listId, prevButtonId, nextButtonId, fetchAndUpdateWorkouts)
}

/**
 * Sets up the friends workout pagination functionality.
 */
function setupFriendsWorkoutPagination () {
  const listId = 'friendsWorkoutsList'
  const prevButtonId = 'prevFriendsWorkouts'
  const nextButtonId = 'nextFriendsWorkouts'
  setupPagination(listId, prevButtonId, nextButtonId, fetchAndUpdateFriendsWorkouts)
}

/**
 * Sets up the pagination functionality for the specified list.
 *
 * @param {string} listId - The ID of the list to paginate.
 * @param {string} prevButtonId - The ID of the "Prev" button.
 * @param {string} nextButtonId - The ID of the "Next" button.
 * @param {Function} fetchFunction - The function to fetch the next page of data.
 */
function setupPagination (listId, prevButtonId, nextButtonId, fetchFunction) {
  let currentPage = 1
  const prevButton = document.getElementById(prevButtonId)
  const nextButton = document.getElementById(nextButtonId)

  prevButton.addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--
      fetchFunction(currentPage)
    }
  })

  nextButton.addEventListener('click', () => {
    currentPage++
    fetchFunction(currentPage)
  })

  fetchFunction(currentPage) // Initial fetch
}

/**
 * Fetches workouts from the server and updates the UI with the results.
 *
 * @param {number} page - The page number to fetch.
 */
function fetchAndUpdateWorkouts (page) {
  console.log(`Fetching user workouts for page: ${page}`)
  fetch(`./dashboard/myWorkouts?page=${page}`, {
    headers: { Accept: 'application/json' }
  })
    .then(response => response.json())
    .then(data => {
      updateWorkoutsUI(data.workouts, 'myWorkoutList')
      if (document.getElementById('prevMyWorkouts') && document.getElementById('nextMyWorkouts')) {
        togglePaginationButtons(data.hasMore, page, 'prevMyWorkouts', 'nextMyWorkouts')
      } else {
        console.error('Pagination buttons not found:', 'prevMyWorkouts', 'nextMyWorkouts')
      }
    })
    .catch(error => console.error('Error fetching workouts:', error))
}

/**
 * Fetches friends workouts from the server and updates the UI with the results.
 *
 * @param {number} page - The page number to fetch.
 */
function fetchAndUpdateFriendsWorkouts (page) {
  console.log(`Fetching friends workouts for page: ${page}`)
  fetch(`./dashboard/friendsWorkouts?page=${page}`, {
    headers: { Accept: 'application/json' }
  })
    .then(response => response.json())
    .then(data => {
      updateWorkoutsUI(data.workouts, 'friendsWorkoutsList')
      if (document.getElementById('prevFriendsWorkouts') && document.getElementById('nextFriendsWorkouts')) {
        togglePaginationButtons(data.hasMore, page, 'prevFriendsWorkouts', 'nextFriendsWorkouts')
      } else {
        console.error('Pagination buttons not found:', 'prevFriendsWorkouts', 'nextFriendsWorkouts')
      }
    })
    .catch(error => console.error('Error fetching friends workouts:', error))
}

/**
 * Toggles the visibility of the pagination buttons based on the specified parameters.
 *
 * @param {boolean} hasMore - True if there are more workouts to load.
 * @param {number} page - The current page number.
 * @param {HTMLElement} prevButtonId - The "Prev" button element.
 * @param {HTMLElement} nextButtonId - The "Next" button element.
 */
function togglePaginationButtons (hasMore, page, prevButtonId, nextButtonId) {
  const prevButton = document.getElementById(prevButtonId)
  const nextButton = document.getElementById(nextButtonId)

  if (!prevButton || !nextButton) {
    console.error('Pagination buttons not found:', prevButtonId, nextButtonId)
    return
  }

  // Show or hide the prev button based on the current page
  prevButton.style.display = page > 1 ? 'inline-block' : 'none'
  // Show or hide the next button based on the hasMore flag
  nextButton.style.display = hasMore ? 'inline-block' : 'none'
}

/**
 * Updates the UI with the specified workouts.
 *
 * @param {Array} workouts - The workouts to display.
 * @param {string} listId - The ID of the list to update.
 */
function updateWorkoutsUI (workouts, listId) {
  const container = document.getElementById(listId)
  container.innerHTML = '' // Clear previous workouts
  workouts.forEach(workout => {
    const workoutElement = document.createElement('div')
    workoutElement.innerHTML = `
      <p><strong>Workout Log:</strong> ${workout.description} <br>
      <strong>Date:</strong> ${new Date(workout.createdAt).toLocaleDateString()}
      <strong>Time:</strong> ${new Date(workout.createdAt).toLocaleTimeString()}
    </p>
    `
    container.appendChild(workoutElement)
  })
}

/**
 * Searches for friends based on the specified username.
 *
 * @param {string} username - The username to search for.
 */
function searchFriends (username) {
  if (!username) {
    console.error('Username is undefined or empty')
    return // Exit the function if username is not valid
  }

  fetch(`./dashboard/searchFriends?username=${username}`)
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok')
      }
      return response.json()
    })
    .then(users => {
      const container = document.getElementById('searchResults')
      container.innerHTML = '' // Clear previous results
      users.forEach(user => {
        const userElement = document.createElement('div')
        userElement.className = 'user-listing'
        userElement.innerHTML = `
          <p>Username: ${user.username}</p>
          <button class="sendFriendRequestBtn" data-recipient-id="${user._id}">Send Friend Request</button>
        `
        container.appendChild(userElement)
      })
      attachEventListeners()
    })
    .catch(error => console.error('Failed to search for friends:', error))
}

/**
 * Attaches event listeners to friend request buttons.
 */
function attachEventListeners () {
  // This function should be called after search results are rendered
  document.querySelectorAll('.sendFriendRequestBtn').forEach(button => {
    button.addEventListener('click', function () {
      const recipientId = this.getAttribute('data-recipient-id')
      sendFriendRequest(recipientId)
    })
  })

  document.querySelectorAll('.acceptFriendRequestBtn').forEach(button => {
    button.addEventListener('click', function () {
      const requesterId = this.getAttribute('data-requester-id')
      acceptFriendRequest(requesterId)
    })
  })

  document.querySelectorAll('.rejectFriendRequestBtn').forEach(button => {
    button.addEventListener('click', function () {
      const requesterId = this.getAttribute('data-requester-id')
      rejectFriendRequest(requesterId)
    })
  })
}

/**
 * Fetches friend requests from the server and displays them in the UI.
 */
function fetchFriendRequests () {
  fetch('/dashboard/friendRequests')
    .then(response => response.json())
    .then(friendRequests => {
      const container = document.getElementById('friendRequestsContainer')
      friendRequests.forEach(requester => {
        const requestElement = document.createElement('div')
        requestElement.innerHTML = `<p>${requester.name}</p>`

        // Create accept button programmatically
        const acceptButton = document.createElement('button')
        acceptButton.textContent = 'Accept'
        acceptButton.addEventListener('click', () => acceptFriendRequest(requester._id))

        // Create reject button programmatically
        const rejectButton = document.createElement('button')
        rejectButton.textContent = 'Reject'
        rejectButton.addEventListener('click', () => rejectFriendRequest(requester._id))

        requestElement.appendChild(acceptButton)
        requestElement.appendChild(rejectButton)
        container.appendChild(requestElement)
      })
    })
    .catch(error => console.error('Failed to fetch friend requests:', error))
}

/**
 * Sends a friend request to the specified user.
 *
 * @param {string} recipientId - The ID of the user to send the friend request to.
 */
function sendFriendRequest (recipientId) {
  fetch(`/dashboard/sendFriendRequest/${recipientId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ recipientId }),
    credentials: 'include'
  })
    .then(response => {
      if (response.ok) {
        alert('Friend request sent successfully.')
        /// Update UI to reflect the request was sent
        document.querySelectorAll(`button[data-recipient-id="${recipientId}"]`).forEach(btn => {
          btn.textContent = 'Request Sent'
          btn.disabled = true
        })
      } else {
        alert('Failed to send friend request.')
      }
    })
    .catch(error => {
      console.error('Error sending friend request:', error)
    })
}

/**
 * Accepts a friend request from the specified user.
 *
 * @param {string} requesterId - The ID of the user who sent the friend request.
 */
function acceptFriendRequest (requesterId) {
  fetch(`/dashboard/acceptFriendRequest/${requesterId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  })
    .then(response => {
      if (response.ok) {
        alert('Friend request accepted.')
        document.querySelectorAll(`div[data-requester-id="${requesterId}"]`).forEach(div => div.remove())
      } else {
        alert('Failed to accept friend request.')
      }
    })
    .catch(error => console.error('Error:', error))
}

/**
 * Rejects a friend request from the specified user.
 *
 * @param {string} requesterId - The ID of the user who sent the friend request.
 */
function rejectFriendRequest (requesterId) {
  fetch(`/dashboard/acceptFriendRequest/${requesterId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  })
    .then(response => {
      if (response.ok) {
        alert('Friend request rejected.')
        document.querySelectorAll(`div[data-requester-id="${requesterId}"]`).forEach(div => div.remove())
      } else {
        alert('Failed to reject friend request.')
      }
    })
    .catch(error => console.error('Error:', error))
}
