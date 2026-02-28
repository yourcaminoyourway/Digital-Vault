import { getCurrentUser, loadPage } from '../services/authService.js'
import { createDocument } from '../services/documentService.js'
import { uploadFile } from '../services/storageService.js'
import { renderNavbar } from '../components/navbar.js'

export async function render(container) {
  const { default: html } = await import('./addDocument.html?raw')
  container.innerHTML = html

  // Start navbar rendering without blocking
  const navbarPlaceholder = container.querySelector('#navbar-placeholder')
  if (navbarPlaceholder) {
    renderNavbar(navbarPlaceholder)
  }
  
  const form = document.getElementById('addDocForm')
  if (form) {
    form.addEventListener('submit', handleAddDocument)
  }

  // Set up drag & drop and click-to-upload
  setupDropZone()
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

async function handleAddDocument(e) {
  e.preventDefault()
  
  if (!validateDates()) return

  const user = await getCurrentUser()
  
  const title = document.getElementById('title').value
  const description = document.getElementById('description').value
  const category = document.getElementById('category').value
  const itemName = document.getElementById('itemName').value
  const itemBrand = document.getElementById('itemBrand').value
  const purchaseDate = document.getElementById('purchaseDate').value
  const warrantyExpiry = document.getElementById('warrantyExpiry').value
  const file = document.getElementById('file').files[0]
  
  try {
    // Upload file to storage
    const filePath = `${user.id}/${Date.now()}_${file.name}`
    await uploadFile('documents', filePath, file)
    
    // Create document record
    const doc = await createDocument({
      user_id: user.id,
      title,
      description,
      category,
      item_name: itemName,
      item_brand: itemBrand || null,
      purchase_date: purchaseDate || null,
      warranty_expiry: warrantyExpiry || null,
      file_path: filePath
    })
    
    showMessage('Document saved successfully! Redirecting...', 'success')
    setTimeout(() => loadPage('dashboard'), 1500)
  } catch (error) {
    showMessage('Failed to save document: ' + error.message, 'danger')
  }
}

function showMessage(msg, type) {
  const messageEl = document.getElementById('message')
  messageEl.textContent = msg
  messageEl.className = `alert alert-${type}`
  messageEl.style.display = 'block'
}
