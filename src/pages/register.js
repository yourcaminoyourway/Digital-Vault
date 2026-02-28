import { signUp, loadPage } from '../services/authService.js'

export async function render(container) {
  const { default: html } = await import('./register.html?raw')
  container.innerHTML = html
  
  document.getElementById('registerForm').addEventListener('submit', handleRegister)

  // Password visibility toggles
  const toggle = (btnId, inputId) => {
    const btn = container.querySelector(`#${btnId}`)
    const input = container.querySelector(`#${inputId}`)
    if (btn && input) {
      btn.addEventListener('click', () => {
        const isPassword = input.type === 'password'
        input.type = isPassword ? 'text' : 'password'
        btn.querySelector('i').className = isPassword ? 'bi bi-eye-slash' : 'bi bi-eye'
      })
    }
  }
  toggle('togglePassword', 'password')
  toggle('toggleConfirm', 'confirmPassword')
}

async function handleRegister(e) {
  e.preventDefault()
  
  const fullName = document.getElementById('fullName')?.value?.trim() || ''
  const email = document.getElementById('email').value
  const password = document.getElementById('password').value
  const confirmPassword = document.getElementById('confirmPassword').value
  const submitBtn = e.target.querySelector('button[type="submit"]')
  
  if (password.length < 8) {
    showMessage('Password must be at least 8 characters.', 'danger')
    return
  }

  if (password !== confirmPassword) {
    showMessage('Passwords do not match.', 'danger')
    return
  }
  
  try {
    submitBtn.disabled = true
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Creating account...'

    const data = await signUp(email, password)

    if (data?.session) {
      showMessage('Account created! Redirecting...', 'success')
      await loadPage('dashboard')
      return
    }

    showMessage('Account created! Please check your email to confirm, then sign in.', 'success')
    setTimeout(() => loadPage('login'), 2000)
  } catch (error) {
    showMessage('Registration failed: ' + error.message, 'danger')
  } finally {
    submitBtn.disabled = false
    submitBtn.innerHTML = '<i class="bi bi-rocket-takeoff me-2"></i>Create Account'
  }
}

function showMessage(msg, type) {
  const messageEl = document.getElementById('message')
  messageEl.textContent = msg
  messageEl.className = `alert alert-${type}`
  messageEl.classList.remove('d-none')
}
