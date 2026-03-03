# DigitalVault — Secure Document & Warranty Organizer

## Project Description

DigitalVault is a web application that allows homeowners to securely store and organize digital copies of receipts, warranties, manuals, and insurance documents for their appliances and electronics.

Users can upload PDF, JPG or PNG files, track warranty expiry dates, and manage all their important documents from a single dashboard. An admin role provides oversight of all users and documents.

### Who Can Do What

| Role | Capabilities |
|------|-------------|
| **Guest** | View landing page, register an account, log in, reset password |
| **User** | Upload documents (PDF/JPG/PNG), view/edit/delete own documents, search & filter, manage profile, receive warranty expiry alerts |
| **Admin** | All user capabilities **plus** view all users and documents, disable/enable user accounts, delete any document via the Admin Panel |

---

## Architecture

```
┌─────────────────────────────────────────┐
│            Browser (SPA)                │
│   HTML + CSS + Vanilla JS + Bootstrap 5 │
│            Built with Vite              │
├─────────────────────────────────────────┤
│           Supabase Backend              │
│  ┌───────────┬────────────┬───────────┐ │
│  │   Auth    │  Database  │  Storage  │ │
│  │  (JWT)    │ (Postgres  │ (S3-like  │ │
│  │           │  + RLS)    │  buckets) │ │
│  └───────────┴────────────┴───────────┘ │
├─────────────────────────────────────────┤
│          Deployed on Netlify            │
│    (SPA redirects, security headers)    │
└─────────────────────────────────────────┘
```

### Technologies Used

