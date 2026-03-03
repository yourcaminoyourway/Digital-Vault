import { supabase } from './authService.js'

export async function createDocument(document) {
  const { data, error } = await supabase
    .from('documents')
    .insert([document])
    .select()
  
  if (error) throw error
  return data[0]
}

export async function getUserDocuments(userId) {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data
}

export async function getDocument(documentId) {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('id', documentId)
    .single()
  
  if (error) throw error
  return data
}

export async function updateDocument(documentId, updates) {
  const { data, error } = await supabase
    .from('documents')
    .update(updates)
    .eq('id', documentId)
    .select()
  
  if (error) throw error
  return data[0]
}

export async function deleteDocument(documentId) {
  const { error } = await supabase
    .from('documents')
    .delete()
    .eq('id', documentId)
  
  if (error) throw error
}

// ── Admin functions (RLS enforced — only work for admin users) ──

export async function getAllDocuments() {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function getAllUsers() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error

  // Fetch roles separately (user_roles has no FK to profiles)
  const { data: roles } = await supabase
    .from('user_roles')
    .select('user_id, role')

  // Merge roles into profiles
  const rolesMap = new Map((roles || []).map(r => [r.user_id, r.role]))
  return data.map(u => ({ ...u, role: rolesMap.get(u.id) || 'user' }))
}

export async function toggleUserDisabled(userId, disabled) {
  const { error } = await supabase
    .from('profiles')
    .update({ disabled })
    .eq('id', userId)

  if (error) throw error
}
