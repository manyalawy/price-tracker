const { apiKey: validKey } = require('../lib/config')

function requireApiKey(req, res, next) {
  const key = req.headers['x-api-key']
  if (!key || key !== validKey) {
    return res.status(401).json({ error: 'Unauthorized: invalid or missing API key.' })
  }
  next()
}

module.exports = { requireApiKey }
