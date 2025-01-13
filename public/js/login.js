// -------------------------------------------------------------------------
// Handles the users' login process.
//
document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm')
  if (loginForm) {
    loginForm.reset()

    loginForm.addEventListener('submit', function (event) {
      event.preventDefault()
      const formData = new FormData(this)
      const data = {}
      formData.forEach((value, key) => { data[key] = value })

      // const formData = new FormData(this)

      fetch('./login', {
        method: 'POST',
        credentials: 'include',
        //,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
        // body: JSON.stringify(Object.fromEntries(formData))
      })
        .then(response => {
          if (response.ok) {
            console.log('Login successful')
            console.log('response:', response)
            window.location.href = './dashboard' // Redirect on successful login
          } else {
            console.error('Login failed')
            showAlert('Login failed. Please try again.')
          }
        })
        .catch(error => {
          console.error('Error:', error)
          showAlert('An error occurred. Please try again.')
        })
    })
  }

  /**
   * Shows an alert to the user.
   *
   * @param {string} message - The message to show.
   */
  function showAlert (message) {
    const messageContainer = document.getElementById('message-container')
    if (messageContainer) {
      messageContainer.textContent = message
      messageContainer.style.display = 'block'
    }
  }
})
