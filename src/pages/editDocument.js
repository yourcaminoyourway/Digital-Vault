import { getCurrentUser, loadPage } from '../services/authService.js'
import { getDocument, updateDocument } from '../services/documentService.js'
import { renderNavbar } from '../components/navbar.js'

export async function render(container, params = {}) {
  const { default: html } = await import('./editDocument.html?raw')
  container.innerHTML = html

  // Render navbar
  const navbarPlaceholder = container.querySelector('#navbar-placeholder')
  if (navbarPlaceholder) {
    await renderNavbar(navbarPlaceholder)
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

  // Load existing data
  try {
     const doc = await getDocument(docId)
     if (doc) populateForm(doc)
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
    await updateDocument(docId, updates)
    alert('Document updated successfully!')
    loadPage('dashboard')
  } catch (error) {
    console.error('Update failed:', error)
    alert('Failed to update document.')
  }
}
