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


async function handleEditDocument(e, docId) {
  e.preventDefault()
  
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
