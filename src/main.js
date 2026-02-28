// Main entry point for the app
import './styles/main.css'
import { initializeApp } from './services/authService.js'

// Initialize the app
document.addEventListener('DOMContentLoaded', async () => {
  const app = document.getElementById('app')
  app.innerHTML = '<h1>Welcome to DigitalVault</h1>'
  
  // Initialize authentication
  await initializeApp()
})
