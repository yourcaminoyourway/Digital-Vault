import { getCurrentUser, loadPage, isAdmin, getUserRole } from '../services/authService.js'
import { getAllDocuments, getAllUsers, toggleUserDisabled, deleteDocument } from '../services/documentService.js'
import { renderNavbar } from '../components/navbar.js'
import { Modal } from 'bootstrap'

let _allDocuments = []
let _usersMap = new Map() // userId → { email, full_name }

export async function render(container) {
  const { default: html } = await import('./adminPanel.html?raw')
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

  // Ensure role is loaded, then guard
  await getUserRole(user.id)
  if (!isAdmin()) {
    loadPage('dashboard')
    return
  }

  // Load data
  await Promise.all([loadUsers(), loadDocuments()])

  // Wire up document search
  const searchInput = container.querySelector('#docSearchInput')
  if (searchInput) {
    searchInput.addEventListener('input', () => filterDocuments(searchInput.value))
  }
}

// ── Users Tab ──

async function loadUsers() {
  const tbody = document.getElementById('usersTableBody')
  try {
    const users = await getAllUsers()

    // Update stats
    const statUsers = document.getElementById('statUsers')
    const statAdmins = document.getElementById('statAdmins')
    if (statUsers) statUsers.textContent = users.length
    if (statAdmins) {
      const adminCount = users.filter(u => u.role === 'admin').length
      statAdmins.textContent = adminCount
    }

    if (!users.length) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-muted">No users found.</td></tr>`
      return
    }

    tbody.innerHTML = users.map(user => {
      const role = user.role || 'user'
      const isDisabled = user.disabled === true
      const joinDate = user.created_at
        ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : '–'

      return `
        <tr class="${isDisabled ? 'table-secondary' : ''}">
          <td>
            <div class="d-flex align-items-center gap-2">
              <i class="bi bi-person-circle fs-5 text-muted"></i>
              <span class="fw-semibold">${escapeHtml(user.full_name || 'Unknown')}</span>
            </div>
          </td>
          <td>${escapeHtml(user.email)}</td>
          <td>
            <span class="badge ${role === 'admin' ? 'bg-warning text-dark' : 'bg-secondary'}">${role}</span>
          </td>
          <td>
            <span class="badge ${isDisabled ? 'bg-danger' : 'bg-success'}">${isDisabled ? 'Disabled' : 'Active'}</span>
          </td>
          <td class="text-muted small">${joinDate}</td>
          <td class="text-end">
            <button class="btn btn-sm ${isDisabled ? 'btn-outline-success' : 'btn-outline-danger'}"
              data-user-id="${user.id}" data-action="toggle-disable" data-disabled="${isDisabled}"
              title="${isDisabled ? 'Enable account' : 'Disable account'}">
              <i class="bi ${isDisabled ? 'bi-person-check' : 'bi-person-slash'}"></i>
              ${isDisabled ? 'Enable' : 'Disable'}
            </button>
          </td>
        </tr>
      `
    }).join('')

    // Attach toggle-disable handlers
    tbody.querySelectorAll('[data-action="toggle-disable"]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const userId = btn.dataset.userId
        const currentlyDisabled = btn.dataset.disabled === 'true'
        btn.disabled = true
        btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span>'
        try {
          await toggleUserDisabled(userId, !currentlyDisabled)
          await loadUsers() // refresh
        } catch (err) {
          console.error('Failed to toggle user:', err)
          alert('Failed to update user status.')
          btn.disabled = false
          btn.innerHTML = currentlyDisabled
            ? '<i class="bi bi-person-check"></i> Enable'
            : '<i class="bi bi-person-slash"></i> Disable'
        }
      })
    })
  } catch (err) {
    console.error('Failed to load users:', err)
    tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-danger">Failed to load users.</td></tr>`
  }
}

// ── Documents Tab ──

