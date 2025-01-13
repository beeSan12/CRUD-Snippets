// ----------------------------------------------------------------------
// Handles the users' registration process.
//
document.addEventListener('DOMContentLoaded', (event) => {
  // Example: Toggling the display of passphrase information
  const toggleButton = document.getElementById('togglePassphraseInfo')
  const infoDiv = document.querySelector('.info-passphrase')

  if (toggleButton) {
    toggleButton.addEventListener('click', () => {
      infoDiv.style.display = infoDiv.style.display === 'none' || !infoDiv.style.display ? 'block' : 'none'
    })
  }

  // Check for 'registration=success' in the URL to clear the form and show a message.
  const urlParams = new URLSearchParams(window.location.search)
  if (urlParams.get('registration') === 'success') {
    const registerForm = document.getElementById('register-form')
    if (registerForm) {
      registerForm.reset() // Clear the form fields.
      alert('Registration successful. Please log in.') // Show a success message.
    }
  }
})
