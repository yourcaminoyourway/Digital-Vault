import { signIn, loadPage } from '../services/authService.js'

export async function render(container) {
  const { default: html } = await import('./login.html?raw')
  container.innerHTML = html
  
  document.getElementById('loginForm').addEventListener('submit', handleLogin)

  // Password visibility toggle
  const toggleBtn = container.querySelector('#togglePassword')
  const passwordInput = container.querySelector('#password')
  if (toggleBtn && passwordInput) {
    toggleBtn.addEventListener('click', () => {
      const isPassword = passwordInput.type === 'password'
      passwordInput.type = isPassword ? 'text' : 'password'
      toggleBtn.querySelector('i').className = isPassword ? 'bi bi-eye-slash' : 'bi bi-eye'
    })
  }
}

async function handleLogin(e) {
  e.preventDefault()
  
  const email = document.getElementById('email').value
  const password = document.getElementById('password').value
  const submitBtn = e.target.querySelector('button[type="submit"]')
  
  try {
    submitBtn.disabled = true
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Signing in...'
    await signIn(email, password)
    showMessage('Login successful! Redirecting...', 'success')
    await loadPage('dashboard')
  } catch (error) {
    const details = error?.message?.toLowerCase().includes('email not confirmed')
      ? ' Please confirm your email in Supabase Auth (or disable email confirmations for local testing).'
      : ''
    showMessage('Login failed: ' + error.message + details, 'danger')
  } finally {
    submitBtn.disabled = false
    submitBtn.innerHTML = '<i class="bi bi-box-arrow-in-right me-2"></i>Sign In'
  }
}

function showMessage(msg, type) {
  const messageEl = document.getElementById('message')
  messageEl.textContent = msg
  messageEl.className = `alert alert-${type}`
  messageEl.classList.remove('d-none')
}
