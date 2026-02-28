export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  
  if (!email || typeof email !== 'string') {
    return { valid: false, message: 'Email is required' }
  }
  
  if (!emailRegex.test(email)) {
    return { valid: false, message: 'Invalid email format' }
  }
  
  return { valid: true, message: 'Email is valid' }
}

export function isValidPassword(password) {
  if (!password || typeof password !== 'string') {
    return { valid: false, message: 'Password is required' }
  }
  
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long' }
  }
  
  const hasUppercase = /[A-Z]/.test(password)
  const hasLowercase = /[a-z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  
  if (!hasUppercase) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' }
  }
  
  if (!hasLowercase) {
    return { valid: false, message: 'Password must contain at least one lowercase letter' }
  }
  
  if (!hasNumber) {
    return { valid: false, message: 'Password must contain at least one number' }
  }
  
  return { valid: true, message: 'Password is valid' }
}

export function isPasswordMatch(pwd1, pwd2) {
  if (!pwd1 || !pwd2) {
    return { valid: false, message: 'Both passwords are required' }
  }
  
  if (pwd1 !== pwd2) {
    return { valid: false, message: 'Passwords do not match' }
  }
  
  return { valid: true, message: 'Passwords match' }
}

export function isValidDate(dateString) {
  if (!dateString || typeof dateString !== 'string') {
    return { valid: false, message: 'Date is required' }
  }
  
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  
  if (!dateRegex.test(dateString)) {
    return { valid: false, message: 'Invalid date format. Use YYYY-MM-DD' }
  }
  
  const date = new Date(dateString)
  
  if (isNaN(date.getTime())) {
    return { valid: false, message: 'Invalid date value' }
  }
  
  return { valid: true, message: 'Date is valid' }
}

export function isValidCurrency(amount) {
  if (amount === '' || amount === null || amount === undefined) {
    return { valid: false, message: 'Amount is required' }
  }
  
  const numAmount = parseFloat(amount)
  
  if (isNaN(numAmount)) {
    return { valid: false, message: 'Amount must be a number' }
  }
  
  if (numAmount < 0) {
    return { valid: false, message: 'Amount cannot be negative' }
  }
  
  const currencyRegex = /^\d+(\.\d{1,2})?$/
  
  if (!currencyRegex.test(numAmount.toFixed(2))) {
    return { valid: false, message: 'Invalid currency format. Use up to 2 decimal places' }
  }
  
  return { valid: true, message: 'Amount is valid' }
}

export function validateFormField(fieldName, value, fieldType = 'text') {
  switch (fieldType) {
    case 'email':
      return isValidEmail(value)
    case 'password':
      return isValidPassword(value)
    case 'date':
      return isValidDate(value)
    case 'currency':
      return isValidCurrency(value)
    case 'text':
      if (!value || !value.trim()) {
        return { valid: false, message: `${fieldName} is required` }
      }
      return { valid: true, message: `${fieldName} is valid` }
    default:
      return { valid: true, message: 'Valid' }
  }
}
