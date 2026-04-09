require('dotenv').config()

function requireEnv(key) {
  const value = process.env[key]
  if (!value) throw new Error(`Missing required environment variable: ${key}`)
  return value
}

const config = Object.freeze({
  supabaseUrl: requireEnv('SUPABASE_URL'),
  supabaseKey: requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
  anthropicKey: requireEnv('ANTHROPIC_API_KEY'),
  resendKey: requireEnv('RESEND_API_KEY'),
  apiKey: requireEnv('API_KEY'),
  port: parseInt(process.env.PORT, 10) || 3001,
})

module.exports = config
