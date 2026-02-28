import { Modal } from 'bootstrap'

let modalElement
let modalInstance
let titleElement
let messageElement
let confirmButton
let resolvePending
let wasConfirmed = false

function ensureModal() {
  if (modalElement) return

  modalElement = document.createElement('div')
  modalElement.className = 'modal fade delete-confirm-modal'
  modalElement.id = 'deleteConfirmModal'
  modalElement.tabIndex = -1
  modalElement.setAttribute('aria-labelledby', 'deleteConfirmModalLabel')
  modalElement.setAttribute('aria-hidden', 'true')

  modalElement.innerHTML = `
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content border-0 shadow-lg">
        <div class="modal-body p-4 p-md-5 text-center">
          <div class="delete-confirm-icon mx-auto mb-3">
            <i class="bi bi-trash3-fill"></i>
          </div>
          <h5 class="fw-bold mb-2" id="deleteConfirmModalLabel">Delete document?</h5>
          <p class="text-muted mb-4" id="deleteConfirmModalMessage">Are you sure you want to delete this document? This action cannot be undone.</p>
          <div class="d-grid gap-2 d-sm-flex justify-content-sm-center">
            <button type="button" class="btn btn-light px-4" data-bs-dismiss="modal">Cancel</button>
            <button type="button" class="btn btn-danger px-4" id="deleteConfirmModalButton">Yes, delete it</button>
          </div>
        </div>
      </div>
    </div>
  `

  document.body.appendChild(modalElement)

  titleElement = modalElement.querySelector('#deleteConfirmModalLabel')
  messageElement = modalElement.querySelector('#deleteConfirmModalMessage')
  confirmButton = modalElement.querySelector('#deleteConfirmModalButton')

  modalInstance = new Modal(modalElement, {
    backdrop: true,
    keyboard: true
  })

  confirmButton.addEventListener('click', () => {
    wasConfirmed = true
    modalInstance.hide()
  })

  modalElement.addEventListener('hidden.bs.modal', () => {
    if (resolvePending) {
      resolvePending(wasConfirmed)
      resolvePending = null
    }

    wasConfirmed = false
    confirmButton.disabled = false
    confirmButton.innerHTML = 'Yes, delete it'
  })
}

export function showDeleteConfirmModal({
  title = 'Delete document?',
  message = 'Are you sure you want to delete this document? This action cannot be undone.',
  confirmText = 'Yes, delete it'
} = {}) {
  ensureModal()

  titleElement.textContent = title
  messageElement.textContent = message
  confirmButton.textContent = confirmText

  if (resolvePending) {
    resolvePending(false)
    resolvePending = null
  }

  return new Promise((resolve) => {
    wasConfirmed = false
    resolvePending = resolve
    modalInstance.show()
  })
}