| Layer | Technology |
|-------|-----------|
| **Front-end** | HTML, CSS, JavaScript (vanilla), Bootstrap 5, Bootstrap Icons |
| **Build tool** | [Vite](https://vitejs.dev/) |
| **Back-end / BaaS** | [Supabase](https://supabase.com/) — Auth, PostgreSQL database, object storage |
| **Database** | PostgreSQL (hosted by Supabase) with Row-Level Security (RLS) |
| **File storage** | Supabase Storage — private `documents` bucket with signed URLs |
| **Deployment** | [Netlify](https://www.netlify.com/) — automatic builds, SPA redirects, security headers |
| **PDF rendering** | [pdf.js](https://mozilla.github.io/pdf.js/) via CDN — used for thumbnail previews |

### Front-end Routing

The app uses a custom SPA router in `src/main.js`. The `loadPage()` function dynamically imports page modules based on URL paths. Each page module exports a `render(container, params)` function. Browser back/forward navigation is handled via the History API (`pushState` / `popstate`).

---

## Database Schema Design

```
┌──────────────────────┐
│     auth.users       │     (Managed by Supabase Auth)
│ (Supabase internal)  │
│                      │
│  id (uuid, PK)       │
│  email               │
│  encrypted_password  │
│  ...                 │
└──────┬───────────────┘
       │
       │ 1 ──── 1
       ▼
┌──────────────────────┐
│      profiles        │
├──────────────────────┤
│  id        (PK, FK)  │──→ auth.users.id
│  email     (text)    │
│  full_name (text)    │
│  disabled  (boolean) │
│  created_at(timestamptz)│
└──────────────────────┘
       │
       │ 1 ──── 1
       ▼
┌──────────────────────┐
│     user_roles       │
├──────────────────────┤
│  user_id  (PK, FK)   │──→ auth.users.id
│  role     (text)     │     'admin' | 'user'
└──────────────────────┘

       │
       │ 1 ──── N
       ▼
┌──────────────────────────┐
│        documents         │
├──────────────────────────┤
│  id             (uuid PK)│
│  user_id        (FK)     │──→ auth.users.id
│  title          (text)   │
│  description    (text)   │
│  category       (text)   │  'Warranty' | 'Receipt' | 'Manual' | 'Insurance' | 'Other'
│  item_name      (text)   │
│  item_brand     (text)   │
│  purchase_date  (date)   │
│  warranty_expiry(date)   │
│  file_path      (text)   │  → path in Supabase Storage bucket
│  created_at     (timestamptz)│
└──────────────────────────┘
```

### Row-Level Security (RLS)

- **documents**: Users can only `SELECT`, `INSERT`, `UPDATE`, `DELETE` their own rows (`user_id = auth.uid()`).
- **profiles**: Users can read/update only their own profile.
- **user_roles**: Read-only for authenticated users; admin write access managed via service role.
- **Storage**: File access is scoped to each user's own `{user_id}/` folder within the `documents` bucket.

---

## Local Development Setup Guide

### Prerequisites

- **Node.js** ≥ 18
- **npm** ≥ 9
- A **Supabase** project (free tier works) with Auth, Database, and Storage enabled

### Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourcaminoyourway/Digital-Vault.git
   cd Digital-Vault
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**

   Create a `.env.local` file at the project root:
   ```env
   VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
   VITE_SUPABASE_ANON_KEY=<your-anon-key>
   ```
   You can find these values in your Supabase dashboard under **Settings → API**.

4. **Set up the database**

   In your Supabase SQL Editor, create the required tables (`profiles`, `user_roles`, `documents`) and enable Row-Level Security. See the schema diagram above for column definitions.

5. **Create a Storage bucket**

   In Supabase Dashboard → Storage, create a **private** bucket named `documents`.

6. **Start the development server**
   ```bash
   npm run dev
   ```
   The app opens at `http://localhost:5173`.

7. **Build for production**
   ```bash
   npm run build
   ```
   Output goes to `dist/`. Netlify deploys this automatically on push.

### Test Accounts

Refer to [`docs/TEST_SETUP.md`](docs/TEST_SETUP.md) for instructions on creating admin and test user accounts.

---

## Key Folders and Files

```
Digital-Vault/
├── index.html                  # App shell — mounts the #app div, loads main.js
├── vite.config.js              # Vite dev server and build configuration
├── netlify.toml                # Netlify build, headers, and redirect settings
├── package.json                # Dependencies (Supabase, Bootstrap, Vite) and scripts
│
├── public/
│   └── _redirects              # Netlify SPA fallback redirect rule
│
├── docs/
│   ├── copilot-instructions.md # Coding guidelines and project conventions
│   └── TEST_SETUP.md           # Manual testing guide with SQL scripts
│
├── supabase/
│   └── migrations/             # SQL migration files for database schema
│
└── src/
    ├── main.js                 # App entry point — SPA router, history management
    │
    ├── components/             # Reusable UI components
    │   ├── navbar.js           # Navigation bar (auth-aware, shows admin link for admins)
    │   ├── documentCard.js     # Document card template used on the dashboard
    │   └── deleteConfirmModal.js  # Reusable delete confirmation dialog
    │
    ├── pages/                  # Page modules — each exports a render() function
    │   ├── landing.html / .js      # Public landing page (hero, features, FAQ)
    │   ├── login.html / .js        # Login form
    │   ├── register.html / .js     # Registration form
    │   ├── forgotPassword.html / .js  # Request password reset
    │   ├── resetPassword.html / .js   # Set a new password
    │   ├── dashboard.html / .js    # User's document grid with search, filters, expiry alerts
    │   ├── addDocument.html / .js  # Upload new document (drag & drop support)
    │   ├── editDocument.html / .js # Edit existing document metadata & file
    │   ├── viewDocument.html / .js # Document detail view with file download
    │   ├── profile.html / .js      # User profile and settings
    │   └── adminPanel.html / .js   # Admin: manage users and all documents
    │
    ├── services/               # Supabase API wrappers
    │   ├── authService.js      # Auth (sign in/up/out, password reset), role checks, session caching
    │   ├── documentService.js  # CRUD for documents + admin queries (getAllDocuments, getAllUsers)
    │   └── storageService.js   # File upload, download, delete, signed URL generation
    │
    ├── utils/                  # Helper utilities
    │   ├── errorHandler.js     # Centralized error formatting and alert display
    │   ├── pdfPreview.js       # PDF thumbnail rendering with pdf.js
    │   └── validation.js       # Form input validation helpers
    │
    └── styles/
        └── main.css            # Global styles, Bootstrap overrides, page-specific styles
```

| File | Purpose |
|------|---------|
| `src/main.js` | Bootstraps the app, defines the SPA router (`loadPage`), handles browser history |
| `src/services/authService.js` | Wraps Supabase Auth — sign in/up/out, password reset, role caching, session management |
| `src/services/documentService.js` | CRUD operations on the `documents` table, plus admin functions for user management |
| `src/services/storageService.js` | File operations on the Supabase Storage `documents` bucket (upload, download, signed URLs) |
| `src/components/navbar.js` | Renders the top navbar — different links for guests, users, and admins |
| `src/utils/errorHandler.js` | Converts Supabase errors into user-friendly messages and displays Bootstrap alerts |
| `netlify.toml` | Configures the Netlify build command, publish directory, security headers, and SPA redirect |

---

## License

ISC
