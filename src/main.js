// Main entry point for the app
import './styles/main.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import { initializeApp } from './services/authService.js'

// App container
let appContainer

// Flag to prevent pushState when handling popstate (back/forward)
let _isPopping = false

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

    // ── History management ──────────────────────────────────────────
    // Build a URL path from page + params, e.g. /viewDocument?id=abc
    const allParams = { ...routeParams }
    const qs = new URLSearchParams(allParams).toString()
    const url = '/' + page + (qs ? '?' + qs : '')

    if (!_isPopping) {
      // Only push if this isn't triggered by the browser back/forward button
      history.pushState({ page: pageName, params: routeParams }, '', url)
    }

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

// ── Handle browser back / forward buttons ─────────────────────────────
window.addEventListener('popstate', (event) => {
  _isPopping = true
  if (event.state && event.state.page) {
    loadPage(event.state.page, event.state.params || {}).finally(() => {
      _isPopping = false
    })
  } else {
    // No state — try to derive page from the current URL path
    const page = pageFromUrl()
    loadPage(page.name, page.params).finally(() => {
      _isPopping = false
    })
  }
})

/** Derive page name + params from the current URL */
function pageFromUrl() {
  const path = window.location.pathname.replace(/^\/+/, '') || ''
  const search = window.location.search
  const params = search ? Object.fromEntries(new URLSearchParams(search)) : {}
  // Map known page files; fall back to 'landing' for root / unknown
  const validPages = [
    'dashboard', 'viewDocument', 'editDocument', 'addDocument',
    'login', 'register', 'profile', 'landing',
    'forgotPassword', 'resetPassword'
  ]
  const name = validPages.includes(path) ? path : ''
  return { name, params }
}

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

  // ── URL-based initial routing ─────────────────────────────────────
  // If the user lands on e.g. /dashboard or /viewDocument?id=abc,
  // route there directly instead of always starting at landing/dashboard.
  const initial = pageFromUrl()
  if (initial.name) {
    // Replace the current history entry so we don't get a duplicate
    history.replaceState({ page: initial.name, params: initial.params }, '', window.location.href)
    _isPopping = true
    await loadPage(initial.name, initial.params)
    _isPopping = false
    return
  }

  // No recognised page in URL — fall back to auth-based routing
  await initializeApp()
})
