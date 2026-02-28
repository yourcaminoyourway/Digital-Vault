import { getCurrentUser, signOut, loadPage, getDisplayName } from '../services/authService.js'

export async function renderNavbar(container) {
  const user = await getCurrentUser()
  const fullName = user ? await getDisplayName() : 'User'
  
  const authLinks = `
    <li class="nav-item">
      <a class="nav-link" href="#" onclick="loadPage('dashboard')">My Documents</a>
    </li>
    <li class="nav-item">
      <a class="nav-link" href="#" onclick="loadPage('addDocument')">Add Document</a>
    </li>
    <li class="nav-item">
      <a class="nav-link d-flex align-items-center gap-2" href="#" onclick="loadPage('profile')" title="Your profile">
        <i class="bi bi-person-circle fs-5"></i>
        <span class="d-none d-lg-inline">${fullName}</span>
      </a>
    </li>
    <li class="nav-item ms-1">
      <button class="btn btn-outline-light btn-sm px-3 fw-semibold" onclick="handleLogout()">
        <i class="bi bi-box-arrow-right me-1"></i>Sign Out
      </button>
    </li>
  `

  const publicLinks = `
    <li class="nav-item">
      <a class="nav-link" href="#" onclick="loadPage('login')">Sign In</a>
    </li>
    <li class="nav-item">
      <a class="nav-link btn btn-primary text-white ms-2 px-3" href="#" onclick="loadPage('register')">Get Started</a>
    </li>
  `

  const navbarHTML = `
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark sticky-top shadow-sm">
      <div class="container">
        <a class="navbar-brand d-flex align-items-center gap-2" href="#" onclick="loadPage('landing')">
          <i class="bi bi-safe2-fill text-primary"></i>
          <strong>DigitalVault</strong>
        </a>
        
        <button class="navbar-toggler border-0" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
          <span class="navbar-toggler-icon"></span>
        </button>
        
        <div class="collapse navbar-collapse" id="navbarNav">
          <ul class="navbar-nav ms-auto align-items-lg-center">
            ${user ? authLinks : publicLinks}
          </ul>
        </div>
      </div>
    </nav>
  `
  
  // If container is an element, set innerHTML. If it's a selector string, find it.
  const target = typeof container === 'string' ? document.querySelector(container) : container
  if (target) {
    target.innerHTML = navbarHTML
  }

  // Attach logout handler globally if not already attached
  if (!window.handleLogout) {
    window.handleLogout = async () => {
      await signOut()
      loadPage('landing')
    }
  }
}

