const Sentry = require('@sentry/node')

function initSentry() {
  if (!process.env.SENTRY_DSN) return
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: 1.0,
  })
}

module.exports = { initSentry, Sentry }
