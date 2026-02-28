import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)

export async function signUp(email, password) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password
  })
  if (error) throw error
  return data
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })
  if (error) throw error
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) throw error
  return user
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

export async function initializeApp() {
  const user = await getCurrentUser()
  if (!user) {
    // Redirect to login
    loadPage('login')
  } else {
    // Load dashboard
    loadPage('dashboard')
  }
}

function loadPage(pageName) {
  const app = document.getElementById('app')
  import(`../pages/${pageName}.js`)
    .then(module => module.render(app))
    .catch(err => console.error(`Failed to load ${pageName}:`, err))
}

export { loadPage }
