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
