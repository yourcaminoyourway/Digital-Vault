import { getCurrentUser, loadPage } from '../services/authService.js'
import { getDocument, updateDocument } from '../services/documentService.js'
import { uploadFile, deleteFile } from '../services/storageService.js'
import { renderNavbar } from '../components/navbar.js'

let currentDoc = null

export async function render(container, params = {}) {
  const { default: html } = await import('./editDocument.html?raw')
  container.innerHTML = html

  // Start navbar rendering without blocking
  const navbarPlaceholder = container.querySelector('#navbar-placeholder')
  if (navbarPlaceholder) {
    renderNavbar(navbarPlaceholder)
  }

  const hashParams = new URLSearchParams(window.location.hash.split('?')[1] || '')
  const docId = params.id || hashParams.get('id')

  if (!docId) {
    loadPage('dashboard')
    return
  }
  
  const form = document.getElementById('editDocForm')
  if (form) {
    form.addEventListener('submit', (e) => handleEditDocument(e, docId))
  }

  // Set up drag & drop
  setupDropZone()

  // Load existing data
  try {
     const doc = await getDocument(docId)
     if (doc) {
       currentDoc = doc
       populateForm(doc)
     }
  } catch (err) {
    console.error('Failed to load doc for edit', err)
    alert('Could not load document details.')
  }
}

function populateForm(doc) {
  document.getElementById('title').value = doc.title || ''
  document.getElementById('description').value = doc.description || ''
  document.getElementById('category').value = doc.category || ''
  document.getElementById('itemName').value = doc.item_name || ''
  document.getElementById('itemBrand').value = doc.item_brand || ''
  document.getElementById('purchaseDate').value = doc.purchase_date ? doc.purchase_date.split('T')[0] : ''
  document.getElementById('warrantyExpiry').value = doc.warranty_expiry ? doc.warranty_expiry.split('T')[0] : ''

  // Show current file name
  const currentFileName = document.getElementById('currentFileName')
  if (currentFileName && doc.file_path) {
    const name = doc.file_path.split('/').pop()
    currentFileName.textContent = `Current file: ${name}`
  }
}

function setupDropZone() {
  const dropZone = document.getElementById('dropZone')
  const fileInput = document.getElementById('file')
  const fileNameDisplay = document.getElementById('fileNameDisplay')
  if (!dropZone || !fileInput) return

  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png']

  const updateDisplay = (file) => {
    if (fileNameDisplay) {
      fileNameDisplay.textContent = file ? file.name : ''
    }
    if (file) {
      dropZone.style.borderColor = '#198754'
      dropZone.style.backgroundColor = '#f0fdf4'
    } else {
      dropZone.style.borderColor = ''
      dropZone.style.backgroundColor = ''
    }
  }

  const validateAndSet = (file) => {
    if (!allowedTypes.includes(file.type)) {
      alert('Unsupported file type. Please upload a PDF, JPG, or PNG.')
      return false
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('File is too large. Maximum size is 5MB.')
      return false
    }
    const dt = new DataTransfer()
    dt.items.add(file)
    fileInput.files = dt.files
    updateDisplay(file)
    return true
  }

  // ── Click handling ──
  // Move file input outside the dropZone so its click doesn't bubble
  dropZone.parentNode.appendChild(fileInput)

  dropZone.addEventListener('click', () => {
    fileInput.click()
  })

  fileInput.addEventListener('change', () => {
    const file = fileInput.files[0]
    if (file) {
      if (!validateAndSet(file)) {
        fileInput.value = ''
        updateDisplay(null)
      }
    }
  })

  // ── Drag & drop ──
  let dragCounter = 0

  dropZone.addEventListener('dragenter', (e) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter++
    dropZone.style.backgroundColor = '#e2e6ea'
    dropZone.style.borderColor = '#0d6efd'
  })

  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault()
    e.stopPropagation()
  })

  dropZone.addEventListener('dragleave', (e) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter--
    if (dragCounter <= 0) {
      dragCounter = 0
      dropZone.style.backgroundColor = ''
      dropZone.style.borderColor = ''
    }
  })

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter = 0
    dropZone.style.backgroundColor = ''
    dropZone.style.borderColor = ''
    const file = e.dataTransfer.files[0]
    if (file) validateAndSet(file)
  })
}

function validateDates() {
  const purchaseDate = document.getElementById('purchaseDate')?.value
  const warrantyExpiry = document.getElementById('warrantyExpiry')?.value

  const checkYear = (dateStr, fieldName) => {
    if (!dateStr) return true
    const year = new Date(dateStr).getFullYear()
    if (year < 1900 || year > 2099) {
      alert(`${fieldName}: Year must be between 1900 and 2099.`)
      return false
    }
    return true
  }

  if (!checkYear(purchaseDate, 'Purchase Date')) return false
  if (!checkYear(warrantyExpiry, 'Warranty Expiry Date')) return false
  return true
}


async function handleEditDocument(e, docId) {
  e.preventDefault()
  
  if (!validateDates()) return

  const title = document.getElementById('title').value
  const description = document.getElementById('description').value
  const category = document.getElementById('category').value
  const itemName = document.getElementById('itemName').value
  const itemBrand = document.getElementById('itemBrand').value
  const purchaseDate = document.getElementById('purchaseDate').value
  const warrantyExpiry = document.getElementById('warrantyExpiry').value
  const file = document.getElementById('file').files[0]
  
  const updates = {
    title,
    description,
    category,
    item_name: itemName,
    item_brand: itemBrand,
    purchase_date: purchaseDate || null,
    warranty_expiry: warrantyExpiry || null
  }

  try {
    // If a new file was selected, upload it and update the file_path
    if (file) {
      const user = await getCurrentUser()
      const newFilePath = `${user.id}/${Date.now()}_${file.name}`
      await uploadFile('documents', newFilePath, file)

      // Delete the old file if it exists
      if (currentDoc?.file_path) {
        try {
          await deleteFile('documents', currentDoc.file_path)
        } catch (delErr) {
          console.warn('Could not delete old file:', delErr)
        }
      }

      updates.file_path = newFilePath
    }

    await updateDocument(docId, updates)
    alert('Document updated successfully!')
    loadPage('dashboard')
  } catch (error) {
    console.error('Update failed:', error)
    alert('Failed to update document.')
  }
}
