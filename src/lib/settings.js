import { supabase } from './supabase'

// In-memory cache
const cache = {}

export async function getSetting(id) {
  if (cache[id]) return cache[id]
  const { data, error } = await supabase
    .from('settings')
    .select('value')
    .eq('id', id)
    .single()
  if (error) return null
  cache[id] = data.value
  return data.value
}

export async function updateSetting(id, value) {
  cache[id] = value
  const { error } = await supabase
    .from('settings')
    .upsert({ id, value, updated_at: new Date().toISOString() })
  if (error) console.error('Failed to save setting:', error)
}

export async function patchSetting(id, patch) {
  const current = await getSetting(id) || {}
  const next    = deepMerge(current, patch)
  await updateSetting(id, next)
  return next
}

function deepMerge(target, source) {
  const result = { ...target }
  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(target[key] || {}, source[key])
    } else {
      result[key] = source[key]
    }
  }
  return result
}

export function subscribeSettings(id, callback) {
  return supabase
    .channel('settings-' + id)
    .on('postgres_changes', {
      event:  '*',
      schema: 'public',
      table:  'settings',
      filter: `id=eq.${id}`,
    }, payload => {
      cache[id] = payload.new.value
      callback(payload.new.value)
    })
    .subscribe()
}
