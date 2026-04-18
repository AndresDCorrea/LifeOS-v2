import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = (url && key) ? createClient(url, key) : null

export async function sbRegister(username, pin) {
  if (!supabase) return { error: 'Sin conexión a Supabase' }
  const { data: ex } = await supabase.from('users').select('id').eq('username', username).maybeSingle()
  if (ex) return { error: 'Ese nombre de usuario ya existe' }
  const { data, error } = await supabase.from('users').insert({ username, pin }).select().single()
  return error ? { error: error.message } : { user: data }
}

export async function sbLogin(username, pin) {
  if (!supabase) return { error: 'Sin conexión a Supabase' }
  const { data, error } = await supabase.from('users').select('*').eq('username', username).eq('pin', pin).maybeSingle()
  return (!data || error) ? { error: 'Usuario o PIN incorrecto' } : { user: data }
}

export async function sbLoadState(userId) {
  if (!supabase) return null
  const { data } = await supabase.from('state').select('data').eq('user_id', userId).maybeSingle()
  return data?.data || null
}

export async function sbSaveState(userId, state) {
  if (!supabase) return
  await supabase.from('state').upsert({ user_id: userId, data: state, updated_at: new Date().toISOString() })
}
