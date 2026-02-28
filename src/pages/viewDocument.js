import { getCurrentUser, loadPage } from '../services/authService.js'
import { getDocument, deleteDocument } from '../services/documentService.js'
import { downloadFile, getSignedUrl } from '../services/storageService.js'
import { renderNavbar } from '../components/navbar.js'
import { showDeleteConfirmModal } from '../components/deleteConfirmModal.js'
import { Dropdown } from 'bootstrap'

export async function render(container, params = {}) {
  const { default: html } = await import('./viewDocument.html?raw')
  container.innerHTML = html

  // Start navbar rendering (don't block on it)
  const navbarPlaceholder = container.querySelector('#navbar-placeholder')
  const navbarPromise = navbarPlaceholder ? renderNavbar(navbarPlaceholder) : Promise.resolve()
  
  const hashParams = new URLSearchParams(window.location.hash.split('?')[1] || '')
  const docId = params.id || hashParams.get('id')
  
  if (!docId) {
    loadPage('dashboard')
    return
  }

  const loadingState = document.getElementById('loadingState')
  const errorState = document.getElementById('errorState')
  const content = document.getElementById('documentContent')

  try {
    // Fetch document and finish navbar in parallel
    const [doc] = await Promise.all([getDocument(docId), navbarPromise])
    if (!doc) throw new Error('Document not found')

    await displayDocument(doc)

    const actionDropdownToggle = document.querySelector('[data-bs-toggle="dropdown"]')
    if (actionDropdownToggle) {
      Dropdown.getOrCreateInstance(actionDropdownToggle)
    }
    
    // Hide loading, show content
    loadingState.classList.add('d-none')
    content.classList.remove('d-none')

    // Edit handler
    const editBtn = document.getElementById('editAction')
    if (editBtn) {
      editBtn.addEventListener('click', () => {
        loadPage('editDocument', { id: docId })
      })
    }

    // Delete handler
    const deleteBtn = document.getElementById('deleteAction')
    if (deleteBtn) {
      deleteBtn.addEventListener('click', async () => {
        const confirmed = await showDeleteConfirmModal({
          title: 'Delete document?',
          message: 'Are you sure you want to delete this document? This action cannot be undone.',
          confirmText: 'Yes, delete it'
        })

        if (!confirmed) return

        try {
           await deleteDocument(docId)
           loadPage('dashboard')
        } catch (err) {
          alert('Failed to delete document. Please try again.')
          console.error(err)
        }
      })
    }
    
  } catch (error) {
    console.error('Failed to load document:', error)
    loadingState.classList.add('d-none')
    errorState.classList.remove('d-none')
  }
}

async function displayDocument(doc) {
  // Safe text setter
  const setText = (id, text) => {
    const el = document.getElementById(id)
    if (el) el.textContent = text
  }

  setText('docTitle', doc.title || 'Untitled')
  setText('docDescription', doc.description || 'No additional notes.')
  setText('docItemInfo', `${doc.item_name || 'Unknown Item'} • ${doc.item_brand || 'Unknown Brand'}`)
  setText('fileName', doc.file_path ? doc.file_path.split('/').pop() : 'document.file')

  // Date formatting
  const formatDate = (dateString) => {
    if (!dateString) return 'Not set'
    return new Date(dateString).toLocaleDateString(undefined, { 
      year: 'numeric', month: 'long', day: 'numeric' 
    })
  }

  setText('docPurchaseDate', formatDate(doc.purchase_date))
  setText('docExpiryDate', formatDate(doc.warranty_expiry))

  // Badge Logic
  const badge = document.getElementById('docCategoryBadge')
  if (badge) {
    badge.textContent = doc.category || 'Start'
    // Dynamic colors could go here, for now default styling applies
  }

  const fileIconPlaceholder = document.getElementById('fileIconPlaceholder')
  const fileName = doc.file_path ? doc.file_path.split('/').pop() : ''
  const isImage = /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(fileName)

  if (fileIconPlaceholder) {
    if (isImage && doc.file_path) {
      try {
        const signedUrl = await getSignedUrl('documents', doc.file_path, 3600)
        if (signedUrl) {
          fileIconPlaceholder.innerHTML = `
            <img src="${signedUrl}" alt="${doc.title || 'Document image'}" style="max-width: 100%; max-height: 240px; object-fit: contain; border-radius: 0.75rem;" />
            <p class="text-white-50 mt-3 mb-0" id="fileName">${fileName}</p>
          `
        }
      } catch (e) {
        // Keep icon fallback
      }
    } else if (/\.pdf$/i.test(fileName)) {
      fileIconPlaceholder.innerHTML = `
        <i class="bi bi-file-earmark-pdf text-danger" style="font-size: 6rem;"></i>
        <p class="text-white-50 mt-3 mb-0" id="fileName">${fileName || 'document.pdf'}</p>
      `
    } else {
      fileIconPlaceholder.innerHTML = `
        <i class="bi bi-file-earmark-lock2 text-white opacity-50" style="font-size: 6rem;"></i>
        <p class="text-white-50 mt-3 mb-0" id="fileName">${fileName || 'secure_document'}</p>
      `
    }
  }

  // Download functionality
  const downloadBtn = document.getElementById('downloadBtn')
  if (downloadBtn) {
    downloadBtn.addEventListener('click', async () => {
      try {
        const originalText = downloadBtn.innerHTML
        downloadBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>Downloading...`
        downloadBtn.disabled = true
        
        const data = await downloadFile('documents', doc.file_path)
        if (!data) throw new Error('File download failed')

        // Preserve the original file extension from the stored file path
        const originalName = doc.file_path ? doc.file_path.split('/').pop() : ''
        const ext = originalName.includes('.') ? originalName.substring(originalName.lastIndexOf('.')) : ''
        const downloadName = (doc.title || 'download') + ext

        const url = window.URL.createObjectURL(data instanceof Blob ? data : new Blob([data]))
        const a = document.createElement('a')
        a.href = url
        a.download = downloadName
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        a.remove()
        
        downloadBtn.innerHTML = originalText
        downloadBtn.disabled = false
      } catch (err) {
        console.error('Download error:', err)
        alert('Failed to download file.')
        downloadBtn.innerHTML = `<i class="bi bi-download me-2"></i> Download File`
        downloadBtn.disabled = false
      }
    })
  }
}

