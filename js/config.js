// ─────────────────────────────────────────
// Supabase config — edit these two values
// ─────────────────────────────────────────
const SUPABASE_URL     = 'https://pchknwcyuxgsrslymdyq.supabase.co/';
const SUPABASE_ANON_KEY = 'sb_publishable_-9WaIZ0Po8UU31tNdhFCyw_dMG621io';

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
