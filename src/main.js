// Main entry point for the app
import './styles/main.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import { initializeApp } from './services/authService.js'

// App container
let appContainer

// Page routing system
export async function loadPage(pageName, params = {}) {
  if (!appContainer) {
    appContainer = document.getElementById('app')
  }

  // Only show a spinner if the container is empty (initial load).
  // For subsequent navigations the previous page stays visible until
  // the new one is ready, avoiding a jarring flash.
  if (!appContainer.children.length) {
    appContainer.innerHTML = `
      <div class="d-flex justify-content-center align-items-center vh-100">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
      </div>
    `
  }

  try {
    // Parse page name and parameters from URL if needed
    const [page, queryString] = pageName.includes('?') 
      ? pageName.split('?') 
      : [pageName, '']

    const routeParams = {
      ...(queryString ? Object.fromEntries(new URLSearchParams(queryString)) : {}),
      ...params
    }

    // Update document title
    const pageTitle = page.charAt(0).toUpperCase() + page.slice(1)
    document.title = `${pageTitle} - DigitalVault`

    // Dynamically import the page module
    const pageModule = await import(`./pages/${page}.js`)

    // Check if render function exists
    if (typeof pageModule.render !== 'function') {
      throw new Error(`Page module ${page} does not export a render function`)
    }

    // Call render with container + parsed route params
    await pageModule.render(appContainer, routeParams)

    // Scroll to top
    window.scrollTo(0, 0)
  } catch (error) {
    console.error(`Failed to load page ${pageName}:`, error)
    
    appContainer.innerHTML = `
      <div class="container mt-5">
        <div class="alert alert-danger" role="alert">
          <h4 class="alert-heading">Page Not Found</h4>
          <p>Failed to load the requested page.</p>
          <hr>
          <p class="mb-0">Error: ${error.message}</p>
          <button class="btn btn-primary mt-3" onclick="loadPage('dashboard')">Return to Dashboard</button>
        </div>
      </div>
    `
  }
}

// Make loadPage globally available for onclick handlers
window.loadPage = loadPage

// Initialize the app
document.addEventListener('DOMContentLoaded', async () => {
  appContainer = document.getElementById('app')

  // Detect Supabase password-recovery redirect (token arrives in the URL hash)
  const hash = window.location.hash
  if (hash && hash.includes('type=recovery')) {
    // Reuse the existing Supabase client to parse the token
    const { supabase } = await import('./services/authService.js')
    await supabase.auth.getSession() // processes the hash token
    history.replaceState(null, '', window.location.pathname) // clean up URL
    loadPage('resetPassword')
    return
  }

  // Initialize authentication and load appropriate page
  await initializeApp()
})
