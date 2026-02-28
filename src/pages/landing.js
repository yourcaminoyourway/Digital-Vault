import { getCurrentUser, loadPage } from '../services/authService.js'
import { renderNavbar } from '../components/navbar.js'
import { Collapse } from 'bootstrap'

export async function render(container) {
  const { default: html } = await import('./landing.html?raw')
  container.innerHTML = html
  
  // Render navbar inside the placeholder
  const navbarPlaceholder = container.querySelector('#navbar-placeholder')
  if (navbarPlaceholder) {
    await renderNavbar(navbarPlaceholder)
  }

  // Check auth state to update Hero buttons
  const user = await getCurrentUser()
  if (user) {
    const heroContent = container.querySelector('.hero-section .col-lg-8')
    if (heroContent) {
      heroContent.innerHTML = `
        <h1 class="display-3 fw-bold mb-4">Welcome back!</h1>
        <p class="lead mb-5">Your digital vault is ready. Add a new document or manage your existing ones.</p>
        <div class="d-flex justify-content-center gap-3 flex-wrap">
          <button class="btn btn-light btn-lg px-5 fw-bold text-primary shadow-sm" onclick="loadPage('addDocument')">
            <i class="bi bi-plus-lg me-2"></i>Add Document
          </button>
          <button class="btn btn-lg px-5 fw-bold" onclick="loadPage('dashboard')" style="background: rgba(255,255,255,0.15); color: #fff; border: 2px solid rgba(255,255,255,0.5); backdrop-filter: blur(4px);">
            <i class="bi bi-folder2-open me-2"></i>My Documents
          </button>
        </div>
        <p class="mt-4 text-white-50 small">
          Logged in as ${user.email}
        </p>
      `
    }
  }

  // Initialize FAQ accordion collapse triggers
  container.querySelectorAll('.faq-question[data-bs-toggle="collapse"]').forEach(btn => {
    Collapse.getOrCreateInstance(document.querySelector(btn.dataset.bsTarget), { toggle: false })
    btn.addEventListener('click', () => {
      const target = document.querySelector(btn.dataset.bsTarget)
      const instance = Collapse.getOrCreateInstance(target)
      const isExpanded = btn.getAttribute('aria-expanded') === 'true'
      container.querySelectorAll('.faq-question').forEach(other => {
        if (other !== btn) {
          other.setAttribute('aria-expanded', 'false')
          const otherTarget = document.querySelector(other.dataset.bsTarget)
          if (otherTarget) Collapse.getOrCreateInstance(otherTarget).hide()
        }
      })
      if (isExpanded) {
        btn.setAttribute('aria-expanded', 'false')
        instance.hide()
      } else {
        btn.setAttribute('aria-expanded', 'true')
        instance.show()
      }
    })
  })
}
