/**
 * Error Handler Utility
 * Provides consistent error handling and user-friendly error messages
 */

export function handleAuthError(error) {
  console.error('Auth Error:', error)

  let message = 'An authentication error occurred'

  if (error.message) {
    const errorMsg = error.message.toLowerCase()

    if (errorMsg.includes('invalid login credentials')) {
      message = 'Invalid email or password. Please try again.'
    } else if (errorMsg.includes('email not confirmed')) {
      message = 'Please confirm your email before logging in.'
    } else if (errorMsg.includes('user already exists')) {
      message = 'An account with this email already exists.'
    } else if (errorMsg.includes('password')) {
      message = 'Password must be at least 8 characters with uppercase, lowercase, and numbers.'
    } else if (errorMsg.includes('network')) {
      message = 'Network error. Please check your connection.'
    } else if (errorMsg.includes('unauthorized')) {
      message = 'You are not authorized to perform this action.'
    } else if (errorMsg.includes('session')) {
      message = 'Your session has expired. Please log in again.'
    } else {
      message = error.message
    }
  }

  return {
    success: false,
    message,
    error
  }
}

export function handleStorageError(error) {
  console.error('Storage Error:', error)

  let message = 'A file storage error occurred'

  if (error.message) {
    const errorMsg = error.message.toLowerCase()

    if (errorMsg.includes('file too large')) {
      message = 'File is too large. Maximum size is 10MB.'
    } else if (errorMsg.includes('invalid')) {
      message = 'Invalid file type. Please upload PDF or image files only.'
    } else if (errorMsg.includes('permission')) {
      message = 'You do not have permission to access this file.'
    } else if (errorMsg.includes('not found')) {
      message = 'File not found.'
    } else if (errorMsg.includes('network')) {
      message = 'Network error during upload. Please try again.'
    } else if (errorMsg.includes('storage')) {
      message = 'Storage service error. Please try again later.'
    } else if (errorMsg.includes('quota')) {
      message = 'Storage quota exceeded. Please delete some files.'
    } else {
      message = error.message
    }
  }

  return {
    success: false,
    message,
    error
  }
}

export function handleDatabaseError(error) {
  console.error('Database Error:', error)

  let message = 'A database error occurred'

  if (error.message) {
    const errorMsg = error.message.toLowerCase()

    if (errorMsg.includes('connection')) {
      message = 'Could not connect to database. Please try again.'
    } else if (errorMsg.includes('constraint')) {
      message = 'This item already exists or violates data rules.'
    } else if (errorMsg.includes('not found')) {
      message = 'The requested item was not found.'
    } else if (errorMsg.includes('permission')) {
      message = 'You do not have permission to access this data.'
    } else if (errorMsg.includes('timeout')) {
      message = 'Request timed out. Please try again.'
    } else if (errorMsg.includes('duplicate')) {
      message = 'This record already exists.'
    } else if (errorMsg.includes('invalid')) {
      message = 'Invalid data provided. Please check your input.'
    } else {
      message = error.message
    }
  }

  return {
    success: false,
    message,
    error
  }
}

export function showErrorAlert(message, options = {}) {
  const {
    containerId = 'message',
    duration = 5000,
    className = 'alert-danger'
  } = options

  const container = document.getElementById(containerId)
  
  if (!container) {
    console.warn(`Alert container with id "${containerId}" not found`)
    return
  }

  container.innerHTML = message
  container.className = `alert ${className} alert-dismissible fade show`
  container.style.display = 'block'

  // Add dismiss button
  const dismissBtn = document.createElement('button')
  dismissBtn.type = 'button'
  dismissBtn.className = 'btn-close'
  dismissBtn.setAttribute('data-bs-dismiss', 'alert')
  dismissBtn.setAttribute('aria-label', 'Close')
  container.appendChild(dismissBtn)

  // Auto-dismiss after duration
  if (duration > 0) {
    setTimeout(() => {
      container.style.display = 'none'
    }, duration)
  }

  // Log to console
  console.error('Error shown to user:', message)
}

export function showSuccessAlert(message, options = {}) {
  const {
    containerId = 'message',
    duration = 3000,
    className = 'alert-success'
  } = options

  const container = document.getElementById(containerId)
  
  if (!container) {
    console.warn(`Alert container with id "${containerId}" not found`)
    return
  }

  container.innerHTML = message
  container.className = `alert ${className} alert-dismissible fade show`
  container.style.display = 'block'

  // Add dismiss button
  const dismissBtn = document.createElement('button')
  dismissBtn.type = 'button'
  dismissBtn.className = 'btn-close'
  dismissBtn.setAttribute('data-bs-dismiss', 'alert')
  dismissBtn.setAttribute('aria-label', 'Close')
  container.appendChild(dismissBtn)

  // Auto-dismiss after duration
  if (duration > 0) {
    setTimeout(() => {
      container.style.display = 'none'
    }, duration)
  }

  // Log to console
  console.log('Success message shown to user:', message)
}

export function showAlert(message, type = 'info', options = {}) {
  const classMap = {
    success: 'alert-success',
    error: 'alert-danger',
    warning: 'alert-warning',
    info: 'alert-info'
  }

  const className = classMap[type] || 'alert-info'
  
  if (type === 'error') {
    showErrorAlert(message, { ...options, className })
  } else if (type === 'success') {
    showSuccessAlert(message, { ...options, className })
  } else {
    showSuccessAlert(message, { ...options, className })
  }
}

export function formatError(error) {
  if (typeof error === 'string') {
    return error
  }

  if (error?.message) {
    return error.message
  }

  if (error?.error?.message) {
    return error.error.message
  }

  return 'An unexpected error occurred'
}

export function logError(context, error) {
  const timestamp = new Date().toISOString()
  const errorInfo = {
    timestamp,
    context,
    message: error?.message || String(error),
    stack: error?.stack,
    code: error?.code
  }

  console.error(`[${context}]`, errorInfo)
  
  // Could send to error tracking service here
  // e.g., Sentry, LogRocket, etc.
  
  return errorInfo
}

export function createErrorMessage(error, defaultMessage = 'An error occurred') {
  return formatError(error) || defaultMessage
}
