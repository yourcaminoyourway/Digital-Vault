import { signUp, loadPage } from '../services/authService.js'

export async function render(container) {
  const { default: html } = await import('./register.html?raw')
  container.innerHTML = html
  
  document.getElementById('registerForm').addEventListener('submit', handleRegister)
}

async function handleRegister(e) {
  e.preventDefault()
  
  const email = document.getElementById('email').value
  const password = document.getElementById('password').value
  const confirmPassword = document.getElementById('confirmPassword').value
  const submitBtn = e.target.querySelector('button[type="submit"]')
  
  if (password !== confirmPassword) {
    showMessage('Passwords do not match', 'danger')
    return
  }
  
  try {
    submitBtn.disabled = true
    submitBtn.textContent = 'Creating account...'

    const data = await signUp(email, password)

    if (data?.session) {
      showMessage('Registration successful! Redirecting...', 'success')
      await loadPage('dashboard')
      return
    }

    showMessage('Registration successful. Please check your email to confirm your account, then log in.', 'success')
    setTimeout(() => loadPage('login'), 2000)
  } catch (error) {
    showMessage('Registration failed: ' + error.message, 'danger')
  } finally {
    submitBtn.disabled = false
    submitBtn.textContent = 'Register'
  }
}

function showMessage(msg, type) {
  const messageEl = document.getElementById('message')
  messageEl.textContent = msg
  messageEl.className = `alert alert-${type}`
  messageEl.style.display = 'block'
}
