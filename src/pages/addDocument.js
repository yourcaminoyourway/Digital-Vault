import { getCurrentUser, loadPage } from '../services/authService.js'
import { createDocument } from '../services/documentService.js'
import { uploadFile } from '../services/storageService.js'
import { renderNavbar } from '../components/navbar.js'

export async function render(container) {
  const { default: html } = await import('./addDocument.html?raw')
  container.innerHTML = html

  // Render navbar inside the placeholder
  const navbarPlaceholder = container.querySelector('#navbar-placeholder')
  if (navbarPlaceholder) {
    await renderNavbar(navbarPlaceholder)
  }
  
  const form = document.getElementById('addDocForm')
  if (form) {
    form.addEventListener('submit', handleAddDocument)
  }
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
