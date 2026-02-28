import { signIn, loadPage } from '../services/authService.js'

export async function render(container) {
  const { default: html } = await import('./login.html?raw')
  container.innerHTML = html
  
  document.getElementById('loginForm').addEventListener('submit', handleLogin)
}

async function handleLogin(e) {
  e.preventDefault()
  
  const email = document.getElementById('email').value
  const password = document.getElementById('password').value
  const submitBtn = e.target.querySelector('button[type="submit"]')
  
  try {
    submitBtn.disabled = true
    submitBtn.textContent = 'Logging in...'
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
    submitBtn.textContent = 'Login'
  }
}

function showMessage(msg, type) {
  const messageEl = document.getElementById('message')
  messageEl.textContent = msg
  messageEl.className = `alert alert-${type}`
  messageEl.style.display = 'block'
}
