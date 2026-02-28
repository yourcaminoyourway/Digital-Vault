import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
})

// ── In-memory cache to avoid repeated getSession() / profile queries ──
let _cachedUser = undefined   // undefined = not yet fetched, null = no session
let _cachedDisplayName = null // cached profile name

// Listen for auth changes to keep cache in sync
supabase.auth.onAuthStateChange((_event, session) => {
  _cachedUser = session?.user ?? null
  if (!session) _cachedDisplayName = null
})

async function ensureUserSetup(user) {
  if (!user?.id) return

  const fullName =
    user.user_metadata?.full_name ||
    user.email?.split('@')?.[0] ||
    'User'

  // Keep setup resilient: do not block auth if optional tables/policies are not ready.
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert(
      {
        id: user.id,
        email: user.email ?? null,
        full_name: fullName
      },
      { onConflict: 'id' }
    )

  if (profileError) {
    console.warn('Profile setup skipped:', profileError.message)
  }
}

export async function signUp(email, password) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: window.location.origin
    }
  })
  if (error) throw error

  if (!data?.user) {
    throw new Error('Registration failed. Please try again.')
  }

  // Supabase can return a user with empty identities when account already exists.
  if (Array.isArray(data.user.identities) && data.user.identities.length === 0) {
    throw new Error('This email is already registered. Please log in instead.')
  }

  // If email confirmation is off, session exists now. If on, we will also run setup on first login.
  if (data.session) {
    await ensureUserSetup(data.user)
  }

  return data
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })
  if (error) throw error
  if (!data?.session) {
    throw new Error('Login succeeded but no session was created. Please verify your email and try again.')
  }

  await ensureUserSetup(data.user)

  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function changePassword(newPassword) {
  const { data, error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) throw error
  return data
}

export async function sendPasswordResetEmail(email) {
  const redirectTo = `${window.location.origin}${window.location.pathname}`
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })
  if (error) throw error
}

export async function getCurrentUser() {
  // Return cached user if we've already fetched this session
  if (_cachedUser !== undefined) return _cachedUser

  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) {
      console.error('Error getting user:', error)
      _cachedUser = null
      return null
    }
    _cachedUser = session?.user ?? null
    return _cachedUser
  } catch (error) {
    console.error('Error in getCurrentUser:', error)
    _cachedUser = null
    return null
  }
}

/**
 * Returns the user's display name (cached after first fetch).
 * Falls back to email if profile lookup fails.
 */
export async function getDisplayName() {
  if (_cachedDisplayName) return _cachedDisplayName

  const user = await getCurrentUser()
  if (!user) return 'User'

  try {
    const { data } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .maybeSingle()
    _cachedDisplayName = data?.full_name || user.email || 'User'
  } catch {
    _cachedDisplayName = user.email || 'User'
  }
  return _cachedDisplayName
}

/** Clear the display name cache (e.g. after profile update) */
export function clearDisplayNameCache() {
  _cachedDisplayName = null
}

export async function getUserRole(userId) {
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .single()
  
  if (error) return 'user' // default role
  return data.role
}

export async function loadPage(pageName, params = {}) {
  const main = await import('../main.js')
  return main.loadPage(pageName, params)
}

export async function initializeApp() {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      // Redirect to landing page for new users
      loadPage('landing')
    } else {
      // Load dashboard for authenticated users
      loadPage('dashboard')
    }
  } catch (error) {
    console.error('Failed to initialize app:', error)
    // Still load landing page on error
    try {
      const { loadPage } = await import('../main.js')
      loadPage('landing')
    } catch (e) {
      console.error('Failed to load landing page:', e)
    }
  }
}
