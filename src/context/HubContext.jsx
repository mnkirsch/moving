import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const HubContext = createContext(null)

export function HubProvider({ children }) {
  const [items, setItems] = useState([])
  const [purchases, setPurchases] = useState([])
  const [loading, setLoading] = useState(true)
  const [syncState, setSyncState] = useState('connecting')

  useEffect(() => {
    fetchAll()
    const unsub = subscribeRealtime()
    return () => unsub()
  }, [])

  async function fetchAll() {
    try {
      const [{ data: itemData, error: iErr }, { data: purchaseData, error: pErr }] = await Promise.all([
        supabase.from('items').select('*, item_options(*)').order('id'),
        supabase.from('purchases').select('*').order('created_at'),
      ])
      if (iErr) throw iErr
      if (pErr) throw pErr
      setItems(itemData)
      setPurchases(purchaseData)
      setSyncState('live')
    } catch (e) {
      setSyncState('error')
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  function subscribeRealtime() {
    const channel = supabase.channel('househub')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'items' }, async () => {
        const { data } = await supabase.from('items').select('*, item_options(*)').order('id')
        if (data) setItems(data)
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'item_options' }, async () => {
        const { data } = await supabase.from('items').select('*, item_options(*)').order('id')
        if (data) setItems(data)
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'purchases' }, async () => {
        const { data } = await supabase.from('purchases').select('*').order('created_at')
        if (data) setPurchases(data)
      })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }

  return (
    <HubContext.Provider value={{ items, setItems, purchases, setPurchases, loading, syncState, setSyncState }}>
      {children}
    </HubContext.Provider>
  )
}

export function useHub() {
  return useContext(HubContext)
}
