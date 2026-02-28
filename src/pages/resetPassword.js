import { supabase, loadPage } from '../services/authService.js'

export async function render(container) {
  const { default: html } = await import('./resetPassword.html?raw')
  container.innerHTML = html

  // The recovery session is set by Supabase via the URL hash before this page loads.
  // Verify we actually have a valid recovery session.
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    document.getElementById('resetForm')?.classList.add('d-none')
    document.getElementById('invalidState')?.classList.remove('d-none')
    return
  }

  // Toggle password visibility
  const toggleVisibility = (btnId, inputId) => {
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
  toggleVisibility('toggleNew', 'newPassword')
  toggleVisibility('toggleConfirm', 'confirmPassword')

  const form = container.querySelector('#resetForm')
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault()
      await handleUpdate()
    })
  }
}

async function handleUpdate() {
  const newPassword = document.getElementById('newPassword')?.value || ''
  const confirmPassword = document.getElementById('confirmPassword')?.value || ''
  const btn = document.getElementById('resetBtn')
  const msg = document.getElementById('resetMessage')
  const form = document.getElementById('resetForm')
  const successState = document.getElementById('successState')

  const showMsg = (text, type) => {
    if (!msg) return
    msg.className = `alert alert-${type}`
    msg.textContent = text
    msg.classList.remove('d-none')
  }

  if (newPassword.length < 8) {
    showMsg('Password must be at least 8 characters.', 'danger')
    return
  }
  if (newPassword !== confirmPassword) {
    showMsg('Passwords do not match.', 'danger')
    return
  }

  try {
    if (btn) {
      btn.disabled = true
      btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Updating...'
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) throw error

    if (form) form.classList.add('d-none')
    if (successState) successState.classList.remove('d-none')
  } catch (error) {
    console.error('Password update error:', error)
    showMsg(error.message || 'Could not update password. The link may have expired.', 'danger')
  } finally {
    if (btn) {
      btn.disabled = false
      btn.innerHTML = '<i class="bi bi-lock me-2"></i>Update Password'
    }
  }
}