async function loadDocuments() {
  const tbody = document.getElementById('documentsTableBody')
  try {
    _allDocuments = await getAllDocuments()

    // Build a users map for owner lookup
    try {
      const users = await getAllUsers()
      _usersMap = new Map(users.map(u => [u.id, u]))
    } catch { /* users tab already loaded separately */ }

    // Update stat
    const statDocs = document.getElementById('statDocs')
    if (statDocs) statDocs.textContent = _allDocuments.length

    renderDocumentsTable(_allDocuments)
  } catch (err) {
    console.error('Failed to load documents:', err)
    tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-danger">Failed to load documents.</td></tr>`
  }
}

function filterDocuments(query) {
  const q = query.toLowerCase().trim()
  if (!q) {
    renderDocumentsTable(_allDocuments)
    return
  }
  const filtered = _allDocuments.filter(doc => {
    const owner = _usersMap.get(doc.user_id)
    const ownerName = owner?.full_name || owner?.email || ''
    return (
      doc.title?.toLowerCase().includes(q) ||
      doc.category?.toLowerCase().includes(q) ||
      ownerName.toLowerCase().includes(q)
    )
  })
  renderDocumentsTable(filtered)
}

function renderDocumentsTable(docs) {
  const tbody = document.getElementById('documentsTableBody')
  if (!docs.length) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-muted">No documents found.</td></tr>`
    return
  }

  tbody.innerHTML = docs.map(doc => {
    const owner = _usersMap.get(doc.user_id)
    const ownerName = owner?.full_name || owner?.email || 'Unknown'
    const createdAt = doc.created_at
      ? new Date(doc.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : '–'

    return `
      <tr>
        <td>
          <a href="#" class="text-decoration-none fw-semibold" data-action="view-doc" data-doc-id="${doc.id}">
            ${escapeHtml(doc.title)}
          </a>
          ${doc.item_name ? `<div class="text-muted small">${escapeHtml(doc.item_name)}</div>` : ''}
        </td>
        <td>${escapeHtml(ownerName)}</td>
        <td><span class="badge bg-light text-dark">${escapeHtml(doc.category || '–')}</span></td>
        <td class="text-muted small">${createdAt}</td>
        <td class="text-end">
          <button class="btn btn-sm btn-outline-primary me-1" data-action="view-doc" data-doc-id="${doc.id}" title="View">
            <i class="bi bi-eye"></i>
          </button>
          <button class="btn btn-sm btn-outline-danger" data-action="delete-doc" data-doc-id="${doc.id}" data-doc-title="${escapeHtml(doc.title)}" title="Delete">
            <i class="bi bi-trash"></i>
          </button>
        </td>
      </tr>
    `
  }).join('')

  // Attach view handlers
  tbody.querySelectorAll('[data-action="view-doc"]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault()
      loadPage('viewDocument', { id: el.dataset.docId })
    })
  })

  // Attach delete handlers
  tbody.querySelectorAll('[data-action="delete-doc"]').forEach(btn => {
    btn.addEventListener('click', () => {
      showDeleteModal(btn.dataset.docId, btn.dataset.docTitle)
    })
  })
}

function showDeleteModal(docId, docTitle) {
  const titleSpan = document.getElementById('adminDeleteDocTitle')
  const confirmBtn = document.getElementById('adminDeleteConfirmBtn')
  if (titleSpan) titleSpan.textContent = docTitle

  const modalEl = document.getElementById('adminDeleteModal')
  if (!modalEl) return

  const modal = new Modal(modalEl)
  modal.show()

  // Replace the confirm button to remove any old listeners
  const newBtn = confirmBtn.cloneNode(true)
  confirmBtn.parentNode.replaceChild(newBtn, confirmBtn)

  newBtn.addEventListener('click', async () => {
    newBtn.disabled = true
    newBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Deleting...'
    try {
      await deleteDocument(docId)
      modal.hide()
      await loadDocuments()
    } catch (err) {
      console.error('Failed to delete document:', err)
      alert('Failed to delete document.')
      newBtn.disabled = false
      newBtn.textContent = 'Delete'
    }
  })
}

// ── Helpers ──

function escapeHtml(text) {
  const div = document.createElement('div')
  div.textContent = text || ''
  return div.innerHTML
}
