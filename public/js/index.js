// ----------------------------------------------------------------------------
// Handles the "active" class on the navigation links.

// import { set } from 'mongoose'

//
document.addEventListener('DOMContentLoaded', () => {
  console.log('index.js is loaded')
  const workoutContainer = document.getElementById('workoutContainer')
  const prevButton = document.getElementById('prevSnippets')
  const nextButton = document.getElementById('nextSnippets')

  if (workoutContainer && prevButton && nextButton) {
    console.log('Workout container and pagination buttons found')
    setupSnippetPagination()
  }

  // Make all currently active items inactive.
  document.querySelectorAll('a.nav-link.active').forEach((a) => {
    a.classList.remove('active')
    a.attributes.removeNamedItem('aria-current')
  })

  // Find the link to the current page and make it active.
  document.querySelectorAll(`a[href$="${location.pathname}"].nav-link`).forEach((a) => {
    a.classList.add('active')
    a.setAttribute('aria-current', 'page')
  })

  // ----------------------------------------------------------------------------
  // Toggle display of additional information
  //
  const toggleButton = document.getElementById('toggleWorkoutInfo')
  const infoDiv = document.querySelector('.info-workout')

  if (toggleButton && infoDiv) {
    toggleButton.addEventListener('click', () => {
      infoDiv.style.display = infoDiv.style.display === 'none' || !infoDiv.style.display ? 'block' : 'none'
    })
  }

  // ----------------------------------------------------------------------------
  // Toggle display of snippets
  //
  document.querySelectorAll('.toggle-more').forEach(button => {
    button.addEventListener('click', function () {
      const moreText = this.previousElementSibling
      moreText.style.display = moreText.style.display === 'none' ? 'inline' : 'none'
      this.textContent = this.textContent === 'Show More' ? 'Show Less' : 'Show More'
    })
  })
  /**
   * Sets up the pagination for the snippets.
   *
   */
  function setupSnippetPagination () {
    let currentPage = 1

    /**
     * Fetches the data for the specified page.
     *
     * @param {number} page - The page number to fetch.
     */
    const fetchPageData = (page) => {
      console.log(`Fetching data for page ${page}`)
      const url = `/snippets?page=${page}`
      fetch(url, {
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
        .then(response => {
          if (!response.ok) {
            throw new Error(`Network response was not ok, status: ${response.status}`)
          }
          const contentType = response.headers.get('Content-Type')
          if (!contentType || !contentType.includes('application/json')) {
            throw new Error(`Expected JSON, but received content type: ${contentType}`)
          }
          return response.json()
        })
        .then(data => {
          console.log('Data:', data)
          const hasMore = data.hasMore
          updateButtonVisibility(hasMore, currentPage)
        })
        .catch(error => console.error('Error fetching data:', error))
    }

    prevButton.addEventListener('click', () => {
      if (currentPage > 1) {
        currentPage--
        fetchPageData(currentPage)
      }
    })

    nextButton.addEventListener('click', () => {
      currentPage++
      fetchPageData(currentPage)
    })
    fetchPageData(currentPage) // Initial fetch
  }

  /**
   * Toggles the visibility of the pagination buttons based on the specified parameters.
   *
   * @param {boolean} hasMore - True if there are more workouts to load.
   * @param {number} currentPage - The current page number.
   */
  function updateButtonVisibility (hasMore, currentPage) {
    // Show or hide "Previous" button
    prevButton.style.display = currentPage > 1 ? 'inline-block' : 'none'
    nextButton.style.display = hasMore ? 'inline-block' : 'none'
  }
})
