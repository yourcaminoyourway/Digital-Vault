import { getCurrentUser, loadPage, supabase, changePassword, clearDisplayNameCache } from '../services/authService.js'
import { renderNavbar } from '../components/navbar.js'

export async function render(container) {
  const { default: html } = await import('./profile.html?raw')
  container.innerHTML = html

  // Start navbar + auth check in parallel
  const navbarPlaceholder = container.querySelector('#navbar-placeholder')
  const [, user] = await Promise.all([
    navbarPlaceholder ? renderNavbar(navbarPlaceholder) : Promise.resolve(),
    getCurrentUser()
  ])

  if (!user) {
    loadPage('login')
    return
  }

  const emailEl = container.querySelector('#email')
  const profileEmailEl = container.querySelector('#profileEmail')
  const fullNameEl = container.querySelector('#fullName')

  if (emailEl) emailEl.value = user.email || ''
  if (profileEmailEl) profileEmailEl.textContent = user.email || 'User'

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .maybeSingle()

    if (error) throw error

    if (fullNameEl) {
      fullNameEl.value = data?.full_name || user.user_metadata?.full_name || ''
    }
  } catch (error) {
    console.error('Failed to load profile:', error)
  }

  const form = container.querySelector('#profileForm')
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault()
      await saveProfile(user.id)
    })
  }

  // Password visibility toggles
  const toggleBtn = (btnId, inputId) => {
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
  toggleBtn('toggleNew', 'newPassword')
  toggleBtn('toggleConfirm', 'confirmPassword')

  const passwordForm = container.querySelector('#passwordForm')
  if (passwordForm) {
    passwordForm.addEventListener('submit', async (e) => {
      e.preventDefault()
      await updatePassword()
    })
  }
}

async function updatePassword() {
  const newPassword = document.getElementById('newPassword')?.value || ''
  const confirmPassword = document.getElementById('confirmPassword')?.value || ''
  const btn = document.getElementById('changePasswordBtn')
  const msg = document.getElementById('passwordMessage')

  const showMsg = (text, type) => {
    if (!msg) return
    msg.className = `alert alert-${type} mt-3`
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
    if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Updating...' }
    await changePassword(newPassword)
    showMsg('Password updated successfully.', 'success')
    document.getElementById('newPassword').value = ''
    document.getElementById('confirmPassword').value = ''
  } catch (error) {
    console.error('Failed to change password:', error)
    showMsg(error.message || 'Could not update password. Please try again.', 'danger')
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="bi bi-lock me-2"></i>Update Password' }
  }
}

async function saveProfile(userId) {
  const message = document.getElementById('message')
  const saveBtn = document.getElementById('saveBtn')
  const fullName = document.getElementById('fullName')?.value?.trim() || null
  const email = document.getElementById('email')?.value?.trim() || ''

  try {
    if (saveBtn) {
      saveBtn.disabled = true
      saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Saving...'
    }

    // Try update first (profile row usually exists)
    const { data: updated, error: updateError } = await supabase
      .from('profiles')
      .update({ full_name: fullName })
      .eq('id', userId)
      .select()

    if (updateError) throw updateError

    // If no row was updated, insert a new profile
    if (!updated || updated.length === 0) {
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({ id: userId, email, full_name: fullName })

      if (insertError) throw insertError
    }

    // Clear cached display name so navbar picks up the new one
    clearDisplayNameCache()

    showMessage('Profile updated successfully.', 'success')
  } catch (error) {
    console.error('Failed to save profile:', error)
    showMessage(`Could not save profile: ${error.message || error.details || JSON.stringify(error)}`, 'danger')
  } finally {
    if (saveBtn) {
      saveBtn.disabled = false
      saveBtn.innerHTML = '<i class="bi bi-check2 me-2"></i>Save Changes'
    }
  }

  function showMessage(text, type) {
    if (!message) return
    message.className = `alert alert-${type} mt-3`
    message.textContent = text
    message.classList.remove('d-none')
  }
}
