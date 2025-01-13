// ------------------------------------------------------------------------
// Handles the users' logout process.
//
document.addEventListener('DOMContentLoaded', () => {
  const logoutForm = document.getElementById('logoutForm')
  if (logoutForm) {
    logoutForm.addEventListener('submit', function (event) {
      event.preventDefault() // Prevent default anchor behavior
      fetch('./logout', { // Adjust according to your base URL if needed
        method: 'POST',
        credentials: 'include' // Important for session cookies

      })
        .then(response => {
          if (response.ok) {
            console.log('Logout successful')
            window.location.href = './login' // Redirect on successful login
          } else {
            console.error('Logout failed')
          }
        })
        .catch(error => console.error('Error:', error))
    })
  }
})
