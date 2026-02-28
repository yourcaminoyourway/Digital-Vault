import { sendPasswordResetEmail } from '../services/authService.js'

export async function render(container) {
  const { default: html } = await import('./forgotPassword.html?raw')
  container.innerHTML = html

  const form = container.querySelector('#forgotForm')
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault()
      await handleReset()
    })
  }
}

async function handleReset() {
  const email = document.getElementById('resetEmail')?.value?.trim()
  const btn = document.getElementById('sendBtn')
  const msg = document.getElementById('forgotMessage')
  const form = document.getElementById('forgotForm')
  const successState = document.getElementById('successState')
  const sentToEmail = document.getElementById('sentToEmail')

  const showMsg = (text, type) => {
    if (!msg) return
    msg.className = `alert alert-${type}`
    msg.textContent = text
    msg.classList.remove('d-none')
  }

  if (!email) {
    showMsg('Please enter your email address.', 'danger')
    return
  }

  try {
    if (btn) {
      btn.disabled = true
      btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Sending...'
    }

    await sendPasswordResetEmail(email)

    // Show success state
    if (form) form.classList.add('d-none')
    if (successState) successState.classList.remove('d-none')
    if (sentToEmail) sentToEmail.textContent = email
  } catch (error) {
    console.error('Password reset error:', error)
    showMsg(error.message || 'Could not send reset email. Please try again.', 'danger')
  } finally {
    if (btn) {
      btn.disabled = false
      btn.innerHTML = '<i class="bi bi-send me-2"></i>Send Reset Link'
    }
  }
}
