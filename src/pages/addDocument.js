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
    // Show success styling when a file is selected
    if (file) {
      dropZone.style.borderColor = '#198754'
      dropZone.style.backgroundColor = '#f0fdf4'
    }
  }

  const setFile = (file) => {
    if (!allowedTypes.includes(file.type)) {
      alert('Unsupported file type. Please upload a PDF, JPG, or PNG.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('File is too large. Maximum size is 5MB.')
      return
    }
    const dt = new DataTransfer()
    dt.items.add(file)
    fileInput.files = dt.files
    updateDisplay(file)
  }

  // Prevent the file input click from bubbling back to the dropZone
  fileInput.addEventListener('click', (e) => e.stopPropagation())

  // Click or double-click anywhere in the zone to open file picker
  const openPicker = () => fileInput.click()
  dropZone.addEventListener('click', openPicker)
  dropZone.addEventListener('dblclick', openPicker)

  // When file is selected via the OS dialog
  fileInput.addEventListener('change', () => {
    const file = fileInput.files[0]
    if (file) {
      if (!allowedTypes.includes(file.type)) {
        alert('Unsupported file type. Please upload a PDF, JPG, or PNG.')
        fileInput.value = ''
        updateDisplay(null)
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        alert('File is too large. Maximum size is 5MB.')
        fileInput.value = ''
        updateDisplay(null)
        return
      }
      updateDisplay(file)
    }
  })

  // Drag & drop events
  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault()
    e.stopPropagation()
    dropZone.style.backgroundColor = '#e2e6ea'
    dropZone.style.borderColor = '#0d6efd'
  })
  dropZone.addEventListener('dragenter', (e) => {
    e.preventDefault()
    e.stopPropagation()
  })
  dropZone.addEventListener('dragleave', (e) => {
    e.preventDefault()
    e.stopPropagation()
    dropZone.style.backgroundColor = ''
    dropZone.style.borderColor = ''
  })
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault()
    e.stopPropagation()
    dropZone.style.backgroundColor = ''
    dropZone.style.borderColor = ''
    if (e.dataTransfer.files.length) {
      setFile(e.dataTransfer.files[0])
    }
  })
}

async function handleAddDocument(e) {
  e.preventDefault()
  
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
