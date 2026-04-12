const logger = require('../lib/logger')
const { Sentry } = require('../lib/sentry')

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  logger.error({ err, method: req.method, path: req.path }, err.message)
  Sentry.captureException(err)
  res.status(500).json({ error: 'Internal server error' })
}

module.exports = { errorHandler }
