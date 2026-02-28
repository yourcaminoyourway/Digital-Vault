import { getCurrentUser, loadPage } from '../services/authService.js'
import { getUserDocuments, deleteDocument } from '../services/documentService.js'
import { renderNavbar } from '../components/navbar.js'
import { getSignedUrl } from '../services/storageService.js'
import { showDeleteConfirmModal } from '../components/deleteConfirmModal.js'

export async function render(container) {
  const { default: html } = await import('./dashboard.html?raw')
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
  
  const addBtn = container.querySelector('#addDocBtn')
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      loadPage('addDocument')
    })
  }
  
  // Setup empty state button too
  const emptyStateBtn = container.querySelector('#emptyState button')
  if (emptyStateBtn) {
    emptyStateBtn.addEventListener('click', () => {
      loadPage('addDocument')
    })
  }
  
  await loadDocuments(user.id)
}

async function loadDocuments(userId) {
  const container = document.getElementById('documentsContainer')
  const loadingState = document.getElementById('loadingState')
  const emptyState = document.getElementById('emptyState')
  
  // Show loading
  if (loadingState) loadingState.classList.remove('d-none')
  if (emptyState) emptyState.classList.add('d-none')
  container.innerHTML = ''

  try {
    // Artificial delay to show loading state (optional, remove in prod)
    // await new Promise(r => setTimeout(r, 500)) 

    const documents = await getUserDocuments(userId)
    
    // Hide loading
    if (loadingState) loadingState.classList.add('d-none')

    if (!documents || documents.length === 0) {
      if (emptyState) emptyState.classList.remove('d-none')
      return
    }
    
    const cards = await Promise.all(documents.map(async (doc) => {
      const createdDate = new Date(doc.created_at).toLocaleDateString(undefined, { 
        year: 'numeric', month: 'short', day: 'numeric' 
      })

      const expiry = getExpiryStatus(doc.warranty_expiry)

      const fileName = doc.file_path ? doc.file_path.split('/').pop() : ''
      const isImage = /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(fileName)
      const isPdf   = /\.pdf$/i.test(fileName)
      const isDoc   = /\.(docx?|odt|rtf|txt)$/i.test(fileName)
      const isSheet = /\.(xlsx?|csv|ods)$/i.test(fileName)
      let previewHtml = ''

      if (isImage && doc.file_path) {
        try {
          const signedUrl = await getSignedUrl('documents', doc.file_path, 3600)
          if (signedUrl) {
            previewHtml = `
              <div class="mb-3 rounded-3 overflow-hidden border" style="height: 140px; background: #f8fafc;">
                <img src="${signedUrl}" alt="${doc.title || 'Document preview'}" style="width: 100%; height: 100%; object-fit: cover;" loading="lazy" />
              </div>
            `
          }
        } catch (e) { /* fall through to file banner */ }
      }

      if (!previewHtml && doc.file_path) {
        // Non-image file — show a styled file-type banner
        let fileIcon = 'bi-file-earmark-text'
        let fileLabel = fileName
        let fileBg = '#f1f5f9'
        let fileIconColor = '#64748b'
        if (isPdf)   { fileIcon = 'bi-file-earmark-pdf';        fileIconColor = '#ef4444'; fileBg = '#fff1f1' }
        if (isDoc)   { fileIcon = 'bi-file-earmark-word';       fileIconColor = '#2563eb'; fileBg = '#eff6ff' }
        if (isSheet) { fileIcon = 'bi-file-earmark-spreadsheet';fileIconColor = '#16a34a'; fileBg = '#f0fdf4' }
        previewHtml = `
          <div class="mb-3 rounded-3 d-flex align-items-center gap-3 px-3" style="height: 64px; background: ${fileBg}; border: 1px solid rgba(0,0,0,0.07);">
            <i class="bi ${fileIcon} fs-2" style="color: ${fileIconColor}; flex-shrink:0;"></i>
            <span class="small fw-semibold text-truncate" style="color: #374151; max-width: 100%;">${fileLabel}</span>
          </div>
        `
      }

      if (!previewHtml) {
        // No file uploaded — show a brief metadata summary
        const purchaseText = doc.purchase_date
          ? new Date(doc.purchase_date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
          : null
        const expiryText = doc.warranty_expiry
          ? new Date(doc.warranty_expiry).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
          : null
        const rows = []
        if (doc.item_brand) rows.push(`<span><i class="bi bi-tag me-1 opacity-50"></i>${doc.item_brand}</span>`)
        if (purchaseText)   rows.push(`<span><i class="bi bi-bag me-1 opacity-50"></i>Bought ${purchaseText}</span>`)
        if (expiryText)     rows.push(`<span><i class="bi bi-hourglass-split me-1 opacity-50"></i>Expires ${expiryText}</span>`)
        if (doc.description) rows.push(`<span class="text-truncate" style="max-width:100%;"><i class="bi bi-chat-left-text me-1 opacity-50"></i>${doc.description.slice(0, 60)}${doc.description.length > 60 ? '…' : ''}</span>`)
        previewHtml = `
          <div class="mb-3 rounded-3 px-3 py-2 d-flex flex-column gap-1" style="height: 64px; justify-content: center; background: #f8fafc; border: 1px dashed #cbd5e1; overflow: hidden;">
            <div class="d-flex flex-wrap gap-3 small text-muted">
              ${rows.length ? rows.join('') : '<span class="text-muted fst-italic">No file attached</span>'}
            </div>
          </div>
        `
      }
      
      // Determine icon based on file type or category
      let iconClass = 'bi-file-earmark-text'
      let iconColor = 'text-primary'
      let bgClass = 'bg-primary-soft'
      
      if (doc.category?.toLowerCase().includes('receipt')) {
        iconClass = 'bi-receipt'
        iconColor = 'text-success'
        bgClass = 'bg-success-soft'
      } else if (doc.category?.toLowerCase().includes('warranty')) {
        iconClass = 'bi-shield-check'
        iconColor = 'text-info'
        bgClass = 'bg-info-soft'
      } else if (doc.category?.toLowerCase().includes('manual')) {
        iconClass = 'bi-book'
        iconColor = 'text-warning'
        bgClass = 'bg-warning-soft' // Ensure this class exists or fallback
      }

      const expiryBadge = expiry.status === 'expired'
        ? `<span class="badge badge-expired"><i class="bi bi-x-circle-fill me-1"></i>Expired</span>`
        : expiry.status === 'soon'
          ? `<span class="badge badge-expiring-soon"><i class="bi bi-clock-fill me-1"></i>Expires in ${expiry.daysLeft}d</span>`
          : ''

      const cardBorderClass = expiry.status === 'expired'
        ? 'border-danger'
        : expiry.status === 'soon'
          ? 'border-warning'
          : 'border'

      return `
      <div class="col-md-6 col-lg-4">
        <div class="card h-100 ${cardBorderClass} hover-shadow transition-all">
          <div class="card-body">
            ${previewHtml}
            <div class="d-flex align-items-start mb-3">
              <div class="rounded-3 p-3 ${bgClass} ${iconColor} me-3">
                <i class="bi ${iconClass} fs-4"></i>
              </div>
              <div class="overflow-hidden flex-grow-1">
                <div class="d-flex align-items-start justify-content-between gap-2">
                  <h5 class="card-title fw-bold mb-1 text-truncate">${doc.title || 'Untitled Document'}</h5>
                  ${expiryBadge}
                </div>
                <p class="text-muted small mb-0">${doc.item_name || 'Unknown Item'} &bull; ${doc.category || 'Uncategorized'}</p>
              </div>
            </div>

            <div class="d-flex align-items-center justify-content-between mt-auto pt-3 border-top">
              <small class="text-muted">
                <i class="bi bi-calendar3 me-1"></i> ${createdDate}
              </small>
              <div class="d-flex gap-2">
                <button class="btn btn-sm btn-outline-primary" data-action="open" data-id="${doc.id}" title="Open">
                  <i class="bi bi-eye me-1"></i>Open
                </button>
                <button class="btn btn-sm btn-outline-secondary" data-action="edit" data-id="${doc.id}" title="Edit">
                  <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" data-action="delete" data-id="${doc.id}" title="Delete">
                  <i class="bi bi-trash"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `
    }))

    container.innerHTML = cards.join('')

    // Build expiry alert banner
    const expiredDocs = documents.filter(d => getExpiryStatus(d.warranty_expiry).status === 'expired')
    const soonDocs = documents.filter(d => getExpiryStatus(d.warranty_expiry).status === 'soon')
    const alertEl = document.getElementById('expiryAlert')
    if (alertEl) {
      const affectedIds = [...expiredDocs, ...soonDocs].map(d => d.id).sort().join(',')
      const dismissKey = `dismissedExpiryAlert:${affectedIds}`
      const isDismissed = affectedIds && localStorage.getItem(dismissKey) === '1'

      const lines = []
      if (expiredDocs.length > 0) {
        const names = expiredDocs.map(d => `<strong>${d.title || 'Untitled'}</strong>`).join(', ')
        lines.push(`<div class="d-flex align-items-start gap-2 mb-1"><i class="bi bi-x-circle-fill text-danger mt-1 flex-shrink-0"></i><span>${expiredDocs.length === 1 ? 'One document has' : `${expiredDocs.length} documents have`} expired: ${names}.</span></div>`)
      }
      if (soonDocs.length > 0) {
        const names = soonDocs.map(d => { const s = getExpiryStatus(d.warranty_expiry); return `<strong>${d.title || 'Untitled'}</strong> (${s.daysLeft}d)` }).join(', ')
        lines.push(`<div class="d-flex align-items-start gap-2 mb-1"><i class="bi bi-clock-fill text-warning mt-1 flex-shrink-0"></i><span>${soonDocs.length === 1 ? 'One document expires' : `${soonDocs.length} documents expire`} soon: ${names}.</span></div>`)
      }

      if (lines.length > 0 && !isDismissed) {
        const alertClass = expiredDocs.length > 0 ? 'alert-expiry-danger' : 'alert-expiry-warning'
        alertEl.innerHTML = `
          <div class="alert ${alertClass} d-flex align-items-start shadow-sm border-0 rounded-3 position-relative" role="alert">
            <i class="bi bi-shield-exclamation fs-4 flex-shrink-0 me-3 mt-1"></i>
            <div class="flex-grow-1">
              <div class="fw-bold mb-1">Warranty Alert</div>
              ${lines.join('')}
            </div>
            <button type="button" class="btn-close ms-3 flex-shrink-0" id="dismissExpiryAlert" aria-label="Dismiss"></button>
          </div>
        `
        document.getElementById('dismissExpiryAlert')?.addEventListener('click', () => {
          localStorage.setItem(dismissKey, '1')
          alertEl.innerHTML = ''
        })
      } else {
        alertEl.innerHTML = ''
      }
    }

    container.onclick = (event) => {
      const target = event.target.closest('[data-action][data-id]')
      if (!target) return

      const { action, id } = target.dataset
      if (!id) return

      if (action === 'open') {
        loadPage(`viewDocument?id=${id}`)
      } else if (action === 'edit') {
        loadPage(`editDocument?id=${id}`)
      } else if (action === 'delete') {
        handleDelete(id, userId)
      }
    }
    
  } catch (error) {
    console.error('Failed to load documents:', error)
    if (loadingState) loadingState.classList.add('d-none')
    container.innerHTML = `
      <div class="col-12">
        <div class="alert alert-danger d-flex align-items-center" role="alert">
          <i class="bi bi-exclamation-triangle-fill flex-shrink-0 me-2"></i>
          <div>
            Failed to load documents. Please try refreshing the page.
          </div>
        </div>
      </div>
    `
  }
}

function getExpiryStatus(warrantyExpiry) {
  if (!warrantyExpiry) return { status: 'none', daysLeft: null }
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const expiry = new Date(warrantyExpiry)
  expiry.setHours(0, 0, 0, 0)
  const daysLeft = Math.round((expiry - today) / (1000 * 60 * 60 * 24))
  if (daysLeft < 0) return { status: 'expired', daysLeft }
  if (daysLeft <= 30) return { status: 'soon', daysLeft }
  return { status: 'ok', daysLeft }
}

async function handleDelete(docId, userId) {
  const confirmed = await showDeleteConfirmModal({
    title: 'Delete document?',
    message: 'Are you sure you want to delete this document? This action cannot be undone.',
    confirmText: 'Yes, delete it'
  })

  if (!confirmed) return

  try {
    await deleteDocument(docId)
    await loadDocuments(userId)
  } catch (error) {
    console.error('Failed to delete document:', error)
    alert('Failed to delete document. Please try again.')
  }
}

