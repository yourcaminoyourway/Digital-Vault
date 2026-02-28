import { loadPage } from '../services/authService.js'
import { deleteDocument } from '../services/documentService.js'

export function createDocumentCard(doc) {
  const createdDate = new Date(doc.created_at).toLocaleDateString()
  const warrantyExpiry = doc.warranty_expiry ? new Date(doc.warranty_expiry) : null
  const today = new Date()
  const daysUntilExpiry = warrantyExpiry ? Math.ceil((warrantyExpiry - today) / (1000 * 60 * 60 * 24)) : null
  const isExpiringsoon = daysUntilExpiry && daysUntilExpiry <= 30 && daysUntilExpiry > 0
  const isExpired = daysUntilExpiry && daysUntilExpiry <= 0

  const warrantyHTML = warrantyExpiry
    ? `<p class="mb-1">
        <strong>Warranty Expires:</strong> 
        <span class="${isExpired ? 'text-danger fw-bold' : isExpiringoon ? 'text-warning fw-bold' : ''}">
          ${warrantyExpiry.toLocaleDateString()}
          ${isExpired ? ' (EXPIRED)' : isExpiringoon ? ` (${daysUntilExpiry} days)` : ''}
        </span>
      </p>`
    : '<p class="text-muted mb-1">No warranty info</p>'

  return `
    <div class="col-lg-4 col-md-6 col-sm-12 mb-4">
      <div class="card h-100 document-card">
        <div class="card-body d-flex flex-column">
          <h5 class="card-title text-truncate" title="${doc.title}">${doc.title}</h5>
          
          <p class="card-text text-muted small">${doc.description || 'No description provided'}</p>
          
          <div class="mb-3">
            <p class="mb-1"><strong>Item:</strong> ${doc.item_name}</p>
            <p class="mb-1"><strong>Brand:</strong> ${doc.item_brand || 'N/A'}</p>
            <p class="mb-1"><strong>Category:</strong> <span class="badge bg-info">${doc.category}</span></p>
          </div>
          
          ${warrantyHTML}
          
          <p class="text-muted small mb-3">Added: ${createdDate}</p>
          
          <div class="mt-auto d-flex gap-2">
            <button class="btn btn-sm btn-primary flex-grow-1" onclick="loadPage('viewDocument?id=${doc.id}')">
              <i class="bi bi-eye"></i> View
            </button>
            <button class="btn btn-sm btn-warning flex-grow-1" onclick="loadPage('editDocument?id=${doc.id}')">
              <i class="bi bi-pencil"></i> Edit
            </button>
            <button class="btn btn-sm btn-danger" onclick="handleDeleteDocument('${doc.id}')">
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  `
}

export function createDocumentGridHTML(documents) {
  if (!documents || documents.length === 0) {
    return `
      <div class="col-12">
        <div class="alert alert-info" role="alert">
          <h5>No documents yet</h5>
          <p>Start by <a href="#" onclick="loadPage('addDocument')">adding your first document</a></p>
        </div>
      </div>
    `
  }

  return documents.map(doc => createDocumentCard(doc)).join('')
}

// Handler for delete button
export async function handleDeleteDocument(docId) {
  if (confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
    try {
      await deleteDocument(docId)
      // Reload documents after deletion
      location.reload()
    } catch (error) {
      alert('Failed to delete document: ' + error.message)
    }
  }
}

// Make handlers globally available
window.handleDeleteDocument = handleDeleteDocument
