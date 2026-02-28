# DigitalVault - GitHub Copilot Instructions

## Project Overview
DigitalVault is a secure document and warranty organizer for homeowners to store digital copies of receipts, warranties, and manuals for appliances and electronics.

## Tech Stack
- Frontend: HTML, CSS, JavaScript, Bootstrap
- Backend: Supabase (database, authentication, storage)
- Build Tool: Vite
- Deployment: Netlify
- API: Supabase RESTful API for database interactions and authentication

## Project Structure
- src/
- ├── main.js                 # App entry point
- ├── pages/                  # Multi-page navigation screens
- │   ├── login.html
- │   ├── register.html
- │   ├── dashboard.html
- │   ├── addDocument.html
- │   ├── viewDocument.html
- │   └── adminPanel.html
- ├── components/             # Reusable UI components
- │   ├── navbar.js
- │   ├── modal.js
- │   └── documentCard.js
- ├── services/              # Business logic
- │   ├── authService.js
- │   ├── documentService.js
- │   └── storageService.js
- ├── utils/                 # Helper functions
- │   ├── validation.js
- │   └── errorHandler.js
- └── styles/
- ├── main.css
- └── variables.css

## Key Architectural Rules
1. Each page should be in a separate HTML/JS file
2. Use modular design - separate concerns (UI, logic, styling)
3. Use Supabase Auth for user authentication with JWT tokens
4. Use Supabase DB for data persistence
5. Use Supabase Storage for PDF and image uploads
6. Implement Row-Level Security (RLS) for database access control
7. Create admin panel with role-based access control

## Database Schema (Initial)
- users table (managed by Supabase Auth)
- user_roles (for RBAC)
- documents table
- categories table
- warranties table
- photos table (for document preview images)

## UI Guidelines
1. Use Bootstrap for responsive design
2. Keep the interface clean and intuitive
3. Use modals for adding/editing documents
4. Provide clear feedback for user actions (success/error messages)
5. Ensure accessibility (ARIA roles, keyboard navigation)
6. Use accordions or tabs for organizing document details
7. Use Google Fonts for typography (e.g., Roboto, Open Sans)
8. Use icons from Google Material Icons for visual cues
9. Use green, blue saturation, and dark color scheme for a modern look

## Development Workflow
1. Plan the feature
2. Create necessary files/structure
3. Use Copilot to implement features
4. Test locally with `npm run dev`
5. Commit changes with descriptive messages
6. Push to GitHub

