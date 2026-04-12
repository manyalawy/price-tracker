const { createClient } = require('@supabase/supabase-js')
const config = require('./config')

let supabase = null

function getSupabase() {
  if (!supabase) {
    supabase = createClient(config.supabaseUrl, config.supabaseKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  }
  return supabase
}

module.exports = { getSupabase }
